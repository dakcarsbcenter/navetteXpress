export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { quotesTable, rolePermissionsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { desc, and, eq } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { QUOTE_SERVICE_IDS } from '@/lib/quote-services';
import { guardPublicFormSubmission } from '@/lib/security/publicFormGuard';

// Le service est contraint à la liste partagée (src/lib/quote-services.ts) :
// c'est ce qui garantit que /contact et /quote-request écrivent le même
// vocabulaire dans la colonne `service`, et que l'admin retrouve toujours un
// libellé et une icône corrects.
const QuoteRequestSchema = z.object({
  customerName: z.string().trim().min(2, 'Nom trop court').max(120),
  customerEmail: z.string().trim().max(180),
  customerPhone: z.string().trim().max(30).nullish(),
  service: z.enum(QUOTE_SERVICE_IDS),
  preferredDate: z.string().trim().max(40).nullish(),
  message: z.string().trim().min(1).max(4000),
  estimatedPrice: z.union([z.number(), z.string()]).nullish(),
  // Champs anti-bot (voir src/lib/security/publicFormGuard.ts)
  companyWebsite: z.string().max(200).optional(),
  formStartedAt: z.number().optional(),
}).strict();

// Fonction pour vérifier les permissions dynamiques des quotes
async function hasQuotesPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true;
    }

    // Vérifier les permissions dynamiques
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'quotes'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions quotes:', error);
    return false;
  }
}

// POST - Créer une nouvelle demande de devis (endpoint public : /quote-request et /contact)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = QuoteRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Tous les champs obligatoires doivent être renseignés'
      }, { status: 400 });
    }

    const data = validation.data;

    // Honeypot, délai de remplissage, origine, token applicatif, rate limit par
    // IP et par email, adresses jetables. Avant toute écriture et tout envoi
    // d'email : une requête acceptée déclenche deux emails.
    const guard = await guardPublicFormSubmission(request, {
      scope: 'quote',
      email: data.customerEmail,
      body,
      decoyResponse: () => NextResponse.json({
        success: true,
        message: 'Demande de devis créée avec succès'
      }, { status: 201 }),
    });
    if (!guard.ok) return guard.response;

    const customerEmail = guard.normalizedEmail;
    const preferredDate = data.preferredDate ? new Date(data.preferredDate) : null;
    if (preferredDate && Number.isNaN(preferredDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Date souhaitée invalide'
      }, { status: 400 });
    }

    const estimatedPrice = data.estimatedPrice === null || data.estimatedPrice === undefined
      ? null
      : String(data.estimatedPrice);

    // Créer la demande de devis
    const newQuote = await db
      .insert(quotesTable)
      .values({
        customerName: data.customerName,
        customerEmail,
        customerPhone: normalizePhoneForStorage(data.customerPhone),
        service: data.service,
        preferredDate,
        message: data.message,
        estimatedPrice,
        status: 'pending',
        updatedAt: new Date()
      })
      .returning();

    const emailPayload = {
      quoteId: `QUOTE-${newQuote[0].id}`,
      customerName: data.customerName,
      service: data.service,
      preferredDate: preferredDate ? preferredDate.toLocaleDateString('fr-FR') : undefined,
      message: data.message
    };

    // Envoyer email de confirmation au client (retry automatique en cas d'échec)
    await sendWithRetry('email', 'resend-mailer.sendNewQuoteRequestEmail', [
      customerEmail,
      emailPayload,
      false
    ]);

    // Envoyer notification à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@navettexpress.com';
    await sendWithRetry('email', 'resend-mailer.sendNewQuoteRequestEmail', [
      adminEmail,
      emailPayload,
      true
    ]);

    return NextResponse.json({
      success: true, 
      data: newQuote[0],
      message: 'Demande de devis créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la demande de devis:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    // La cause DB reste dans les logs du serveur, jamais dans la réponse : elle
    // exposait le message d'erreur PostgreSQL brut au client.
    const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined;
    if (cause) console.error('❌ Cause DB:', cause);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// GET - Récupérer les demandes de devis
export async function GET() {
  try {
    console.log('📋 GET /api/quotes - Début de la requête')
    
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string; email?: string } } | null;
    console.log('🔐 Session:', session ? `User ID: ${session.user?.id}, Role: ${session.user?.role}` : 'Non authentifié')

    if (!session?.user?.id) {
      console.log('❌ Utilisateur non authentifié')
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    console.log('👤 Vérification des permissions pour le rôle:', userRole)
    
    const hasReadPermission = await hasQuotesPermission(userRole, 'read');
    console.log('✓ Permission de lecture:', hasReadPermission)

    if (!hasReadPermission) {
      console.log('❌ Permission refusée pour le rôle:', userRole)
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de voir les devis' 
      }, { status: 403 });
    }

    // Si l'utilisateur a la permission 'manage', il peut voir tous les devis
    const hasManagePermission = await hasQuotesPermission(userRole, 'update') || 
                                await hasQuotesPermission(userRole, 'delete');
    console.log('🔧 Permission de gestion:', hasManagePermission)

    let quotes;

    if (hasManagePermission) {
      console.log('📊 Récupération de tous les devis...')
      // Permission manage: voir tous les devis
      quotes = await db
        .select()
        .from(quotesTable)
        .orderBy(desc(quotesTable.createdAt));
      console.log('✅ Nombre de devis récupérés:', quotes.length)
    } else {
      // Permission read only: voir uniquement ses propres devis
      const userEmail = session.user.email;
      console.log('📧 Récupération des devis pour:', userEmail)
      if (!userEmail) {
        console.log('❌ Email utilisateur manquant')
        return NextResponse.json({ 
          success: false, 
          error: 'Email utilisateur non trouvé' 
        }, { status: 400 });
      }
      quotes = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.customerEmail, userEmail))
        .orderBy(desc(quotesTable.createdAt));
      console.log('✅ Nombre de devis personnels récupérés:', quotes.length)
    }

    console.log('✅ Envoi de la réponse avec', quotes.length, 'devis')
    return NextResponse.json({ 
      success: true, 
      data: quotes 
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des demandes de devis:', error);
    console.error('Type d\'erreur:', typeof error);
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

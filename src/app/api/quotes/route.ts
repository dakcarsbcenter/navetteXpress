export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { quotesTable, quoteTripsTable, rolePermissionsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { desc, and, eq } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { QUOTE_SERVICE_IDS, MAX_QUOTE_TRIPS } from '@/lib/quote-services';
import { attachTripsToQuotes } from '@/lib/quote-trips';
import { guardPublicFormSubmission } from '@/lib/security/publicFormGuard';

// Le service est contraint à la liste partagée (src/lib/quote-services.ts) :
// c'est ce qui garantit que /contact et /quote-request écrivent le même
// vocabulaire dans la colonne `service`, et que l'admin retrouve toujours un
// libellé et une icône corrects.
// Une ligne du tableau de trajets. `service`/`preferredDate` restent renseignés
// au niveau du devis (colonnes notNull utilisées par les factures et les
// e-mails) : le client y recopie ceux du premier trajet.
const QuoteTripSchema = z.object({
  service: z.enum(QUOTE_SERVICE_IDS),
  departure: z.string().trim().min(2).max(255),
  destination: z.string().trim().min(2).max(255),
  scheduledDateTime: z.string().trim().max(40).nullish(),
  passengers: z.number().int().min(1).max(200),
  luggage: z.number().int().min(0).max(100),
  note: z.string().trim().max(500).nullish(),
});

const QuoteRequestSchema = z.object({
  customerName: z.string().trim().min(2, 'Nom trop court').max(120),
  customerEmail: z.string().trim().max(180),
  customerPhone: z.string().trim().max(30).nullish(),
  service: z.enum(QUOTE_SERVICE_IDS),
  preferredDate: z.string().trim().max(40).nullish(),
  message: z.string().trim().min(1).max(8000),
  estimatedPrice: z.union([z.number(), z.string()]).nullish(),
  // Demande multi-trajets (/quote-request). Absent depuis /contact, qui n'envoie
  // qu'un message libre : le devis reste alors sans ligne, comme avant.
  trips: z.array(QuoteTripSchema).min(1).max(MAX_QUOTE_TRIPS).optional(),
  // Devis pour un tiers : personne réellement transportée.
  passengerName: z.string().trim().min(2).max(120).nullish(),
  passengerPhone: z.string().trim().max(30).nullish(),
  // Champs anti-bot (voir src/lib/security/publicFormGuard.ts)
  companyWebsite: z.string().max(200).optional(),
  formStartedAt: z.number().optional(),
}).strict();

/** Date de prise en charge illisible sur une ligne : on nomme le trajet fautif au client. */
class InvalidTripDateError extends Error {
  constructor(public readonly position: number) {
    super(`Date de prise en charge invalide sur le trajet ${position}`);
    this.name = 'InvalidTripDateError';
  }
}

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

    // Les dates de prise en charge sont validées avant d'ouvrir la transaction :
    // une ligne invalide doit rejeter la demande entière, pas créer un devis vide.
    const tripRows = (data.trips ?? []).map((trip, index) => {
      let scheduledDateTime: Date | null = null;
      if (trip.scheduledDateTime) {
        const parsed = new Date(trip.scheduledDateTime);
        if (Number.isNaN(parsed.getTime())) {
          throw new InvalidTripDateError(index + 1);
        }
        scheduledDateTime = parsed;
      }
      return {
        position: index + 1,
        service: trip.service,
        departure: trip.departure,
        destination: trip.destination,
        scheduledDateTime,
        passengers: trip.passengers,
        luggage: trip.luggage,
        note: trip.note || null,
      };
    });

    // Devis et trajets dans la même transaction : un devis multi-trajets sans
    // ses lignes serait inexploitable côté admin.
    const newQuote = await db.transaction(async (tx) => {
      const [quote] = await tx
        .insert(quotesTable)
        .values({
          customerName: data.customerName,
          customerEmail,
          customerPhone: normalizePhoneForStorage(data.customerPhone),
          service: data.service,
          preferredDate,
          message: data.message,
          estimatedPrice,
          passengerName: data.passengerName || null,
          passengerPhone: normalizePhoneForStorage(data.passengerPhone),
          status: 'pending',
          updatedAt: new Date()
        })
        .returning();

      if (tripRows.length > 0) {
        await tx.insert(quoteTripsTable).values(
          tripRows.map((row) => ({ ...row, quoteId: quote.id, updatedAt: new Date() }))
        );
      }

      return [quote];
    });

    const emailPayload = {
      quoteId: `QUOTE-${newQuote[0].id}`,
      customerName: data.customerName,
      service: data.service,
      preferredDate: preferredDate ? preferredDate.toLocaleDateString('fr-FR') : undefined,
      message: data.message,
      tripCount: tripRows.length
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
    if (error instanceof InvalidTripDateError) {
      return NextResponse.json({
        success: false,
        error: `Date de prise en charge invalide sur le trajet ${error.position}`
      }, { status: 400 });
    }
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

    // Les lignes de trajet sont chargées en une requête (pas de N+1) : les vues
    // admin et client affichent l'itinéraire complet, pas seulement le 1er trajet.
    const quotesWithTrips = await attachTripsToQuotes(quotes);

    console.log('✅ Envoi de la réponse avec', quotesWithTrips.length, 'devis')
    return NextResponse.json({ 
      success: true, 
      data: quotesWithTrips 
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

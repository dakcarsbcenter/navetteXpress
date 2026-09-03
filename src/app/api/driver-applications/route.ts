export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { users } from '@/schema';
import { eq } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { friendlyDbError } from '@/lib/db-errors';

// POST - Candidature publique "Devenir chauffeur partenaire" (/devenir-partenaire).
// Crée directement un compte role='driver' en attente (driverStatus='pending', isActive=false,
// sans licenseNumber) : l'admin complète et valide le profil depuis la vue Chauffeurs.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, vehicleBrand, vehicleModel, vehiclePlateNumber } = body;

    if (!name || !email || !phone || !vehicleBrand || !vehicleModel || !vehiclePlateNumber) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Un compte existe déjà avec cet email' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newApplication = await db
      .insert(users)
      .values({
        id: randomUUID(),
        name,
        email,
        phone,
        role: 'driver',
        driverStatus: 'pending',
        driverRequestedAt: now,
        vehicleBrand,
        vehicleModel,
        vehiclePlateNumber,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const applicant = newApplication[0];

    await sendWithRetry('email', 'resend-mailer.sendNewDriverApplicationEmail', [
      applicant.email,
      { name, phone, vehicleBrand, vehicleModel, vehiclePlateNumber },
      false,
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@navettexpress.com';
    await sendWithRetry('email', 'resend-mailer.sendNewDriverApplicationEmail', [
      adminEmail,
      { name, phone, vehicleBrand, vehicleModel, vehiclePlateNumber },
      true,
    ]);

    return NextResponse.json(
      { success: true, message: 'Candidature envoyée avec succès' },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erreur lors de la création de la candidature chauffeur:', error);
    return NextResponse.json(
      {
        success: false,
        error: friendlyDbError(error, {
          users_email_unique: 'Un compte existe déjà avec cet email',
        }),
      },
      { status: 500 }
    );
  }
}

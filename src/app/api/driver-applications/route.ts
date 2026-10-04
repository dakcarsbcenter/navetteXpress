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
import {
  CORRIDOR_KEYS,
  CORRIDOR_SHORT_LABELS,
  isDeclaredAvailabilityDay,
  isPlausibleVehicleYear,
  isVehicleOutsideCriteria,
  MIN_VEHICLE_YEAR,
  type CorridorKey,
} from '@/lib/driver-application';

// POST - Candidature publique "Devenir chauffeur partenaire" (/devenir-partenaire).
// Crée directement un compte role='driver' en attente (driverStatus='pending', isActive=false,
// sans licenseNumber) : l'admin complète et valide le profil depuis la vue Chauffeurs.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      vehicleBrand,
      vehicleModel,
      vehiclePlateNumber,
      vehicleYear,
      corridorA,
      corridorB,
      corridorC,
      declaredAvailability,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!name || !email || !phone || !vehicleBrand || !vehicleModel || !vehiclePlateNumber) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

    // Année du véhicule : requise, et plausible (le formulaire envoie un number).
    const parsedVehicleYear = typeof vehicleYear === 'string' ? Number(vehicleYear) : vehicleYear;
    if (!isPlausibleVehicleYear(parsedVehicleYear)) {
      return NextResponse.json(
        {
          success: false,
          error: `Année du véhicule invalide (entre ${MIN_VEHICLE_YEAR} et ${new Date().getFullYear() + 1})`,
        },
        { status: 400 }
      );
    }

    // Au moins un corridor coché : sans ça, impossible d'imputer la candidature à
    // un groupe et donc de suivre les quotas (4 / 3 / 5).
    const corridors: Record<CorridorKey, boolean> = {
      a: corridorA === true,
      b: corridorB === true,
      c: corridorC === true,
    };
    if (!CORRIDOR_KEYS.some((key) => corridors[key])) {
      return NextResponse.json(
        { success: false, error: 'Choisissez au moins un corridor' },
        { status: 400 }
      );
    }

    // Jours déclarés : filtrés sur la liste blanche, tableau vide => null.
    const availability = Array.isArray(declaredAvailability)
      ? declaredAvailability.filter(isDeclaredAvailabilityDay)
      : [];

    // Le flag "hors critère" est calculé ici et jamais lu depuis le navigateur.
    const vehicleOutsideCriteria = isVehicleOutsideCriteria(parsedVehicleYear);

    // UTM absents => null, jamais d'échec de soumission.
    const normalizeUtm = (value: unknown): string | null => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim().slice(0, 120);
      return trimmed.length > 0 ? trimmed : null;
    };

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
        vehicleYear: parsedVehicleYear,
        vehicleOutsideCriteria,
        corridorA: corridors.a,
        corridorB: corridors.b,
        corridorC: corridors.c,
        declaredAvailability: availability.length > 0 ? availability : null,
        utmSource: normalizeUtm(utmSource),
        utmMedium: normalizeUtm(utmMedium),
        utmCampaign: normalizeUtm(utmCampaign),
        isActive: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const applicant = newApplication[0];

    const mailData = {
      name,
      phone,
      vehicleBrand,
      vehicleModel,
      vehiclePlateNumber,
      vehicleYear: parsedVehicleYear,
      vehicleOutsideCriteria,
      corridors: CORRIDOR_KEYS.filter((key) => corridors[key]).map(
        (key) => CORRIDOR_SHORT_LABELS[key]
      ),
      declaredAvailability: availability,
      utmSource: normalizeUtm(utmSource),
      utmMedium: normalizeUtm(utmMedium),
      utmCampaign: normalizeUtm(utmCampaign),
    };

    await sendWithRetry('email', 'resend-mailer.sendNewDriverApplicationEmail', [
      applicant.email,
      mailData,
      false,
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@navettexpress.com';
    await sendWithRetry('email', 'resend-mailer.sendNewDriverApplicationEmail', [
      adminEmail,
      mailData,
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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users, rolePermissionsTable } from '@/schema';
import { eq, and, ne } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { friendlyDbError } from '@/lib/db-errors';

async function hasUsersPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  if (userRole === 'admin') return true
  const permissions = await db
    .select()
    .from(rolePermissionsTable)
    .where(and(
      eq(rolePermissionsTable.roleName, userRole),
      eq(rolePermissionsTable.resource, 'users'),
      eq(rolePermissionsTable.action, action),
      eq(rolePermissionsTable.allowed, true)
    ))
  return permissions.length > 0
}

// PATCH - Approuver ou rejeter une candidature chauffeur (driverStatus='pending')
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { role?: string; id?: string } } | null
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const userRole = session.user.role
    if (!userRole) {
      return NextResponse.json({ success: false, error: 'Rôle utilisateur non défini' }, { status: 403 })
    }

    const hasPermission = await hasUsersPermission(userRole, 'update')
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: "Vous n'avez pas la permission de modifier les utilisateurs" }, { status: 403 })
    }

    const { id } = await params
    const { action, licenseNumber, rejectionReason } = await request.json()

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, error: "Action invalide. Utilisez 'approve' ou 'reject'." }, { status: 400 })
    }

    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const candidate = existing[0]
    if (candidate.role !== 'driver' || candidate.driverStatus !== 'pending') {
      return NextResponse.json({ success: false, error: "Cette candidature n'est pas (ou plus) en attente" }, { status: 400 })
    }

    if (action === 'approve') {
      if (!licenseNumber) {
        return NextResponse.json({ success: false, error: 'Un numéro de permis est requis pour valider le profil' }, { status: 400 })
      }

      const licenseExists = await db
        .select()
        .from(users)
        .where(and(eq(users.licenseNumber, licenseNumber), ne(users.id, id)))
        .limit(1)

      if (licenseExists.length > 0) {
        return NextResponse.json({ success: false, error: 'Ce numéro de permis est déjà utilisé par un autre chauffeur' }, { status: 400 })
      }
    }

    const updated = await db
      .update(users)
      .set({
        driverStatus: action === 'approve' ? 'approved' : 'rejected',
        licenseNumber: action === 'approve' ? licenseNumber : candidate.licenseNumber,
        isActive: action === 'approve',
        driverReviewedAt: new Date(),
        driverReviewedBy: session.user.id ?? null,
        driverRejectionReason: action === 'reject' ? (rejectionReason || null) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    await sendWithRetry('email', 'resend-mailer.sendDriverApplicationStatusEmail', [
      candidate.email,
      { name: candidate.name, status: action === 'approve' ? 'approved' : 'rejected', rejectionReason: rejectionReason || undefined },
    ])

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Profil chauffeur validé' : 'Candidature rejetée',
      data: updated[0],
    })
  } catch (error) {
    console.error('❌ Erreur lors du traitement de la candidature chauffeur:', error)
    return NextResponse.json(
      {
        success: false,
        error: friendlyDbError(error, {
          users_license_number_unique: 'Ce numéro de permis est déjà utilisé par un autre chauffeur',
          driver_license_check: 'Un numéro de permis est requis pour valider un chauffeur',
        }),
      },
      { status: 500 }
    )
  }
}

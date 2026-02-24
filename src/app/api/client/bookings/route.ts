export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { bookingsTable, rolePermissionsTable } from "@/schema"
import { eq, desc, and } from "drizzle-orm"

// Vérifier si l'utilisateur a la permission de gérer les réservations
async function hasBookingPermission(userRole: string): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true
    }

    // Les customers ont accès par défaut (comportement legacy)
    if (userRole === 'customer') {
      return true
    }

    // Vérifier les permissions dynamiques pour autres rôles
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'bookings'),
        eq(rolePermissionsTable.allowed, true)
      ))

    return permissions.length > 0
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions bookings:', error)
    return false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role || 'customer'

    // Vérifier les permissions
    const hasPermission = await hasBookingPermission(userRole)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions nécessaires pour accéder aux réservations' },
        { status: 403 }
      )
    }

    // Récupérer les réservations du client
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, (session as unknown as { user: { id: string } }).user.id))
      .orderBy(desc(bookingsTable.createdAt))

    return NextResponse.json({ 
      success: true,
      bookings: bookings.map(booking => ({
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        scheduledDateTime: booking.scheduledDateTime,
        status: booking.status,
        price: booking.price,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }))
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des réservations client:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

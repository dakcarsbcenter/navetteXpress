export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { reviewsTable } from "@/schema"
import { eq } from "drizzle-orm"

// GET - Récupérer un avis spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const review = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, parseInt((await params).id)))
      .limit(1)

    if (review.length === 0) {
      return NextResponse.json(
        { error: "Avis non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(review[0])

  } catch (error) {
    console.error("Erreur lors de la récupération de l'avis:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un avis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const { rating, comment } = await request.json()

    // Vérifier si l'avis existe
    const existingReview = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, parseInt((await params).id)))
      .limit(1)

    if (existingReview.length === 0) {
      return NextResponse.json(
        { error: "Avis non trouvé" },
        { status: 404 }
      )
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "La note doit être entre 1 et 5" },
        { status: 400 }
      )
    }

    // Mettre à jour l'avis
    const updatedReview = await db
      .update(reviewsTable)
      .set({
        rating: rating || existingReview[0].rating,
        comment: comment !== undefined ? comment : existingReview[0].comment
      })
      .where(eq(reviewsTable.id, parseInt((await params).id)))
      .returning()

    return NextResponse.json(
      { message: "Avis mis à jour avec succès", review: updatedReview[0] }
    )

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'avis:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un avis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    // Vérifier si l'avis existe
    const existingReview = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, parseInt((await params).id)))
      .limit(1)

    if (existingReview.length === 0) {
      return NextResponse.json(
        { error: "Avis non trouvé" },
        { status: 404 }
      )
    }

    // Supprimer l'avis
    await db
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, parseInt((await params).id)))

    return NextResponse.json(
      { message: "Avis supprimé avec succès" }
    )

  } catch (error) {
    console.error("Erreur lors de la suppression de l'avis:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

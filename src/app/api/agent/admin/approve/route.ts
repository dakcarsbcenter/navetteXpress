export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { bookingsTable, reviewsTable } from "@/schema"
import { eq } from "drizzle-orm"
import type { AgentProposal } from "@/lib/agent/admin-agent"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "manager")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const proposal: AgentProposal = await request.json()

  if (proposal.type === "assignment") {
    await db
      .update(bookingsTable)
      .set({
        driverId: proposal.driverId,
        status: "assigned",
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, proposal.bookingId))

    return NextResponse.json({
      success: true,
      message: `Réservation #${proposal.bookingId} assignée à ${proposal.driverName}`,
    })
  }

  if (proposal.type === "review_response") {
    await db
      .update(reviewsTable)
      .set({
        response: proposal.proposedResponse,
        respondedBy: session.user.id,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reviewsTable.id, proposal.reviewId))

    return NextResponse.json({
      success: true,
      message: `Réponse publiée pour l'avis #${proposal.reviewId}`,
    })
  }

  return NextResponse.json({ error: "Type de proposition inconnu" }, { status: 400 })
}

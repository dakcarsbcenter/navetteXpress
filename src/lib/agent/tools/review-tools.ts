import { db } from "@/db"
import { reviewsTable, users, bookingsTable } from "@/schema"
import { eq, isNull, desc } from "drizzle-orm"

export async function getUnrespondedReviews() {
  return db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      isApproved: reviewsTable.isApproved,
      customerName: users.name,
      customerEmail: users.email,
      driverId: reviewsTable.driverId,
      bookingId: reviewsTable.bookingId,
    })
    .from(reviewsTable)
    .leftJoin(users, eq(reviewsTable.customerId, users.id))
    .where(isNull(reviewsTable.response))
    .orderBy(desc(reviewsTable.createdAt))
}

export async function getDriverName(driverId: string): Promise<string> {
  const result = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, driverId))
    .limit(1)
  return result[0]?.name ?? "Chauffeur inconnu"
}

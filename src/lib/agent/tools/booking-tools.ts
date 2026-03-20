import { db } from "@/db"
import { bookingsTable, users, driverAvailabilityTable } from "@/schema"
import { eq, and, or } from "drizzle-orm"

export async function getPendingBookings() {
  return db
    .select({
      id: bookingsTable.id,
      customerName: bookingsTable.customerName,
      customerEmail: bookingsTable.customerEmail,
      customerPhone: bookingsTable.customerPhone,
      pickupAddress: bookingsTable.pickupAddress,
      dropoffAddress: bookingsTable.dropoffAddress,
      scheduledDateTime: bookingsTable.scheduledDateTime,
      passengers: bookingsTable.passengers,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "pending"))
    .orderBy(bookingsTable.scheduledDateTime)
}

export async function getActiveDrivers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(and(eq(users.role, "driver"), eq(users.isActive, true)))
}

export async function getDriverAvailability(driverId: string) {
  return db
    .select()
    .from(driverAvailabilityTable)
    .where(
      and(
        eq(driverAvailabilityTable.driverId, driverId),
        eq(driverAvailabilityTable.isAvailable, true)
      )
    )
    .orderBy(driverAvailabilityTable.dayOfWeek, driverAvailabilityTable.startTime)
}

export async function getDriverExistingBookings(driverId: string) {
  return db
    .select({
      id: bookingsTable.id,
      scheduledDateTime: bookingsTable.scheduledDateTime,
      status: bookingsTable.status,
      pickupAddress: bookingsTable.pickupAddress,
      dropoffAddress: bookingsTable.dropoffAddress,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.driverId, driverId),
        or(
          eq(bookingsTable.status, "assigned"),
          eq(bookingsTable.status, "confirmed"),
          eq(bookingsTable.status, "in_progress")
        )
      )
    )
    .orderBy(bookingsTable.scheduledDateTime)
}

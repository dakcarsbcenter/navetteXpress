import { integer, pgTable, serial, text, timestamp, decimal, boolean } from 'drizzle-orm/pg-core';

// Table des chauffeurs
export const driversTable = pgTable('drivers', {
  id: serial('id').primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(), // Lien avec Clerk Auth
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  licenseNumber: text('license_number').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

// Table des véhicules
export const vehiclesTable = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(), // Marque
  model: text('model').notNull(), // Modèle
  year: integer('year').notNull(),
  plateNumber: text('plate_number').notNull().unique(), // Numéro de plaque
  capacity: integer('capacity').notNull(), // Nombre de passagers
  driverId: integer('driver_id')
    .notNull()
    .references(() => driversTable.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

// Table des réservations
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  pickupAddress: text('pickup_address').notNull(),
  dropoffAddress: text('dropoff_address').notNull(),
  scheduledDateTime: timestamp('scheduled_date_time').notNull(),
  status: text('status').notNull().default('pending'), // pending, confirmed, in_progress, completed, cancelled
  driverId: integer('driver_id')
    .references(() => driversTable.id, { onDelete: 'set null' }),
  vehicleId: integer('vehicle_id')
    .references(() => vehiclesTable.id, { onDelete: 'set null' }),
  price: decimal('price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

// Types TypeScript pour l'inférence de types
export type InsertDriver = typeof driversTable.$inferInsert;
export type SelectDriver = typeof driversTable.$inferSelect;

export type InsertVehicle = typeof vehiclesTable.$inferInsert;
export type SelectVehicle = typeof vehiclesTable.$inferSelect;

export type InsertBooking = typeof bookingsTable.$inferInsert;
export type SelectBooking = typeof bookingsTable.$inferSelect;

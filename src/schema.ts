import { integer, pgTable, serial, text, timestamp, decimal, boolean, check, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums (unifiés)
export const userRoleEnum = pgEnum('user_role', ['admin', 'driver', 'customer']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'assigned', 'approved', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['sedan', 'suv', 'van', 'luxury', 'bus']);
export const quoteStatusEnum = pgEnum('quote_status', ['pending', 'in_progress', 'sent', 'accepted', 'rejected', 'expired']);

// Utilisateurs
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'),
  role: userRoleEnum('role').notNull().default('customer'),
  phone: text('phone'),
  licenseNumber: text('license_number').unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => ({
  driverLicenseCheck: check('driver_license_check', sql`(${table.role} != 'driver') OR (${table.licenseNumber} IS NOT NULL)`),
}));

// Comptes OAuth (NextAuth)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// Sessions (NextAuth)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

// Tokens de vérification (NextAuth)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
});

// Véhicules
export const vehiclesTable = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  plateNumber: text('plate_number').notNull().unique(),
  capacity: integer('capacity').notNull(),
  vehicleType: vehicleTypeEnum('vehicle_type').notNull().default('sedan'),
  photo: text('photo'),
  // Chauffeur assigné (optionnel)
  driverId: text('driver_id').references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => ({
  photoImageCheck: check('vehicle_photo_image_check', sql`
    ${table.photo} IS NULL OR 
    ${table.photo} ~ '^https?://.*\\.(jpg|jpeg|png|gif|webp|bmp|svg)$' OR
    ${table.photo} ~ '^data:image/(jpeg|jpg|png|gif|webp|bmp|svg\\+xml);base64,'
  `),
  yearCheck: check('year_check', sql`${table.year} >= 1900 AND ${table.year} <= EXTRACT(YEAR FROM NOW()) + 2`),
  capacityCheck: check('capacity_check', sql`${table.capacity} > 0 AND ${table.capacity} <= 50`),
}));

// Réservations
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  pickupAddress: text('pickup_address').notNull(),
  dropoffAddress: text('dropoff_address').notNull(),
  scheduledDateTime: timestamp('scheduled_date_time').notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  driverId: text('driver_id').references(() => users.id, { onDelete: 'set null' }),
  vehicleId: integer('vehicle_id').references(() => vehiclesTable.id, { onDelete: 'set null' }),
  price: decimal('price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => ({
  // Contrainte supprimée car elle bloque les mises à jour des réservations passées
  // La vérification de date future sera faite côté application lors de la création
}));

// Avis
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookingsTable.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  ratingCheck: check('rating_check', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
}));

// Permissions
export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  allowed: boolean('allowed').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Demandes de devis
export const quotesTable = pgTable('quotes', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  service: text('service').notNull(),
  preferredDate: timestamp('preferred_date'),
  message: text('message').notNull(),
  status: quoteStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  estimatedPrice: decimal('estimated_price', { precision: 10, scale: 2 }),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// Types TS
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertVehicle = typeof vehiclesTable.$inferInsert;
export type SelectVehicle = typeof vehiclesTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
export type SelectBooking = typeof bookingsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;
export type SelectReview = typeof reviewsTable.$inferSelect;
export type InsertPermission = typeof permissionsTable.$inferInsert;
export type SelectPermission = typeof permissionsTable.$inferSelect;
export type InsertQuote = typeof quotesTable.$inferInsert;
export type SelectQuote = typeof quotesTable.$inferSelect;
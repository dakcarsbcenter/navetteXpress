import { integer, pgTable, serial, text, timestamp, decimal, boolean, check, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums (unifiés)
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'driver', 'customer']);
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
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
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
  // Nouveaux champs pour la page Flotte
  category: text('category'), // Ex: "Berline de Luxe", "Berline Executive", etc.
  description: text('description'), // Description du véhicule
  features: text('features'), // JSON stringifié des équipements ["Cuir premium", "Wi-Fi", ...]
  // Chauffeur assigné (optionnel)
  driverId: text('driver_id').references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => ({
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
  passengers: integer('passengers').notNull().default(1),
  luggage: integer('luggage').notNull().default(1),
  duration: decimal('duration', { precision: 4, scale: 2 }).default('2'),
  price: decimal('price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => ({
  passengersCheck: check('passengers_check', sql`${table.passengers} > 0`),
  luggageCheck: check('luggage_check', sql`${table.luggage} >= 0`),
}));

// Avis
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookingsTable.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  response: text('response'),
  respondedBy: text('responded_by'),
  respondedAt: timestamp('responded_at'),
  isPublic: boolean('is_public').notNull().default(true),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
  clientNotes: text('client_notes'),
  estimatedPrice: decimal('estimated_price', { precision: 10, scale: 2 }),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// Enum pour le statut des factures
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'pending', 'paid', 'cancelled', 'overdue']);

// Factures
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // Format: INV-YYYY-XXXXX
  quoteId: integer('quote_id').notNull().references(() => quotesTable.id, { onDelete: 'restrict' }),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  service: text('service').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull().default('20.00'), // TVA en %
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('pending'),
  issueDate: timestamp('issue_date').notNull().defaultNow(),
  dueDate: timestamp('due_date').notNull(), // Date d'échéance
  paidDate: timestamp('paid_date'),
  paymentMethod: text('payment_method'), // 'card', 'bank_transfer', 'cash', etc.
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => ({
  amountCheck: check('amount_check', sql`${table.amount} > 0`),
  totalCheck: check('total_check', sql`${table.totalAmount} > 0`),
}));

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
export type InsertInvoice = typeof invoicesTable.$inferInsert;
export type SelectInvoice = typeof invoicesTable.$inferSelect;

// Types pour les drivers (alias pour les utilisateurs avec le rôle driver)
export type InsertDriver = InsertUser;
export type SelectDriver = SelectUser;

// Types pour les rapports de véhicules
export type VehicleReport = {
  id: number;
  title: string;
  description: string;
  category: 'mechanical' | 'electrical' | 'bodywork' | 'interior' | 'other';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  reportedAt: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
  };
};

// Rôles personnalisés
export const customRolesTable = pgTable('custom_roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366f1'),
  level: integer('level').notNull().default(1),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// Permissions des rôles
export const rolePermissionsTable = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleName: text('role_name').notNull().references(() => customRolesTable.name, { onDelete: 'cascade' }),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  allowed: boolean('allowed').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueRolePermission: check('unique_role_permission', sql`(${table.roleName}, ${table.resource}, ${table.action}) IS NOT NULL`),
}));

// Types pour les nouveaux schémas
export type InsertCustomRole = typeof customRolesTable.$inferInsert;
export type SelectCustomRole = typeof customRolesTable.$inferSelect;
export type InsertRolePermission = typeof rolePermissionsTable.$inferInsert;
export type SelectRolePermission = typeof rolePermissionsTable.$inferSelect;

// Alias pour les exports
export const quotes = quotesTable;

// Types pour les réponses API
export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  emailStatus?: 'sent' | 'failed';
  emailError?: string;
};
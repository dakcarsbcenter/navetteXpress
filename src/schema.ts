import { integer, pgTable, serial, text, timestamp, decimal, boolean, check, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums (unifiés)
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'driver', 'customer']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'assigned', 'approved', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['sedan', 'suv', 'van', 'luxury', 'bus']);
export const quoteStatusEnum = pgEnum('quote_status', ['pending', 'in_progress', 'sent', 'accepted', 'rejected', 'expired']);
export const adTypeEnum = pgEnum('ad_type', [
  'banner_image',    // Bannière image statique (JPG/PNG/WebP)
  'banner_animated', // Bannière animée (GIF/MP4)
  'text_sponsored',  // Texte sponsorisé (titre + description + lien)
  'card_sponsored',  // Card (image + titre + bouton CTA)
]);

export const adStatusEnum = pgEnum('ad_status', [
  'draft',    // Brouillon — en préparation
  'active',   // Active — visible sur le site
  'paused',   // Mise en pause manuellement
  'expired',  // Expirée automatiquement (date dépassée)
]);

export const adPlacementEnum = pgEnum('ad_placement', [
  'home_hero',          // Page accueil — après la section hero
  'home_services',      // Page accueil — après la section services
  'home_fleet',         // Page accueil — après la section flotte
  'home_testimonials',  // Page accueil — après les témoignages
  'page_temoignages',   // Page /temoignages — en haut
  'page_flotte',        // Page /flotte — en haut
  'page_services',      // Page /services — en haut
  'client_dashboard',   // Dashboard client — widget latéral
  'confirmation',       // Page confirmation de réservation
]);


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
  // Champs pour le système de tentatives de connexion
  loginAttempts: integer('login_attempts').notNull().default(0),
  accountLockedUntil: timestamp('account_locked_until'),
  lastFailedLogin: timestamp('last_failed_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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
  priceProposedAt: timestamp('price_proposed_at'), // Date où l'admin a proposé le prix
  clientResponse: text('client_response'), // 'pending' | 'accepted' | 'rejected'
  clientResponseAt: timestamp('client_response_at'), // Date de réponse du client
  clientResponseMessage: text('client_response_message'), // Message optionnel du client
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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

// Disponibilités des chauffeurs
export const driverAvailabilityTable = pgTable('driver_availability', {
  id: serial('id').primaryKey(),
  driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  startTime: text('start_time').notNull(), // Format: "HH:mm" (ex: "08:00")
  endTime: text('end_time').notNull(), // Format: "HH:mm" (ex: "18:00")
  isAvailable: boolean('is_available').notNull().default(true),
  specificDate: timestamp('specific_date'), // Pour les disponibilités/indisponibilités spécifiques à une date
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  dayOfWeekCheck: check('day_of_week_check', sql`${table.dayOfWeek} >= 0 AND ${table.dayOfWeek} <= 6`),
}));

// ── Table principale Publicités ──
export const advertisements = pgTable('advertisements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Identité
  title: text('title').notNull(),          // Nom interne (visible admin seulement)
  advertiser: text('advertiser').notNull(),      // Nom de l'annonceur

  // Type et contenu
  type: adTypeEnum('type').notNull(),

  // Contenu selon le type
  imageUrl: text('image_url'),                // banner_image, banner_animated, card_sponsored
  videoUrl: text('video_url'),                // banner_animated (MP4)
  altText: text('alt_text'),                 // Accessibilité image
  headline: text('headline'),                 // text_sponsored, card_sponsored
  description: text('description'),              // text_sponsored
  ctaLabel: text('cta_label'),                // card_sponsored — texte du bouton
  destinationUrl: text('destination_url').notNull(), // URL de redirection au clic

  // Emplacement
  placement: adPlacementEnum('placement').notNull(),

  // Dimensions (pour le rendu correct)
  width: integer('width'),
  height: integer('height'),

  // Planification
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),

  // Statut
  status: adStatusEnum('status').notNull().default('draft'),

  // Statistiques (tracking basique)
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),

  // Facturation (référence externe)
  invoiceRef: text('invoice_ref'),              // Référence facture manuelle
  priceXof: integer('price_xof'),             // Prix en FCFA (pour mémoire)
  notes: text('notes'),                    // Notes internes admin

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by'),               // ID admin qui a créé la pub
});

// Lieux de prise en charge / destination
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // Nom du lieu (Ex: "Aéroport AIBD", "Plateau", "Almadies")
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Services proposés aux clients (gérés par l'admin)
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull().default('✈️'),
  slug: text('slug').notNull().unique(), // identifiant URL-safe (ex: "transfert-aeroport")
  features: text('features').array(), // Liste des points forts (ex: ["Wifi gratuit", "Eau fraîche"])
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertService = typeof servicesTable.$inferInsert;
export type SelectService = typeof servicesTable.$inferSelect;

// Alias pour les exports
export const quotes = quotesTable;

// Types pour les nouveaux schémas
export type InsertDriverAvailability = typeof driverAvailabilityTable.$inferInsert;
export type SelectDriverAvailability = typeof driverAvailabilityTable.$inferSelect;
export type Advertisement = typeof advertisements.$inferSelect;
export type NewAdvertisement = typeof advertisements.$inferInsert;
export type InsertLocation = typeof locationsTable.$inferInsert;
export type SelectLocation = typeof locationsTable.$inferSelect;


// Types pour les réponses API
export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  emailStatus?: 'sent' | 'failed';
  emailError?: string;
};

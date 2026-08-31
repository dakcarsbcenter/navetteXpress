import { integer, pgTable, serial, text, timestamp, decimal, boolean, check, pgEnum, jsonb, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums (unifiés)
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'driver', 'customer']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'assigned', 'approved', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['sedan', 'suv', 'van', 'luxury', 'bus']);
export const requestedVehicleTypeEnum = pgEnum('requested_vehicle_type', ['berline', 'suv']); // Type de véhicule choisi par le client en réservation (tarif berline/suv de pricing_segments)
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

export const companyTypeEnum = pgEnum('company_type', ['hotel', 'entreprise', 'ong']);
export const companyRequestStatusEnum = pgEnum('company_request_status', ['none', 'pending', 'approved', 'rejected']);

export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'whatsapp']);
export const notificationQueueStatusEnum = pgEnum('notification_queue_status', ['pending', 'sent', 'failed']);

export const conversationTypeEnum = pgEnum('conversation_type', ['booking', 'support']);

export const flightStatusEnum = pgEnum('flight_status', ['scheduled', 'active', 'landed', 'cancelled', 'incident', 'diverted', 'unknown']);

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
  address: text('address'),
  // Champs entreprise (Optionnel)
  isCompany: boolean('is_company').notNull().default(false),
  companyType: companyTypeEnum('company_type'),
  companyName: text('company_name'),
  ninea: text('ninea'),
  raisonSociale: text('raison_sociale'),
  companyAddress: text('company_address'),
  companyPhone: text('company_phone'),
  bp: text('bp'),
  // Demande de passage en compte pro : soumise par le client, activée par l'admin uniquement
  companyStatus: companyRequestStatusEnum('company_status').notNull().default('none'),
  companyRequestedAt: timestamp('company_requested_at'),
  companyReviewedAt: timestamp('company_reviewed_at'),
  companyReviewedBy: text('company_reviewed_by'),
  companyRejectionReason: text('company_rejection_reason'),
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
  requestedVehicleType: requestedVehicleTypeEnum('requested_vehicle_type').notNull().default('berline'), // Choix du client (berline/suv) fait en réservation, sert au calcul du tarif indicatif
  passengers: integer('passengers').notNull().default(1),
  luggage: integer('luggage').notNull().default(1),
  duration: decimal('duration', { precision: 4, scale: 2 }).default('2'),
  price: decimal('price', { precision: 10, scale: 2 }),
  priceProposedAt: timestamp('price_proposed_at'), // Date où l'admin a proposé le prix
  clientResponse: text('client_response'), // 'pending' | 'accepted' | 'rejected'
  clientResponseAt: timestamp('client_response_at'), // Date de réponse du client
  clientResponseMessage: text('client_response_message'), // Message optionnel du client
  notes: text('notes'),
  flightNumber: text('flight_number'),
  airline: text('airline'),
  flightStatus: flightStatusEnum('flight_status'),
  flightScheduledTime: timestamp('flight_scheduled_time'),
  flightEstimatedTime: timestamp('flight_estimated_time'),
  flightLastCheckedAt: timestamp('flight_last_checked_at'),
  flightRawData: jsonb('flight_raw_data'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancelledAt: timestamp('cancelled_at'),
  tripPlanId: integer('trip_plan_id').references((): AnyPgColumn => tripPlansTable.id, { onDelete: 'set null' }), // occurrence générée par une planification (voir tripPlansTable)
  whatsappReminderSentAt: timestamp('whatsapp_reminder_sent_at'), // marque l'envoi du rappel WhatsApp (rappel_depart), pour ne pas le renvoyer à chaque tick du cron
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  passengersCheck: check('passengers_check', sql`${table.passengers} > 0`),
  luggageCheck: check('luggage_check', sql`${table.luggage} >= 0`),
}));

// Conversations du chat intégré : soit liées à une réservation (client ↔ chauffeur assigné),
// soit de type support (client ↔ équipe admin/manager, une seule conversation par client).
export const conversationsTable = pgTable('conversations', {
  id: serial('id').primaryKey(),
  type: conversationTypeEnum('type').notNull(),
  bookingId: integer('booking_id').references(() => bookingsTable.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  driverId: text('driver_id').references(() => users.id, { onDelete: 'set null' }),
  clientLastReadAt: timestamp('client_last_read_at'),
  driverLastReadAt: timestamp('driver_last_read_at'),
  adminLastReadAt: timestamp('admin_last_read_at'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  // NULL n'entre pas en conflit avec lui-même en Postgres : cette contrainte n'empêche
  // que les doublons "booking" (bookingId non NULL), pas les lignes "support" (bookingId NULL).
  bookingIdUnique: uniqueIndex('conversations_booking_id_unique').on(table.bookingId),
  // Une seule conversation support par client (index partiel : ne s'applique qu'à type='support').
  clientSupportUnique: uniqueIndex('conversations_client_support_unique').on(table.clientId).where(sql`${table.type} = 'support'`),
}));

export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type InsertConversation = typeof conversationsTable.$inferInsert;
export type SelectConversation = typeof conversationsTable.$inferSelect;
export type InsertMessage = typeof messagesTable.$inferInsert;
export type SelectMessage = typeof messagesTable.$inferSelect;

// Compteur d'appels à l'API de suivi de vols (AviationStack), une ligne par mois
// ('YYYY-MM'), pour ne jamais dépasser le quota du palier gratuit.
export const flightApiUsageTable = pgTable('flight_api_usage', {
  id: serial('id').primaryKey(),
  monthKey: text('month_key').notNull().unique(),
  callCount: integer('call_count').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertFlightApiUsage = typeof flightApiUsageTable.$inferInsert;
export type SelectFlightApiUsage = typeof flightApiUsageTable.$inferSelect;

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

// Planification de déplacements (courses programmées à l'avance, ex: comptes entreprise)
export const tripPlanRecurrenceEnum = pgEnum('trip_plan_recurrence', ['once', 'weekly', 'monthly', 'custom']);
export const tripPlanStatusEnum = pgEnum('trip_plan_status', ['active', 'completed', 'cancelled']);

export const tripPlansTable = pgTable('trip_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pickupAddress: text('pickup_address').notNull(),
  dropoffAddress: text('dropoff_address').notNull(),
  time: text('time').notNull(), // "HH:mm"
  passengers: integer('passengers').notNull().default(1),
  luggage: integer('luggage').notNull().default(0),
  recurrence: tripPlanRecurrenceEnum('recurrence').notNull(),
  daysOfWeek: jsonb('days_of_week').$type<number[]>(), // recurrence=weekly: 0(dim)-6(sam)
  dayOfMonth: integer('day_of_month'), // recurrence=monthly: 1-31
  customDates: jsonb('custom_dates').$type<string[]>(), // recurrence=once|custom: dates ISO ponctuelles
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'), // requis pour weekly/monthly, plafonné à +1 an côté API
  notes: text('notes'),
  status: tripPlanStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  passengersCheck: check('trip_plan_passengers_check', sql`${table.passengers} > 0`),
}));

export type InsertTripPlan = typeof tripPlansTable.$inferInsert;
export type SelectTripPlan = typeof tripPlansTable.$inferSelect;

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

// Types pour les rapports de véhicules (définis par la table ci-dessous)
export const reportCategoryEnum = pgEnum('report_category', ['mechanical', 'electrical', 'bodywork', 'interior', 'other']);
export const reportSeverityEnum = pgEnum('report_severity', ['low', 'medium', 'high', 'urgent']);
export const reportStatusEnum = pgEnum('report_status', ['open', 'in_progress', 'resolved', 'closed']);

// Table des rapports de véhicules
export const vehicleReportsTable = pgTable('vehicle_reports', {
  id: serial('id').primaryKey(),
  vehicleTableId: integer('vehicle_table_id').references(() => vehiclesTable.id, { onDelete: 'cascade' }),
  driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: reportCategoryEnum('category').notNull().default('mechanical'),
  severity: reportSeverityEnum('severity').notNull().default('medium'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: reportStatusEnum('status').notNull().default('open'),
  reportedAt: timestamp('reported_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertVehicleReport = typeof vehicleReportsTable.$inferInsert;
export type SelectVehicleReport = typeof vehicleReportsTable.$inferSelect;

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

// Tarifs publics par segment de trajet (page /tarifs, gérés par l'admin)
export const pricingSegmentsTable = pgTable('pricing_segments', {
  id: serial('id').primaryKey(),
  route: text('route').notNull(), // Libellé du trajet (Ex: "Dakar Plateau → AIBD")
  distance: text('distance').notNull(), // Ex: "47 km"
  duree: text('duree').notNull(), // Ex: "55 min"
  berline: integer('berline').notNull(), // Prix XOF berline
  suv: integer('suv').notNull(), // Prix XOF SUV
  dot: text('dot').notNull().default('accent'), // Couleur du repère : accent | ink | gold
  zones: text('zones').array(), // dakar | aibd | petite-cote
  // Points de départ/arrivée canoniques utilisés pour l'auto-complétion du prix en réservation
  // (mêmes codes que ROUTES_ALLOWED_NODES dans ReservationClient.tsx : DAKAR, AIBD, MBOUR, SALY,
  // NGAPAROU, THIES, NIANING, POINTE_SARRENE, SOMONE). Null si le segment n'est pas un trajet
  // point-à-point (ex: mise à disposition) — il n'apparaît alors jamais en auto-prix.
  departNode: text('depart_node'),
  arriveeNode: text('arrivee_node'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertPricingSegment = typeof pricingSegmentsTable.$inferInsert;
export type SelectPricingSegment = typeof pricingSegmentsTable.$inferSelect;

// File d'attente pour les notifications (email/WhatsApp) dont l'envoi immédiat a échoué.
// Rejouée par le worker de src/lib/notification-queue.ts avec backoff exponentiel.
export const notificationQueueTable = pgTable('notification_queue', {
  id: serial('id').primaryKey(),
  channel: notificationChannelEnum('channel').notNull(),
  handler: text('handler').notNull(), // Clé du registre dans src/lib/notification-queue.ts
  payload: text('payload').notNull(), // Arguments de l'appel, sérialisés en JSON
  status: notificationQueueStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(6),
  lastError: text('last_error'),
  nextAttemptAt: timestamp('next_attempt_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertNotificationQueue = typeof notificationQueueTable.$inferInsert;
export type SelectNotificationQueue = typeof notificationQueueTable.$inferSelect;

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

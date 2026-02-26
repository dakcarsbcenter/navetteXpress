import { pgTable, foreignKey, serial, text, timestamp, numeric, unique, boolean, check, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const bookingStatus = pgEnum("booking_status", ['pending', 'assigned', 'approved', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'pending', 'paid', 'cancelled', 'overdue'])
export const quoteStatus = pgEnum("quote_status", ['pending', 'in_progress', 'sent', 'accepted', 'rejected', 'expired'])
export const userRole = pgEnum("user_role", ['admin', 'manager', 'driver', 'customer'])
export const vehicleType = pgEnum("vehicle_type", ['sedan', 'suv', 'van', 'luxury', 'bus'])


export const quotes = pgTable("quotes", {
	id: serial().primaryKey().notNull(),
	customerName: text("customer_name").notNull(),
	customerEmail: text("customer_email").notNull(),
	customerPhone: text("customer_phone"),
	service: text().notNull(),
	preferredDate: timestamp("preferred_date", { mode: 'string' }),
	message: text().notNull(),
	status: quoteStatus().default('pending').notNull(),
	adminNotes: text("admin_notes"),
	clientNotes: text("client_notes"),
	estimatedPrice: numeric("estimated_price", { precision: 10, scale:  2 }),
	assignedTo: text("assigned_to"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "quotes_assigned_to_users_id_fk"
		}).onDelete("set null"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	sessionToken: text("session_token").notNull(),
	userId: text("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_session_token_unique").on(table.sessionToken),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	role: userRole().notNull(),
	resource: text().notNull(),
	action: text().notNull(),
	allowed: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	customerId: text("customer_id").notNull(),
	driverId: text("driver_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	response: text(),
	respondedBy: text("responded_by"),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	isPublic: boolean("is_public").default(true).notNull(),
	isApproved: boolean("is_approved").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "reviews_booking_id_bookings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [users.id],
			name: "reviews_customer_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "reviews_driver_id_users_id_fk"
		}).onDelete("cascade"),
	check("rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const customRoles = pgTable("custom_roles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	displayName: text("display_name").notNull(),
	description: text(),
	color: text().default('#6366f1').notNull(),
	level: integer().default(1).notNull(),
	isSystem: boolean("is_system").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("custom_roles_name_unique").on(table.name),
]);

export const bookings = pgTable("bookings", {
	id: serial().primaryKey().notNull(),
	customerName: text("customer_name").notNull(),
	customerEmail: text("customer_email").notNull(),
	customerPhone: text("customer_phone").notNull(),
	userId: text("user_id"),
	pickupAddress: text("pickup_address").notNull(),
	dropoffAddress: text("dropoff_address").notNull(),
	scheduledDateTime: timestamp("scheduled_date_time", { mode: 'string' }).notNull(),
	status: bookingStatus().default('pending').notNull(),
	driverId: text("driver_id"),
	vehicleId: integer("vehicle_id"),
	price: numeric({ precision: 10, scale:  2 }),
	notes: text(),
	cancellationReason: text("cancellation_reason"),
	cancelledBy: text("cancelled_by"),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	passengers: integer().default(1).notNull(),
	luggage: integer().default(1).notNull(),
	duration: numeric({ precision: 4, scale:  2 }).default('2'),
	priceProposedAt: timestamp("price_proposed_at", { mode: 'string' }),
	clientResponse: text("client_response"),
	clientResponseAt: timestamp("client_response_at", { mode: 'string' }),
	clientResponseMessage: text("client_response_message"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bookings_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "bookings_driver_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.vehicleId],
			foreignColumns: [vehicles.id],
			name: "bookings_vehicle_id_vehicles_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.cancelledBy],
			foreignColumns: [users.id],
			name: "bookings_cancelled_by_users_id_fk"
		}).onDelete("set null"),
	check("passengers_check", sql`passengers > 0`),
	check("luggage_check", sql`luggage >= 0`),
]);

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: serial().primaryKey().notNull(),
	roleName: text("role_name").notNull(),
	resource: text().notNull(),
	action: text().notNull(),
	allowed: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleName],
			foreignColumns: [customRoles.name],
			name: "role_permissions_role_name_custom_roles_name_fk"
		}).onDelete("cascade"),
	check("unique_role_permission", sql`ROW(role_name, resource, action) IS NOT NULL`),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	image: text(),
	password: text(),
	role: userRole().default('customer').notNull(),
	phone: text(),
	licenseNumber: text("license_number"),
	isActive: boolean("is_active").default(true).notNull(),
	resetToken: text("reset_token"),
	resetTokenExpiry: timestamp("reset_token_expiry", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	loginAttempts: integer("login_attempts").default(0).notNull(),
	accountLockedUntil: timestamp("account_locked_until", { mode: 'string' }),
	lastFailedLogin: timestamp("last_failed_login", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_license_number_unique").on(table.licenseNumber),
	check("driver_license_check", sql`(role <> 'driver'::user_role) OR (license_number IS NOT NULL)`),
]);

export const vehicles = pgTable("vehicles", {
	id: serial().primaryKey().notNull(),
	make: text().notNull(),
	model: text().notNull(),
	year: integer().notNull(),
	plateNumber: text("plate_number").notNull(),
	capacity: integer().notNull(),
	vehicleType: vehicleType("vehicle_type").default('sedan').notNull(),
	photo: text(),
	category: text(),
	description: text(),
	features: text(),
	driverId: text("driver_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "vehicles_driver_id_users_id_fk"
		}).onDelete("set null"),
	unique("vehicles_plate_number_unique").on(table.plateNumber),
	check("year_check", sql`(year >= 1900) AND ((year)::numeric <= (EXTRACT(year FROM now()) + (2)::numeric))`),
	check("capacity_check", sql`(capacity > 0) AND (capacity <= 50)`),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
});

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	quoteId: integer("quote_id").notNull(),
	customerName: text("customer_name").notNull(),
	customerEmail: text("customer_email").notNull(),
	customerPhone: text("customer_phone"),
	service: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('20.00').notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	status: invoiceStatus().default('pending').notNull(),
	issueDate: timestamp("issue_date", { mode: 'string' }).defaultNow().notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	paidDate: timestamp("paid_date", { mode: 'string' }),
	paymentMethod: text("payment_method"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [quotes.id],
			name: "invoices_quote_id_quotes_id_fk"
		}).onDelete("restrict"),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
	check("amount_check", sql`amount > (0)::numeric`),
	check("total_check", sql`total_amount > (0)::numeric`),
]);

export const driverAvailability = pgTable("driver_availability", {
	id: serial().primaryKey().notNull(),
	driverId: text("driver_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	specificDate: timestamp("specific_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "fk_driver"
		}).onDelete("cascade"),
]);

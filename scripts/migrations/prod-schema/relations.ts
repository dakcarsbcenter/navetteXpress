import { relations } from "drizzle-orm/relations";
import { users, quotes, sessions, bookings, reviews, vehicles, accounts, customRoles, rolePermissions, invoices, driverAvailability } from "./schema";

export const quotesRelations = relations(quotes, ({one, many}) => ({
	user: one(users, {
		fields: [quotes.assignedTo],
		references: [users.id]
	}),
	invoices: many(invoices),
}));

export const usersRelations = relations(users, ({many}) => ({
	quotes: many(quotes),
	sessions: many(sessions),
	reviews_customerId: many(reviews, {
		relationName: "reviews_customerId_users_id"
	}),
	reviews_driverId: many(reviews, {
		relationName: "reviews_driverId_users_id"
	}),
	bookings_userId: many(bookings, {
		relationName: "bookings_userId_users_id"
	}),
	bookings_driverId: many(bookings, {
		relationName: "bookings_driverId_users_id"
	}),
	bookings_cancelledBy: many(bookings, {
		relationName: "bookings_cancelledBy_users_id"
	}),
	accounts: many(accounts),
	vehicles: many(vehicles),
	driverAvailabilities: many(driverAvailability),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	booking: one(bookings, {
		fields: [reviews.bookingId],
		references: [bookings.id]
	}),
	user_customerId: one(users, {
		fields: [reviews.customerId],
		references: [users.id],
		relationName: "reviews_customerId_users_id"
	}),
	user_driverId: one(users, {
		fields: [reviews.driverId],
		references: [users.id],
		relationName: "reviews_driverId_users_id"
	}),
}));

export const bookingsRelations = relations(bookings, ({one, many}) => ({
	reviews: many(reviews),
	user_userId: one(users, {
		fields: [bookings.userId],
		references: [users.id],
		relationName: "bookings_userId_users_id"
	}),
	user_driverId: one(users, {
		fields: [bookings.driverId],
		references: [users.id],
		relationName: "bookings_driverId_users_id"
	}),
	vehicle: one(vehicles, {
		fields: [bookings.vehicleId],
		references: [vehicles.id]
	}),
	user_cancelledBy: one(users, {
		fields: [bookings.cancelledBy],
		references: [users.id],
		relationName: "bookings_cancelledBy_users_id"
	}),
}));

export const vehiclesRelations = relations(vehicles, ({one, many}) => ({
	bookings: many(bookings),
	user: one(users, {
		fields: [vehicles.driverId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	customRole: one(customRoles, {
		fields: [rolePermissions.roleName],
		references: [customRoles.name]
	}),
}));

export const customRolesRelations = relations(customRoles, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	quote: one(quotes, {
		fields: [invoices.quoteId],
		references: [quotes.id]
	}),
}));

export const driverAvailabilityRelations = relations(driverAvailability, ({one}) => ({
	user: one(users, {
		fields: [driverAvailability.driverId],
		references: [users.id]
	}),
}));
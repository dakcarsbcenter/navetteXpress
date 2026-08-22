-- Mettre à jour les rôles existants avant de modifier l'enum
ALTER TABLE "permissions" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer'::text;--> statement-breakpoint
UPDATE users SET role = 'chauffeur' WHERE role = 'driver';--> statement-breakpoint
UPDATE permissions SET role = 'chauffeur' WHERE role = 'driver';--> statement-breakpoint
UPDATE users SET role = 'admin' WHERE role = 'manager';--> statement-breakpoint
UPDATE permissions SET role = 'admin' WHERE role = 'manager';--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'chauffeur', 'customer');--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
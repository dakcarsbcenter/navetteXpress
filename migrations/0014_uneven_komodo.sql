CREATE TYPE "public"."company_type" AS ENUM('hotel', 'entreprise', 'ong');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_type" "company_type";
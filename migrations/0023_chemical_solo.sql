CREATE TABLE "pricing_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"route" text NOT NULL,
	"distance" text NOT NULL,
	"duree" text NOT NULL,
	"berline" integer NOT NULL,
	"suv" integer NOT NULL,
	"dot" text DEFAULT 'accent' NOT NULL,
	"zones" text[],
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

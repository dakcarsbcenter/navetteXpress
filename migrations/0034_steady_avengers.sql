-- Repare la derive de migration sur driver_availability.
--
-- La table a ete creee hors du journal drizzle (vraisemblablement un vieux db:push) : elle
-- figure dans migrations/meta/0010_snapshot.json AVEC sa cle etrangere, alors qu'aucun .sql
-- numerote ne la cree. Drizzle croit donc la contrainte posee et ne la generera jamais.
--
-- Les deux environnements ont derive differemment, cette migration doit couvrir les deux :
--   - dev (Neon)  : la table existe, mais il ne reste que la cle primaire — ni FK, ni CHECK,
--                   ni les 3 index annonces par migrations/create-driver-availability.sql ;
--   - prod (VPS)  : la table n'existe pas du tout, ce fichier .sql n'etant pas enregistre
--                   dans le journal, il n'a jamais ete applique la-bas (d'ou les
--                   `relation "driver_availability" does not exist` dans les logs prod).
--
-- Consequence corrigee : supprimer un chauffeur laissait son planning derriere lui, et un
-- identifiant recycle heritait du planning d'un autre.
--
-- Chaque etape est idempotente et sans effet sur l'environnement qui n'en a pas besoin.

-- 1. Creer la table si elle manque (cas prod), conforme a src/schema.ts des le depart.
--    Les contraintes sont nommees comme drizzle les attend, pour que les etapes 3 et 4
--    les reconnaissent et n'essaient pas de les reposer.
CREATE TABLE IF NOT EXISTS "driver_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"specific_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "day_of_week_check" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6),
	CONSTRAINT "driver_availability_driver_id_users_id_fk" FOREIGN KEY ("driver_id")
		REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);--> statement-breakpoint

-- 2. Archiver puis purger les lignes orphelines (prerequis a la FK, cas dev).
--    Les lignes archivees restent consultables dans driver_availability_orphans_backup ;
--    elles sont inexploitables en l'etat (le resume des disponibilites filtre par jointure
--    sur users), la table d'archive est donc la seule trace a conserver. Sans effet si la
--    table vient d'etre creee a l'etape 1 : elle est alors vide.
CREATE TABLE IF NOT EXISTS "driver_availability_orphans_backup" (
	"id" integer,
	"driver_id" text,
	"day_of_week" integer,
	"start_time" text,
	"end_time" text,
	"is_available" boolean,
	"specific_date" timestamp,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"archived_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

INSERT INTO "driver_availability_orphans_backup" (
	"id", "driver_id", "day_of_week", "start_time", "end_time",
	"is_available", "specific_date", "notes", "created_at", "updated_at"
)
SELECT da."id", da."driver_id", da."day_of_week", da."start_time", da."end_time",
       da."is_available", da."specific_date", da."notes", da."created_at", da."updated_at"
FROM "driver_availability" da
LEFT JOIN "users" u ON u."id" = da."driver_id"
WHERE u."id" IS NULL;--> statement-breakpoint

DELETE FROM "driver_availability" da
WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = da."driver_id");--> statement-breakpoint

-- 3. Poser la cle etrangere attendue par src/schema.ts (cas dev : table preexistante
--    sans contrainte).
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'driver_availability'::regclass
		  AND conname = 'driver_availability_driver_id_users_id_fk'
	) THEN
		ALTER TABLE "driver_availability"
			ADD CONSTRAINT "driver_availability_driver_id_users_id_fk"
			FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
	END IF;
END $$;--> statement-breakpoint

-- 4. Poser le CHECK sur day_of_week, lui aussi perdu dans la derive.
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'driver_availability'::regclass
		  AND conname = 'day_of_week_check'
	) THEN
		ALTER TABLE "driver_availability"
			ADD CONSTRAINT "day_of_week_check" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6);
	END IF;
END $$;--> statement-breakpoint

-- 5. Les index annonces par la migration d'origine (jamais crees en base).
CREATE INDEX IF NOT EXISTS "idx_driver_availability_driver_id" ON "driver_availability" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_driver_availability_day_of_week" ON "driver_availability" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_driver_availability_specific_date" ON "driver_availability" USING btree ("specific_date");

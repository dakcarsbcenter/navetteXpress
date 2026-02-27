import { db } from './src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function applySchema() {
  try {
    console.log('🚀 Starting schema application...');

    // Create enums if they don't exist
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_placement') THEN
          CREATE TYPE ad_placement AS ENUM('home_hero', 'home_services', 'home_fleet', 'home_testimonials', 'page_temoignages', 'page_flotte', 'page_services', 'client_dashboard', 'confirmation');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN
          CREATE TYPE ad_status AS ENUM('draft', 'active', 'paused', 'expired');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_type') THEN
          CREATE TYPE ad_type AS ENUM('banner_image', 'banner_animated', 'text_sponsored', 'card_sponsored');
        END IF;
      END $$;
    `);
    console.log('✅ Enums verified/created');

    // Create table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "advertisements" (
        "id" text PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "advertiser" text NOT NULL,
        "type" ad_type NOT NULL,
        "image_url" text,
        "video_url" text,
        "alt_text" text,
        "headline" text,
        "description" text,
        "cta_label" text,
        "destination_url" text NOT NULL,
        "placement" ad_placement NOT NULL,
        "width" integer,
        "height" integer,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "status" ad_status DEFAULT 'draft' NOT NULL,
        "impressions" integer DEFAULT 0 NOT NULL,
        "clicks" integer DEFAULT 0 NOT NULL,
        "invoice_ref" text,
        "price_xof" integer,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "created_by" text
      );
    `);
    console.log('✅ Table verified/created');

  } catch (error) {
    console.error('❌ Error applying schema:', error);
  } finally {
    process.exit();
  }
}

applySchema();

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function main() {
    console.log('🔄 Création de la table services...');
    await sql`
    CREATE TABLE IF NOT EXISTS services (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      description TEXT NOT NULL,
      icon       TEXT NOT NULL DEFAULT '✈️',
      slug       TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active  BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
    console.log('✅ Table services créée (ou déjà existante).');

    // Insérer les services de base depuis lib/services.ts
    const defaults = [
        { name: 'Transfert Aéroport', description: "Service de transfert vers et depuis l'aéroport AIBD de Dakar. Chauffeurs professionnels, véhicules de luxe, prix compétitifs.", icon: '✈️', slug: 'transfert-aibd-dakar', sort_order: 1 },
        { name: 'Chauffeur Privé Dakar', description: 'Service de chauffeur privé pour tous vos déplacements dans Dakar et ses environs. Confort et sécurité garantis.', icon: '🚗', slug: 'chauffeur-prive-dakar', sort_order: 2 },
        { name: 'Tours & Excursions', description: 'Découvrez Dakar et ses environs avec nos guides-chauffeurs expérimentés pour une expérience unique.', icon: '🏛️', slug: 'tours-excursions', sort_order: 3 },
        { name: 'Services VIP', description: "Service ultra-premium avec véhicules d'exception et prestations sur-mesure pour une clientèle exigeante.", icon: '👑', slug: 'services-vip', sort_order: 4 },
        { name: 'Mise à Disposition', description: 'Véhicule et chauffeur à votre disposition pour une durée déterminée avec flexibilité maximale.', icon: '⏰', slug: 'mise-a-disposition', sort_order: 5 },
        { name: 'Autres', description: 'Spécifiez votre besoin particulier', icon: '📝', slug: 'autres', sort_order: 6 },
    ];

    for (const s of defaults) {
        await sql`
      INSERT INTO services (name, description, icon, slug, sort_order, is_active)
      VALUES (${s.name}, ${s.description}, ${s.icon}, ${s.slug}, ${s.sort_order}, true)
      ON CONFLICT (slug) DO NOTHING
    `;
        console.log(`  ✓ ${s.name}`);
    }

    console.log('\n✅ Migration terminée. Services prêts.');
    await sql.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

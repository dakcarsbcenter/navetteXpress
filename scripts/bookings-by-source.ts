// Réservations du mois par page d'entrée et par source (lecture seule).
//
//   npm run seo:bookings -- --month=2026-11
//
// Complète scripts/seo-monthly-refresh.ts : celui-ci dit quoi retravailler sur les
// pages, ce script dit lesquelles amènent réellement des courses. Les colonnes
// viennent de src/lib/attribution.ts (migration 0040) : les réservations plus
// anciennes et celles saisies en back-office n'ont pas de provenance.
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

function monthBounds(): { label: string; start: string; end: string } {
  const arg = process.argv.find((a) => a.startsWith('--month='))?.replace('--month=', '').trim();
  const now = new Date();
  const label = arg && /^\d{4}-\d{2}$/.test(arg)
    ? arg
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const [y, m] = label.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return { label, start: `${label}-01`, end: `${next}-01` };
}

// Même lecture que le détail admin (BookingDetailsModal) : gclid = Google Ads,
// sinon utm_source, sinon hôte référent, sinon accès direct.
const SOURCE_SQL = `
  CASE
    WHEN gclid IS NOT NULL THEN 'google-ads'
    WHEN utm_source IS NOT NULL THEN utm_source || COALESCE(' / ' || utm_medium, '')
    WHEN referrer IS NOT NULL THEN referrer
    WHEN landing_page IS NOT NULL THEN 'direct'
    ELSE '(non suivi)'
  END`;

async function main() {
  const { label, start, end } = monthBounds();
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const params = [start, end];
    const byPage = await client.query(
      `SELECT COALESCE(landing_page, '(non suivi)') AS page,
              count(*)::int AS reservations,
              count(*) FILTER (WHERE status = 'completed')::int AS terminees,
              count(*) FILTER (WHERE status = 'cancelled')::int AS annulees
         FROM bookings
        WHERE created_at >= $1 AND created_at < $2
        GROUP BY 1 ORDER BY 2 DESC`,
      params,
    );
    const bySource = await client.query(
      `SELECT ${SOURCE_SQL} AS source, count(*)::int AS reservations
         FROM bookings
        WHERE created_at >= $1 AND created_at < $2
        GROUP BY 1 ORDER BY 2 DESC`,
      params,
    );

    console.log(`\nRéservations ${label} par page d'entrée`);
    console.table(byPage.rows);
    console.log(`Réservations ${label} par source`);
    console.table(bySource.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

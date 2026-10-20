// Audit en lecture seule des photos de véhicules : teste chaque URL de
// vehicles.photo et liste celles qui ne répondent pas (404, timeout...).
//
// Usage : DATABASE_URL=<url de la base à auditer> node scripts/check-vehicle-images.mjs
// Pour la prod, lancer depuis le VPS (ou avec l'URL prod en variable d'environnement).
// Aucune écriture : le remplacement d'une photo se fait ensuite dans l'admin (Véhicules).
import postgres from 'postgres';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL non définie.');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

async function probe(url) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10_000) });
    // Certains hébergeurs refusent HEAD : on retente en GET avant de conclure.
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10_000) });
    }
    return String(res.status);
  } catch (error) {
    return `ERREUR (${error.name})`;
  }
}

try {
  const rows = await sql`
    select id, make, model, photo, is_active
    from vehicles
    where photo is not null and photo <> ''
    order by id`;

  console.log(`${rows.length} véhicule(s) avec une photo.\n`);

  const broken = [];
  for (const row of rows) {
    const status = await probe(row.photo);
    if (!status.startsWith('2')) broken.push({ ...row, status });
  }

  if (broken.length === 0) {
    console.log('Toutes les photos répondent.');
  } else {
    console.log(`${broken.length} photo(s) en échec :\n`);
    for (const b of broken) {
      console.log(`#${b.id} ${b.make} ${b.model}${b.is_active ? '' : ' (inactif)'} -> ${b.status}`);
      console.log(`   ${b.photo}`);
    }
  }
} finally {
  await sql.end();
}

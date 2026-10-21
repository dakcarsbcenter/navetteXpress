import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { allMoneyPages, moneyRoutePages, moneyServicePages, slugToLabel } from '../src/lib/seo-money-pages';

interface RefreshTaskRow {
  pageType: 'route' | 'service';
  pagePath: string;
  intentKeyword: string;
  priority: 'P1' | 'P2';
  focusBlock: string;
}

interface ClusterMappingRow {
  cluster: string;
  intent: string;
  targetKeywords: string;
  targetPath: string;
  canonicalPath: string;
  priority: 'P1' | 'P2' | 'P3';
}

function parseMonthArg(): string {
  const monthArg = process.argv.find((arg) => arg.startsWith('--month='));
  if (!monthArg) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  const rawMonth = monthArg.replace('--month=', '').trim();
  if (/^\d{4}-\d{2}$/.test(rawMonth)) {
    return rawMonth;
  }

  throw new Error('Format invalide pour --month. Utilisez YYYY-MM, ex: --month=2026-04');
}

function buildRefreshRows(): RefreshTaskRow[] {
  return allMoneyPages.map((page) => {
    const isPriorityRoute = page.kind === 'route' && ['dakar-aibd', 'aibd-saly', 'aibd-somone'].includes(page.slug);

    return {
      pageType: page.kind,
      pagePath: page.canonicalPath,
      intentKeyword: page.translations.fr.intentKeyword,
      priority: isPriorityRoute ? 'P1' : 'P2',
      focusBlock: isPriorityRoute ? 'Title/H1 + FAQ objections + CTA reservation' : 'FAQ + maillage interne + preuves sociales',
    };
  });
}

function buildClusterMappingRows(): ClusterMappingRow[] {
  return [
    {
      cluster: 'Navette AIBD',
      intent: 'Transactionnel',
      targetKeywords: 'navette aeroport dakar; transfert aibd dakar; navette aibd',
      targetPath: '/navette-aeroport-aibd',
      canonicalPath: '/services/transfert-aeroport-aibd',
      priority: 'P1',
    },
    {
      cluster: 'Chauffeur prive Dakar',
      intent: 'Transactionnel',
      targetKeywords: 'chauffeur prive dakar; chauffeur senegal; transport prive dakar',
      targetPath: '/chauffeur-prive-dakar',
      canonicalPath: '/services/chauffeur-prive-dakar',
      priority: 'P1',
    },
    {
      cluster: 'AIBD -> Dakar',
      intent: 'Transactionnel route',
      targetKeywords: 'transfert aibd dakar; taxi aeroport dakar prix; transport aibd centre ville',
      targetPath: '/trajet/aibd-vers-dakar',
      canonicalPath: '/routes/aibd-dakar',
      priority: 'P1',
    },
    {
      cluster: 'AIBD -> Saly',
      intent: 'Transactionnel route',
      targetKeywords: 'transfert aibd saly; navette aeroport saly',
      targetPath: '/trajet/aibd-vers-saly',
      canonicalPath: '/routes/aibd-saly',
      priority: 'P1',
    },
    {
      cluster: 'AIBD -> Ngaparou',
      intent: 'Transactionnel route',
      targetKeywords: 'transfert aibd ngaparou; chauffeur aeroport ngaparou',
      targetPath: '/trajet/aibd-vers-ngaparou',
      canonicalPath: '/routes/aibd-ngaparou',
      priority: 'P1',
    },
    {
      cluster: 'AIBD -> Nianing',
      intent: 'Transactionnel route',
      targetKeywords: 'transfert aibd nianing; navette nianing aeroport',
      targetPath: '/trajet/aibd-vers-nianing',
      canonicalPath: '/routes/aibd-nianing',
      priority: 'P1',
    },
    {
      cluster: 'Dakar -> AIBD retour',
      intent: 'Transactionnel route',
      targetKeywords: 'transfert dakar aibd; navette dakar aeroport',
      targetPath: '/trajet/dakar-vers-aibd',
      canonicalPath: '/routes/dakar-aibd',
      priority: 'P1',
    },
    {
      cluster: 'Prix et reservation',
      intent: 'Commercial',
      targetKeywords: 'prix transfert aibd; tarif chauffeur prive dakar',
      targetPath: '/tarifs-transferts-aibd',
      canonicalPath: '/services/transfert-aeroport-aibd',
      priority: 'P2',
    },
    {
      cluster: 'Business travel',
      intent: 'Transactionnel use-case',
      targetKeywords: 'transport affaires dakar; chauffeur entreprise dakar',
      targetPath: '/service/transfert-business-dakar',
      canonicalPath: '/services/chauffeur-affaires-dakar',
      priority: 'P2',
    },
    {
      cluster: 'Famille',
      intent: 'Transactionnel use-case',
      targetKeywords: 'transfert famille aibd; transfert famille dakar',
      targetPath: '/service/transfert-famille-vip',
      canonicalPath: '/services/transfert-famille-dakar',
      priority: 'P2',
    },
    {
      cluster: 'Comparatif',
      intent: 'Commercial',
      targetKeywords: 'taxi vs transfert prive dakar; meilleur transfert aibd',
      targetPath: '/guide/taxi-vs-transfert-prive-dakar',
      canonicalPath: '/faq',
      priority: 'P3',
    },
    {
      cluster: 'EN travelers',
      intent: 'Transactionnel international',
      targetKeywords: 'airport transfer dakar; private driver senegal; aibd transfer',
      targetPath: '/en/airport-transfer-dakar-aibd',
      canonicalPath: '/en',
      priority: 'P2',
    },
  ];
}

function buildMarkdown(month: string, rows: RefreshTaskRow[]): string {
  const header = [
    `# Refresh SEO Mensuel - ${month}`,
    '',
    '## Objectif',
    '- Maintenir les pages money a jour pour accelerer Top 10/Top 3 sur clusters routes.',
    '- Conserver un avantage de couverture et CTR face a aerocabsenegal.com.',
    '- Alimenter la phase J91-J180 avec une cadence stable et industrialisee.',
    '',
    '## Checklist runbook',
    '- [ ] Export GSC 90 jours: clics, impressions, CTR, position (pages money uniquement).',
    '- [ ] Identifier les pages 4-15 avec CTR sous mediane et les passer en priorite P1.',
    '- [ ] Mettre a jour title/H1/description + bloc FAQ + CTA sur toutes les pages P1.',
    '- [ ] Verifier maillage interne entre pages routes/services et /reservation.',
    '- [ ] Auditer snippet concurrentiel sur 20 requetes routes pour benchmark CTR.',
    '- [ ] Renseigner les resultats avant/apres en fin de mois.',
    '',
    `## Couverture actuelle`,
    `- Pages routes: ${moneyRoutePages.length}`,
    `- Pages services: ${moneyServicePages.length}`,
    `- Total pages money: ${allMoneyPages.length}`,
    '',
    '## File de refresh',
    '| Priorite | Type | Page | Keyword intent | Bloc de refresh principal |',
    '| --- | --- | --- | --- | --- |',
  ];

  const tableRows = rows.map((row) => `| ${row.priority} | ${row.pageType} | ${row.pagePath} | ${row.intentKeyword} | ${row.focusBlock} |`);

  const trailing = [
    '',
    '## Backlog EN longue trainee (J91-J180)',
    ...moneyRoutePages.map((route) => {
      const label = slugToLabel(route.slug);
      return `- [ ] Build EN variant for ${label}: "${label} airport transfer", "private driver ${label}", "fixed fare ${label}".`;
    }),
    '',
    '## Journal de performance',
    '| KPI | Baseline | Resultat fin de mois | Delta |',
    '| --- | --- | --- | --- |',
    '| Leads SEO qualifies | A renseigner | A renseigner | A renseigner |',
    '| Mots-cles routes Top 10 | A renseigner | A renseigner | A renseigner |',
    '| Mots-cles routes Top 3 | A renseigner | A renseigner | A renseigner |',
    '| CTR routes vs concurrent | A renseigner | A renseigner | A renseigner |',
  ];

  return [...header, ...tableRows, ...trailing].join('\n');
}

function buildClusterMarkdown(month: string, rows: ClusterMappingRow[]): string {
  const header = [
    `# Tableau Clusters et Mapping de Pages - ${month}`,
    '',
    '## Objectif J180',
    '- Part de trafic non-brand en hausse continue.',
    '- Portefeuille de pages routes dominant sur les requetes locales prioritaires.',
    '- Croissance leads plus stable et moins dependante du brand.',
    '',
    '## Clusters mots-cles et mapping de pages',
    '| Cluster | Intent | Mots-cles cibles | Page cible | Canonical en prod | Priorite |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  const tableRows = rows.map(
    (row) =>
      `| ${row.cluster} | ${row.intent} | ${row.targetKeywords} | ${row.targetPath} | ${row.canonicalPath} | ${row.priority} |`,
  );

  return [...header, ...tableRows].join('\n');
}

function buildCsv(rows: RefreshTaskRow[]): string {
  const lines = ['priority,page_type,page_path,intent_keyword,focus_block,status'];
  for (const row of rows) {
    lines.push(`${row.priority},${row.pageType},${row.pagePath},${row.intentKeyword},${row.focusBlock},todo`);
  }
  return lines.join('\n');
}

function buildClusterCsv(rows: ClusterMappingRow[]): string {
  const lines = ['cluster,intent,target_keywords,target_path,canonical_path,priority,status'];
  for (const row of rows) {
    lines.push(
      `${row.cluster},${row.intent},${row.targetKeywords},${row.targetPath},${row.canonicalPath},${row.priority},mapped-via-redirect`,
    );
  }
  return lines.join('\n');
}

// Vocabulaire interdit sur le site public : le site ne propose ni luxe ni VIP, et
// ne peut pas affirmer ce qu'il ne mesure pas (classement N°1, chauffeurs
// certifies, delais de reponse garantis). Les dashboards (messages/*/dashboard-*,
// statuses) sont hors perimetre : ils ne sont pas publics.
const FORBIDDEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'luxe / luxury / lujo', pattern: /\bluxe\b|\bluxury\b|\blujo\b|\bluxueu\w*|\blujos\w*/i },
  { label: 'premium', pattern: /\bpremium\b/i },
  { label: 'prestige', pattern: /\bprestig\w*/i },
  { label: 'VIP', pattern: /\bvip\b/i },
  { label: 'classement N°1', pattern: /N°\s?1\b|#1\b|\bnum[eé]ro 1\b/i },
  { label: 'certifie', pattern: /\bcertifi[eé]s?\b|\bcertified\b|\bcertificad[oa]s\b/i },
  { label: 'reponse garantie sous 2 h', pattern: /sous 2 ?(h|heures)|within 2 hours|(respuesta|responder\w*).{0,40}2 horas|plazo de 2 horas/i },
  { label: '15 minutes avant', pattern: /15 min\w* (avant|en avance|early|antes)/i },
];

// Chaines a ignorer : noms propres qui contiennent un mot interdit.
const ALLOWED_PHRASES = [/Exclusive/];

interface VocabularyFinding {
  source: string;
  label: string;
  excerpt: string;
}

function collectStrings(value: unknown, trail: string, out: { key: string; text: string }[]): void {
  if (typeof value === 'string') {
    out.push({ key: trail, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${trail}[${index}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) collectStrings(item, trail ? `${trail}.${key}` : key, out);
  }
}

function scanText(source: string, text: string, findings: VocabularyFinding[]): void {
  for (const { label, pattern } of FORBIDDEN_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const start = Math.max(0, match.index - 30);
    const excerpt = text.slice(start, match.index + match[0].length + 30).replace(/\s+/g, ' ');
    if (ALLOWED_PHRASES.some((allowed) => allowed.test(excerpt))) continue;
    findings.push({ source, label, excerpt });
  }
}

async function scanForbiddenVocabulary(): Promise<VocabularyFinding[]> {
  const findings: VocabularyFinding[] = [];

  for (const locale of ['fr', 'en', 'es']) {
    const dir = path.join(process.cwd(), 'messages', locale);
    for (const file of (await readdir(dir)).filter((name) => name.endsWith('.json'))) {
      if (file.startsWith('dashboard-') || file === 'statuses.json') continue;
      const strings: { key: string; text: string }[] = [];
      collectStrings(JSON.parse(await readFile(path.join(dir, file), 'utf-8')), '', strings);
      for (const { key, text } of strings) scanText(`messages/${locale}/${file} ${key}`, text, findings);
    }
  }

  for (const page of allMoneyPages) {
    for (const [locale, translation] of Object.entries(page.translations)) {
      const strings: { key: string; text: string }[] = [];
      collectStrings(translation, '', strings);
      for (const { key, text } of strings) scanText(`seo-money-pages ${page.slug} ${locale} ${key}`, text, findings);
    }
  }

  return findings;
}

async function main(): Promise<void> {
  const month = parseMonthArg();
  const outputDir = path.join(process.cwd(), 'docs', 'seo', 'refresh');
  await mkdir(outputDir, { recursive: true });

  const rows = buildRefreshRows();
  const clusterRows = buildClusterMappingRows();
  const markdown = buildMarkdown(month, rows);
  const csv = buildCsv(rows);
  const clusterMarkdown = buildClusterMarkdown(month, clusterRows);
  const clusterCsv = buildClusterCsv(clusterRows);

  const markdownPath = path.join(outputDir, `monthly-refresh-${month}.md`);
  const csvPath = path.join(outputDir, `monthly-refresh-${month}.csv`);
  const clusterMarkdownPath = path.join(outputDir, `clusters-mapping-${month}.md`);
  const clusterCsvPath = path.join(outputDir, `clusters-mapping-${month}.csv`);

  await Promise.all([
    writeFile(markdownPath, markdown, 'utf-8'),
    writeFile(csvPath, csv, 'utf-8'),
    writeFile(clusterMarkdownPath, clusterMarkdown, 'utf-8'),
    writeFile(clusterCsvPath, clusterCsv, 'utf-8'),
  ]);

  console.log(`Refresh SEO genere: ${markdownPath}`);
  console.log(`Template CSV genere: ${csvPath}`);
  console.log(`Mapping clusters genere: ${clusterMarkdownPath}`);
  console.log(`Mapping clusters CSV genere: ${clusterCsvPath}`);

  const findings = await scanForbiddenVocabulary();
  if (findings.length === 0) {
    console.log('Controle vocabulaire : aucun terme interdit.');
  } else {
    console.warn(`Controle vocabulaire : ${findings.length} occurrence(s) a corriger.`);
    for (const finding of findings) console.warn(`  [${finding.label}] ${finding.source} : ...${finding.excerpt}...`);
    // --strict : fait echouer le script (CI), sinon simple avertissement.
    if (process.argv.includes('--strict')) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Echec generation refresh SEO:', error);
  process.exitCode = 1;
});

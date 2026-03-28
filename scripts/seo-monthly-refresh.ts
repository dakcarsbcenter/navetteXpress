import { mkdir, writeFile } from 'node:fs/promises';
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
      intentKeyword: page.intentKeyword,
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
      cluster: 'Famille/VIP',
      intent: 'Transactionnel use-case',
      targetKeywords: 'transfert famille aibd; transfert vip dakar',
      targetPath: '/service/transfert-famille-vip',
      canonicalPath: '/services/transfert-famille-vip-dakar',
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
}

main().catch((error) => {
  console.error('Echec generation refresh SEO:', error);
  process.exitCode = 1;
});

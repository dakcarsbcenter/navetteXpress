import { moneyRoutePages } from '@/lib/seo-money-pages';

export interface WeeklyKpiRow {
  metric: string;
  source: 'GSC' | 'GA4' | 'CRM' | 'Mix';
  baseline: string;
  target90d: string;
  target180d: string;
  note: string;
}

export interface RouteClusterTargetRow {
  cluster: string;
  baselineTop10: string;
  targetTop10: string;
  baselineTop3: string;
  targetTop3: string;
  baselineCtr: string;
  targetCtr: string;
}

export interface CompetitorBenchmarkRow {
  metric: string;
  navetteXpress: string;
  competitor: string;
  target: string;
  action: string;
}

export interface ExecutionSprintRow {
  phase: string;
  objective: string;
  keyActions: string[];
  output: string;
}

export interface GeoExpansionRow {
  zone: string;
  trigger: string;
  pagePack: string;
  kpiGate: string;
}

export const weeklySeoKpiRows: WeeklyKpiRow[] = [
  {
    metric: 'Impressions pages money',
    source: 'GSC',
    baseline: 'A renseigner J30',
    target90d: '+60%',
    target180d: '+110%',
    note: 'Suivre uniquement les 12 pages prioritaires FR',
  },
  {
    metric: 'CTR moyen pages position 4-15',
    source: 'GSC',
    baseline: 'A renseigner J30',
    target90d: '+25%',
    target180d: '+40%',
    note: 'Apres tests titres + benefices + prix fixe + 24/7',
  },
  {
    metric: 'Sessions organiques pages money',
    source: 'GA4',
    baseline: 'A renseigner J30',
    target90d: '+50%',
    target180d: '+90%',
    note: 'Analyser FR puis EN voyageurs',
  },
  {
    metric: 'Taux conversion lead par page money',
    source: 'GA4',
    baseline: 'A renseigner J30',
    target90d: '+20%',
    target180d: '+35%',
    note: 'Identifier les pages sous-performantes a refresh bi-hebdo',
  },
  {
    metric: 'Leads SEO qualifies',
    source: 'CRM',
    baseline: 'A renseigner J30',
    target90d: '+40%',
    target180d: '+70%',
    note: 'Objectif principal du plan J31-J90',
  },
  {
    metric: 'Leads par route prioritaire',
    source: 'CRM',
    baseline: 'A renseigner J30',
    target90d: '+35%',
    target180d: '+60%',
    note: 'Prioriser Dakar-AIBD, AIBD-Saly et AIBD-Somone',
  },
  {
    metric: 'Mots-cles routes en Top 10',
    source: 'GSC',
    baseline: 'A renseigner J30',
    target90d: '+45%',
    target180d: '+75%',
    note: 'Mesurer uniquement les clusters routes transactionnels',
  },
  {
    metric: 'Mots-cles routes en Top 3',
    source: 'GSC',
    baseline: 'A renseigner J30',
    target90d: '+30%',
    target180d: '+55%',
    note: 'Concentrer les tests CTR sur les pages deja 3-8',
  },
  {
    metric: 'Couverture routes vs aerocabsenegal.com',
    source: 'Mix',
    baseline: 'A renseigner J30',
    target90d: '>= 1.2x',
    target180d: '>= 1.5x',
    note: 'Comparer volume de pages route indexees + positions Top 10',
  },
  {
    metric: 'CTR routes vs aerocabsenegal.com',
    source: 'Mix',
    baseline: 'A renseigner J30',
    target90d: '+15% relatif',
    target180d: '+25% relatif',
    note: 'Utiliser la meme liste de requetes de marque faible',
  },
];

export const routeClusterTargets: RouteClusterTargetRow[] = [
  {
    cluster: 'AIBD <-> Dakar',
    baselineTop10: 'A renseigner J30',
    targetTop10: '+35%',
    baselineTop3: 'A renseigner J30',
    targetTop3: '+25%',
    baselineCtr: 'A renseigner J30',
    targetCtr: '+20%',
  },
  {
    cluster: 'AIBD <-> Petite Cote (Saly/Somone/Mbour)',
    baselineTop10: 'A renseigner J30',
    targetTop10: '+55%',
    baselineTop3: 'A renseigner J30',
    targetTop3: '+35%',
    baselineCtr: 'A renseigner J30',
    targetCtr: '+18%',
  },
  {
    cluster: 'AIBD <-> Thies / Saint-Louis',
    baselineTop10: 'A renseigner J30',
    targetTop10: '+40%',
    baselineTop3: 'A renseigner J30',
    targetTop3: '+28%',
    baselineCtr: 'A renseigner J30',
    targetCtr: '+15%',
  },
];

export const competitorBenchmarkRows: CompetitorBenchmarkRow[] = [
  {
    metric: 'Pages routes indexees',
    navetteXpress: `${moneyRoutePages.length} pages money routes`,
    competitor: 'A auditer mensuellement',
    target: 'Garder un ratio >= 1.5x',
    action: 'Publier 2 nouvelles pages route EN/FR par mois selon ROI',
  },
  {
    metric: 'Part de requetes routes en Top 10',
    navetteXpress: 'A renseigner J30',
    competitor: 'A renseigner J30',
    target: 'Passer devant sur 60%+ des requetes coeur',
    action: 'Optimiser entities locales + FAQ transactionnelles',
  },
  {
    metric: 'CTR median routes',
    navetteXpress: 'A renseigner J30',
    competitor: 'Proxy via SERP sampling manuel',
    target: '+15% a J90 / +25% a J180',
    action: 'AB tests titres (prix fixe + 24/7 + zone)',
  },
  {
    metric: 'Snippets enrichis visibles',
    navetteXpress: 'A renseigner J30',
    competitor: 'A renseigner J30',
    target: '2x plus de SERP avec FAQ/Review rich results',
    action: 'Renforcer schema FAQ + LocalBusiness + Breadcrumb',
  },
];

export const seoExecutionSprints: ExecutionSprintRow[] = [
  {
    phase: 'J31-J60',
    objective: 'Acceleration cluster routes et gains rapides CTR',
    keyActions: [
      'Reecriture de titres/meta des pages routes classees 4-15.',
      'Ajout de blocs FAQ orientees objections prix, delai et securite.',
      'Renforcement maillage interne routes <-> services <-> reservation.',
    ],
    output: 'Top 10 en hausse visible sur clusters transactionnels.',
  },
  {
    phase: 'J61-J90',
    objective: 'Conversion SEO et depassement concurrentiel initial',
    keyActions: [
      'Lancement de pages comparatives orientees intent (sans marque deposee).',
      'Publication d un guide trajet prioritaire par semaine.',
      'Pilotage CRM hebdo des leads SEO par route.',
    ],
    output: '+40% leads SEO et avantage CTR route mesurable.',
  },
  {
    phase: 'J91-J120',
    objective: 'Consolidation SERP et expansion longue traine EN',
    keyActions: [
      'Creation de clusters EN autour airport transfer, private driver et coastal routes.',
      'Deployment de pages FAQ EN par scenario (family, business, late flight).',
      'Refresh mensuel industrialise sur toutes les pages money.',
    ],
    output: 'Top 3 en progression sur pages FR fortes + premieres positions EN.',
  },
  {
    phase: 'J121-J180',
    objective: 'Domination durable + extension geographique selective',
    keyActions: [
      'Actifs a liens: rapport saisonnier, guide comparatif, et pages data-led.',
      'Expansion geographique uniquement sur zones avec CAC/lead SEO favorable.',
      'Reinvestissement contenu sur clusters generant le meilleur taux de closing.',
    ],
    output: 'Leadership stable sur routes coeur et croissance organique soutenue.',
  },
];

export const geoExpansionRows: GeoExpansionRow[] = [
  {
    zone: 'Petite Cote et balneaire premium',
    trigger: '>= 12 leads/mois et taux closing >= mediane routes',
    pagePack: '4 pages routes + 1 guide local + 1 page comparative',
    kpiGate: 'CPA SEO <= 0.8x moyenne compte',
  },
  {
    zone: 'Axe business Dakar-Thies',
    trigger: '>= 8 leads corporate/mois',
    pagePack: '2 pages business + 1 rapport transport affaires',
    kpiGate: 'Panier moyen >= +20% vs loisir',
  },
  {
    zone: 'Longue distance nord (Saint-Louis)',
    trigger: 'Impressions EN+FR en hausse 3 mois consecutifs',
    pagePack: '2 pages routes + 1 guide saisonnier',
    kpiGate: 'CTR >= 4% sur requetes non marque',
  },
];

export const weeklyDashboardChecklist: string[] = [
  'Exporter GSC: requetes + pages money (7 derniers jours vs 28 jours).',
  'Exporter GA4: sessions organiques, conversions, pages de destination.',
  'Exporter CRM: leads qualifies et statut par page source.',
  'Identifier top 5 pages en positions 4-15 et lancer test CTR.',
  'Planifier refresh bi-hebdo des pages sous mediane conversion.',
  'Reporter tendances dans ce dashboard chaque lundi.',
];

export const monthlyMoneyPageRefreshChecklist: string[] = [
  'Extraire les 90 derniers jours GSC pour chaque page money (clics, impressions, CTR, position).',
  'Prioriser les pages avec CTR sous mediane et positions 4-15.',
  'Mettre a jour title, h1, FAQ et bloc preuve sociale sur 30% des pages cibles.',
  'Verifier coherence interne: liens vers /reservation + pages routes associees.',
  'Controler schema FAQ/Breadcrumb et date de derniere mise a jour visible.',
  'Logger avant/apres dans le rapport mensuel pour decision ROI geographique.',
];
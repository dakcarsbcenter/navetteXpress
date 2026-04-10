# SEO Execution Playbook J90 -> J180

## Cibles business
- +40% leads SEO qualifies a J90 (vs baseline J30).
- Hausse nette des mots-cles routes en Top 10 et Top 3.
- Avantage mesurable vs aerocabsenegal.com sur couverture routes et CTR.
- Consolidation J91-J180: domination SERP stable + expansion internationale EN.

## Scorecard officielle
| KPI | Baseline J30 | Cible J90 | Cible J180 | Source |
| --- | --- | --- | --- | --- |
| Leads SEO qualifies | A renseigner | +40% | +70% | CRM |
| Mots-cles routes Top 10 | A renseigner | +45% | +75% | GSC |
| Mots-cles routes Top 3 | A renseigner | +30% | +55% | GSC |
| CTR routes (non-brand) | A renseigner | +15% relatif | +25% relatif | GSC + audit SERP |
| Couverture routes vs concurrent | A renseigner | >= 1.2x | >= 1.5x | Crawl pages + GSC |

## Plan d execution

### Sprint J31-J60
- Reoptimiser les pages routes positionnees 4-15 (title, h1, meta, FAQ).
- Renforcer le maillage interne vers routes/services/reservation.
- Declencher un AB test CTR sur les 10 pages routes les plus proches du Top 3.

Livrable:
- Tableau de suivi Top 10 / Top 3 par cluster routes.
- Liste des tests CTR deployes et dates de publication.

### Sprint J61-J90
- Publier 1 guide trajet par semaine sur les routes prioritaires.
- Publier 2 actifs comparatifs orientes conversion (frais, delais, confort, process).
- Boucler le reporting concurrent mensuel vs aerocabsenegal.com.

Livrable:
- Rapport J90 avec progression leads SEO, couverture routes et CTR.

### Sprint J91-J120
- Etendre la profondeur semantique EN longue trainee (airport transfer, private chauffeur, hotel transfer).
- Decliner les pages routes FR gagnantes en variantes EN (intent transactionnel + FAQ).
- Industrialiser le refresh mensuel via script seo:refresh:monthly.

Livrable:
- Pack EN route cluster (minimum 6 pages ciblees + 2 guides supports).

### Sprint J121-J180
- Renforcer les actifs a liens:
  - Guides trajets data-led.
  - Rapports saisonniers trafic / demande transfert.
  - Pages comparatives orientees scenario client.
- Etendre geographies adjacentes uniquement selon ROI reel.

Livrable:
- Tableau ROI geographique avec decisions go/no-go.

## Matrice priorite routes (FR)
| Cluster | Routes coeur | Type d intent | Priorite |
| --- | --- | --- | --- |
| AIBD <-> Dakar | dakar-aibd | Transactionnel immediate | P1 |
| AIBD <-> Petite Cote | aibd-saly, aibd-somone, aibd-mbour | Loisirs + transfert hotel | P1 |
| AIBD <-> Thies/Nord | aibd-thies, aibd-saint-louis | Business + longue distance | P2 |

## Matrice expansion geographique (J91-J180)
| Zone | Trigger ROI | Pack contenu minimum | Decision |
| --- | --- | --- | --- |
| Petite Cote premium | >= 12 leads/mois & closing >= mediane | 4 pages routes + 1 guide + 1 comparative | Go si CPA SEO <= 0.8x |
| Axe Dakar-Thies business | >= 8 leads corporate/mois | 2 pages business + 1 rapport | Go si panier moyen >= +20% |
| Nord longue distance | 3 mois de croissance impressions | 2 pages routes + 1 guide saisonnier | Go si CTR >= 4% |

## Rituel operationnel hebdomadaire
1. Export GSC pages money (7j vs 28j).
2. Export GA4 sessions organiques + conversions sur pages money.
3. Export CRM leads qualifies par page source.
4. Prioriser pages position 4-15 et CTR sous mediane.
5. Lancer refresh cible + noter publication.

## Industrialisation mensuelle
Commande:

```bash
npm run seo:refresh:monthly
```

Resultats generes:
- docs/seo/refresh/monthly-refresh-YYYY-MM.md
- docs/seo/refresh/monthly-refresh-YYYY-MM.csv

Option:

```bash
npm run seo:refresh:monthly -- --month=2026-04
```

## Definition du succes J180
- Leadership stable sur clusters routes coeur.
- Avantage CTR et couverture routes maintenu face au principal concurrent.
- Pipeline EN longue trainee productif avec contribution mesurable aux leads.
- Process de refresh mensuel reproduisible sans dependre d'une personne unique.

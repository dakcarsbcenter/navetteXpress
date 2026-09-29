# Charte graphique NavetteXpress — brief pour modèles de devis & factures

Document extrait du code réel (septembre 2026). Sources de vérité :
`src/app/globals.css`, `src/emails/brand.ts`, `src/lib/pdf/` (papeterie partagée des documents),
`src/app/layout.tsx`.

> **Mise à jour** — les deux documents officiels sont désormais implémentés et partagent une
> seule papeterie : `src/lib/pdf/brand.ts` (palette, coordonnées, formatage) et
> `src/lib/pdf/layout.ts` (primitives de blocs). Le devis est composé par
> `src/lib/pdf/quote-pdf.ts`, la facture par `src/lib/invoice-pdf.ts`. Les deux sont
> isomorphes : les routes `GET /api/quotes/[id]/pdf` et `GET /api/invoices/[id]/pdf` les
> rendent en Node et les emails les joignent en pièce jointe.

---

## 1. Identité

**Nom affiché** : `Navette Xpress` (deux mots, dans l'UI et les documents).
`NavetteXpress` en un mot n'apparaît que dans du code/legacy.

**Logo** : il n'existe pas de fichier logo valide à réutiliser.
Le logo réel est composé en markup — à reproduire à l'identique :

- un carré de côté ~40 px, `border-radius: 4px`, fond `#12100E`
- dedans, `NX` en Archivo **Bold**, couleur `#F7F3EC`, centré
- à droite : `Navette Xpress` en Archivo **SemiBold**, `letter-spacing: -0.01em`, couleur texte principale
- sous le wordmark (optionnel) : `DAKAR — AIBD — PETITE CÔTE` en IBM Plex Mono, 10 px, `letter-spacing: 0.2em`, majuscules, couleur `--text-muted`

Version inversée (fond foncé) : carré `#F7F3EC` avec `NX` en `#12100E`, wordmark en `#F7F3EC`.

> ⚠️ Ne pas utiliser `public/logo.svg` : c'est un reste d'ancienne identité (dégradé bleu/violet) qui ne correspond plus à la marque.

---

## 2. Palette

### Couleurs de marque

| Rôle | Nom interne | Hex | Usage |
|---|---|---|---|
| **Accent principal** | Lagune | `#1F5245` | totaux, badges payé, filets, CTA, montants clés |
| Lagune — hover / foncé | | `#19433B` | survol, dégradés |
| Lagune — clair | | `#3D7A67` | variantes légères |
| **Accent secondaire** | Terre | `#B4643A` | statut « en attente », accents chauds, séparateurs |
| Terre — clair | | `#C98761` | |
| Terre — texte | | `#A35A34` | à utiliser dès que la Terre porte du **petit texte** sur fond crème (le `#B4643A` ne fait que 3,93:1) |

### Fonds & surfaces (mode clair — c'est le mode des documents)

| Rôle | Hex |
|---|---|
| Fond de page (crème) | `#F7F3EC` |
| Fond enveloppant / hors-page (email) | `#DCD8D1` |
| Panneau / encart | `#EFE8D8` |
| Bordure | `#E2DACD` (≈ `rgba(18,16,14,0.08)`) |
| Blanc pur | `#FFFFFF` (cartes d'app ; **le PDF reste sur crème**) |

### Texte

| Rôle | Hex | Usage |
|---|---|---|
| Primaire | `#12100E` | titres, valeurs, montants |
| Secondaire | `#3D3A35` | corps de texte |
| Muted | `#6E6A63` | labels, mentions légales, libellés en majuscules |

### États

| État | Hex |
|---|---|
| Succès / Payé | `#22C55E` (documents : préférer la Lagune `#1F5245`) |
| Erreur / Annulé | `#B8493C` |
| Avertissement | `#F39C12` |
| En retard | `#B91C1C` |

**Statuts de facture déjà implémentés** (`src/lib/invoice-pdf.ts`) — à conserver :

**TVA : 18 %** (taux sénégalais), pour les devis comme pour les factures — `DEFAULT_TAX_RATE` dans `src/lib/pdf/brand.ts`. Les factures émises avant ce changement conservent le taux stocké en base.

| Statut | Libellé FR | Fond du badge | Texte |
|---|---|---|---|
| `paid` | Payée | `#1F5245` | blanc |
| `pending` | En attente de paiement | `#B4643A` | blanc |
| `overdue` | En retard | `#B91C1C` | blanc |
| `cancelled` | Annulée | `#6E6A63` | blanc |
| `draft` | Brouillon | `#E2DACD` | `#12100E` |

---

## 3. Typographie

Deux polices seulement, chargées via `next/font/google` :

- **Archivo** — titres et corps de texte. Graisses disponibles : 400, 500, 600, 700.
  Fallback : `system-ui, -apple-system, 'Segoe UI', sans-serif`
- **IBM Plex Mono** — labels, eyebrows, numéros de pièce, mentions techniques. Graisses : 400, 500, 600.
  Fallback : `'Courier New', Courier, monospace`

### Règles d'emploi

- Titres : Archivo 700, `letter-spacing: -0.03em`, `line-height: 1.15`
- Corps : Archivo 400, 15 px, `line-height: 26px`
- **Labels de champ** (« DATE D'ÉMISSION », « PRESTATION », « CLIENT ») : IBM Plex Mono, 11 px, **majuscules**, `letter-spacing: 0.10em → 0.14em`, couleur muted. C'est la signature visuelle de la marque : tout libellé secondaire est en mono, majuscules, espacé.
- **Montants** : Archivo 700 pour le total, Archivo 400 pour les lignes. Alignés à droite.
- Format monétaire : `120 000 FCFA` — espace normale comme séparateur de milliers, devise suffixée en clair. **Ne jamais utiliser l'espace fine insécable** (elle casse les polices standard de jsPDF et produit `25/000 FCFA`).
- **Pas de flèche `→` dans un PDF.** Les polices standard de jsPDF sont encodées en WinAnsi, qui ne contient pas U+2192 : la flèche sort en `!'` et fausse en plus le calcul de largeur du texte, ce qui fait justifier la ligne sur toute la cellule. Les itinéraires utilisent le chevron `»` (`ROUTE_ARROW` dans `src/lib/pdf/brand.ts`). Une vraie flèche imposerait d'embarquer une police.

> Dans un PDF jsPDF sans police embarquée, la correspondance utilisée est : Archivo → `helvetica`, IBM Plex Mono → `courier`.

---

## 4. Formes & espacement

- **Rayons** : 4 px (badges, boutons, carré du logo), 8 px (conteneur), 12 px (encarts / panneaux). Le style de marque est **peu arrondi** — pas de pilules, pas de 24 px.
- **Bordures** : 1 px `#E2DACD`. Filets de séparation : 0,4 pt même couleur.
- **Espacement** : échelle 4 px (4, 8, 12, 16, 20, 24, 28, 36, 40).
- **Marges page A4** : 20 mm à gauche, bord droit du contenu à 190 mm (soit 20 mm à droite).
- **Ombres** : à éviter dans les documents. L'identité repose sur les filets et les fonds teintés, pas sur l'élévation.
- **Bandeau d'accent** : filet horizontal de 4 px en haut du document, `linear-gradient(to right, #1F5245, #19433B, transparent)`. Présent sur tous les emails transactionnels.

---

## 5. Structure de document existante (à respecter)

Le PDF de facture actuel suit cet ordre — le devis doit en être le miroir :

1. **En-tête** — logo NX + wordmark à gauche ; à droite : `FACTURE` (mono, 8 pt, muted), `N° <numéro>` (Archivo bold, 12 pt), puis le badge de statut
2. **Bloc parties** — émetteur / client, chaque champ précédé de son label mono en majuscules
3. **Filet de séparation** pleine largeur
4. **Tableau des prestations** — colonnes `PRESTATION | QTE | PRIX UNIT. | TOTAL HT` (80 / 20 / 35 / 35 mm). En-tête : fond crème `#F7F3EC`, texte `#12100E`, mono 8 pt bold. Lignes : Archivo 9 pt, filet bas 0,2 pt. Thème `plain` — **pas de zébrage, pas de bordures verticales**.
5. **Totaux** alignés à droite — HT et TVA en label muted + valeur foncée, puis **TTC en Lagune `#1F5245`, Archivo bold 13 pt**
6. **Notes** éventuelles (label mono + texte Archivo 9 pt)
7. **Pied de page** — filet, puis `Navette Xpress` centré bold 9 pt, puis en muted 8 pt :
   `www.navettexpress.com  •  contact@navettexpress.com`
   `NINEA: 012269115  •  RCCM: SN DKR 2014 A 5816`

### Coordonnées réelles à utiliser

- Téléphone : `+221 78 465 13 02`
- Email : `contact@navettexpress.com`
- Site : `www.navettexpress.com`
- NINEA : `012269115` · RCCM : `SN DKR 2014 A 5816`
- Moyens de paiement affichés sur le site : **Wave**, **Orange Money**, **virement bancaire**

> ✅ Les données factices (`123 Anywhere St., Any City`, `+123-456-7890`, `Fauget Bank`) ont été supprimées : `COMPANY_INFO` dans `src/lib/pdf/brand.ts` est désormais la seule source, avec les coordonnées réelles. L'adresse postale précise et l'IBAN/RIB restent à fournir (l'encart moyens de paiement n'affiche aujourd'hui que Wave / Orange Money).

---

## 6. Langue

Les documents et emails sont **bilingues FR puis EN** : bloc français d'abord, bloc anglais ensuite en couleur muted (`#6E6A63`), une graisse plus légère. Voir `src/lib/email-i18n.ts`.

---

## 7. Pièges à éviter

1. **`src/styles/design-system.css`** — fichier mort, non importé nulle part. Il décrit une ancienne identité bleu `#1e40af` / bordeaux `#9B1B30` avec la police Plus Jakarta Sans. **À ignorer intégralement.**
2. **`src/emails/brand.ts`** — les clés `gold` / `goldLight` valent en réalité la Lagune (`#1F5245` / `#19433B`). Le nom est trompeur, la valeur est bonne.
3. **`src/emails/InvoiceEmail.tsx`** — contient encore des restes de l'ancienne palette dorée codés en dur (`rgba(201,168,76,...)` sur l'encart des montants) et une couleur de texte pensée pour un fond sombre (`#f3b3b3`) posée sur un fond clair : contraste insuffisant. À corriger dans le nouveau modèle, pas à recopier.
4. Pas de mode sombre pour les devis/factures : ces documents sont **toujours** en clair sur crème `#F7F3EC`.

---

## 8. Résumé en une phrase

Papeterie sobre et chaude : fond crème `#F7F3EC`, texte quasi-noir `#12100E`, un seul accent vert lagune `#1F5245` réservé aux montants et aux statuts, structure en filets fins plutôt qu'en cartes ombrées, Archivo pour tout ce qui se lit et IBM Plex Mono en majuscules espacées pour tout ce qui étiquette.

# Refonte des tableaux de bord — spécification d'implémentation

Dépôt : `dakcarsbcenter/navetteXpress`, branche `main`.
Cible : Next.js 16 / React 19, Tailwind v4, `@phosphor-icons/react`, `next-intl`, Drizzle.

## Ce que contient ce dossier

Les fichiers `.dc.html` sont des **références de design** : des prototypes HTML qui montrent
l'aspect et le comportement attendus. Ce n'est pas du code à copier. Le travail consiste à
recréer ces écrans dans l'environnement existant du dépôt, avec ses composants, ses
conventions et ses libellés traduits.

Fidélité : **haute**. Couleurs, typographie, espacements et états sont définitifs. Les
valeurs ci-dessous font foi ; en cas de doute sur un détail non documenté, ouvrir le
fichier HTML correspondant.

Pour ouvrir un fichier `.dc.html` dans un navigateur, garder `support.js` à côté (et
`doc-page.js` pour le relevé, `android-frame.jsx` pour l'application chauffeur).

---

## Nettoyage préalable

À faire **avant** tout travail de design. 18 fichiers ne sont rendus par aucune page ni
aucun composant. Les laisser en place signifie redessiner quatre fois le même écran.

Vérifier avec `npx knip` ou `ts-prune` sur l'arbre courant, puis supprimer par domaine.

| Fichier | Poids | Note |
|---|---|---|
| `admin/ModernQuotesManagement.tsx` | 115,7 ko | aucun importeur |
| `admin/ModernBookingsManagement.tsx` | 77,2 ko | importe BookingDetailsModal, jamais rendu |
| `admin/ModernPermissionsManagement.tsx` | 64,8 ko | **importé sans être rendu** — voir ci-dessous |
| `admin/BookingsManagement.tsx` | 63,7 ko | génération précédente |
| `admin/ModernReviewsManagement.tsx` | 43,3 ko | génération précédente |
| `admin/VehiclesManagement.tsx` | 37,0 ko | génération précédente |
| `admin/UsersManagement.tsx` | 26,5 ko | génération précédente |
| `admin/BookingsManager.tsx` | 25,4 ko | première génération |
| `admin/VehiclesManager.tsx` | 24,4 ko | première génération |
| `admin/QuotesManagement.tsx` | 23,4 ko | génération précédente |
| `admin/DriversManager.tsx` | 18,9 ko | atteignable seulement via `/admin` |
| `admin/AdminStats.tsx` | 17,5 ko | atteignable seulement via `/admin` |
| `admin/ReviewsManagement.tsx` | 16,6 ko | génération précédente |
| `admin/PermissionsManagement.tsx` | 15,9 ko | génération précédente |
| `admin/AdminOverview.tsx` | 14,6 ko | export par défaut sans importeur |
| `admin/UsersManagementComparison.tsx` | 3,1 ko | page de démo `/admin/users/design-demo` |
| `admin/AdminDashboard.tsx` | 2,3 ko | rendu uniquement par `/admin` |
| `driver/SimpleDriverTest.tsx` | 4,2 ko | composant de test |

Total : ~594 ko de TSX mort.

Trois décisions liées :

1. **Deux entrées admin.** `/admin` rend l'ancien `AdminDashboard` (qui tire `AdminStats`
   et `DriversManager`), `/admin/dashboard` rend la génération actuelle. Faire de `/admin`
   une redirection vers `/admin/dashboard`.
2. **Import fantôme.** `admin/dashboard/page.tsx` importe `ModernPermissionsManagement`
   (64,8 ko) mais rend `PermissionsManagementRedesigned` ligne 185. Supprimer l'import.
3. **`ModernUsersManagement.tsx` (63,8 ko) est vivant** mais mal placé : il est dans
   `admin/` et n'est utilisé que par `client/ClientUsersManagement`. Le déplacer dans
   `components/shared/`. **Ne pas le supprimer.**

Ces valeurs ont été relevées par recherche des imports sur `main`. La recherche a couvert
356 des 372 fichiers de `src/` : confirmer par un passage knip avant suppression.

---

## Tokens

Tout existe déjà dans `src/app/globals.css`. Ne pas créer de nouvelle variable.

```
--craie        #F7F3EC   fond clair, le seul du système
--encre        #12100E   texte principal, sidebar, blocs de contraste
--lagune       #1F5245   accent principal — actions, nav active (client, entreprise, admin)
--lagune-hover #19433B
--lagune-clair #3D7A67
--terre        #B4643A   accent chauffeur, jalons d'arrivée, accents ponctuels
--sable        #E8DCC8   panneaux d'emphase
--bordure      #E2DACD   filets
--filet-clair  #F0EAE0   séparateurs de lignes de tableau
--texte-2      #3d3a35   paragraphes
--texte-muet   #6E6A63   libellés mono, légendes
--brique       #B8493C   erreur, annulation
--vert         #22C55E   pastille "en service" / "en cours" (point uniquement)
```

Règles non négociables :

- **Deux fonds seulement** : craie et encre. Pas de troisième teinte de gris.
- **Rayons** : 4 px sur les cartes et les boutons, 3 px sur les champs et les listes
  internes, 2 px sur les badges. Jamais `rounded-full` sur un badge, jamais `rounded-2xl`.
- **Pas d'ombre.** Aucune. Ni sur les cartes, ni sur les boutons, ni au survol.
- **Pas de dégradé**, pas de glassmorphism, pas de `backdrop-filter`.
- Typographie : `Archivo` (400/500/600/700) pour tout le texte, `IBM Plex Mono`
  (400/500/600) pour les chiffres, heures, kilométrages, références et libellés.
- Les libellés mono sont **en capitales**, `letter-spacing` 0,14 em (0,16 em pour les
  sur-titres, 0,20 em pour les titres de section de sidebar).
- Contraste : `#6E6A63` est interdit sur fond sable (`#E8DCC8`) — 3,97:1. Sur sable,
  utiliser `#3d3a35` ou `#12100E`.
- Cibles tactiles : 44 px minimum, 56 px pour l'action principale d'un écran mobile.

### Le trait du corridor

Motif signature, déjà présent sur le site public. Une ligne horizontale de 1,5 px en encre
reliant des jalons circulaires de 13 px : **départ en lagune, arrivée en terre**, bordure
2 px, fond blanc. Utilisé pour tout trajet et toute progression. Ne pas le remplacer par
une barre de progression classique ou un stepper Material.

---

## Statuts

Source de vérité : les `pgEnum` de `src/schema.ts`. Cinq tons pour cinq domaines.

| Ton | Couleur | Fond | Sens |
|---|---|---|---|
| Attente | `#B4643A` | `rgba(180,100,58,.10)` | une action est due |
| Validé | `#1F5245` | `rgba(31,82,69,.10)` | confirmé, accepté, affecté, payé, résolu |
| En cours | `#1B9E4B` | `rgba(34,197,94,.12)` | se produit maintenant — **seul état animé** |
| Clos | `#6E6A63` | `rgba(110,106,99,.12)` | terminé, expiré, archivé |
| Arrêté | `#B8493C` | `rgba(184,73,60,.10)` | annulé, refusé, en retard |

`booking_status` (8 valeurs, `schema.ts` ligne 6) — le libellé change avec le rôle, la
valeur et la couleur jamais :

| Valeur | Ton | Client | Chauffeur | Admin / entreprise |
|---|---|---|---|---|
| `pending` | Attente | En attente de confirmation | — | À traiter |
| `assigned` | Validé | Chauffeur affecté | Mission reçue | Assignée |
| `approved` | Validé | Prix validé | Prix validé | Prix approuvé |
| `rejected` | Arrêté | Prix refusé | Refusée | Prix refusé |
| `confirmed` | Validé | Confirmée | Confirmée | Confirmée |
| `in_progress` | En cours | Course en cours | En cours | En cours |
| `completed` | Clos | Terminée | Terminée | Terminée |
| `cancelled` | Arrêté | Annulée | Annulée | Annulée |

Autres domaines : `quote_status` (pending Attente, in_progress En cours, sent Attente,
accepted Validé, rejected Arrêté, expired Clos) · `invoice_status` (draft Clos, pending
Attente, paid Validé, cancelled Arrêté, overdue Arrêté) · `report_status` (open Attente,
in_progress En cours, resolved Validé, closed Clos) · `trip_plan_status` (active Validé,
completed Clos, cancelled Arrêté).

### Composant

```tsx
<StatusBadge
  domain="booking"        // booking | quote | invoice | report | tripPlan
  value={booking.status}  // valeur brute de la base
  audience="driver"       // client | driver | admin
  live                    // point pulsant, uniquement sur in_progress
/>
```

Rendu : pastille ronde 5–6 px + libellé mono 9–10 px en capitales, `letter-spacing`
0,12 em, hauteur 24–26 px, `padding` 0 9–10 px, rayon 2 px.

Libellés dans `messages/{fr,en,es}/statuses.json`, une clé par couple domaine/valeur.
Une valeur inconnue rend le ton "Clos" et journalise un avertissement — jamais un gris
silencieux.

### À supprimer

- `driver/MissionStatusBadge.tsx` — déclare 11 clés dont 5 (`nouvelle`, `acceptee`,
  `en_route`, `en_cours`, `terminee`) n'existent dans aucune énumération. Elles ne
  s'affichent jamais.
- `driver/shared/StatusBadge.tsx` — devine la couleur par recherche de sous-chaîne dans le
  libellé traduit. Cassé dès qu'on passe en anglais.
- `client/TripStatusBadge.tsx` — couvre 6 valeurs sur 8 ; `approved` et `rejected`
  tombent sur le gris par défaut, donc le client ne voit pas que son prix a été validé.

Et dans `globals.css` : `--color-mission-*` (10 variables), `--color-trip-*` (8),
`--color-status-*` (16). Remplacées par les cinq tons.

---

## Shell

Un composant, `src/components/shared/DashboardShell.tsx`, pour les quatre espaces.
Remplace `AdminSidebar` (5,8 ko), `ClientSidebar` (9,7 ko), `DriverSidebar` (6,4 ko),
`AdminTopbar` (1,6 ko), `ClientTopbar` (4,0 ko), `DriverTopbar` (3,5 ko) — 31,0 ko.

```tsx
<DashboardShell
  space="Espace chauffeur"        // ligne mono sous le logo, couleur = accent du rôle
  accent="terre"                  // terre pour le chauffeur, lagune pour les 3 autres
  groups={driverNav}              // [{ label, items: [{ href, label, icon, badge }] }]
  title="Tableau de bord"         // titre mono de la barre du haut
  chip={ {tone: "live", label: "En service"} }
>
  {children}
</DashboardShell>
```

### Barre latérale — 248 px, fond encre `#12100E`

- Bloc logo : carré 36 px craie, rayon 3 px, "NX" 15 px poids 700 en encre. À droite,
  "Navette Xpress" 14 px poids 600 en craie, puis la ligne `space` en mono 9 px capitales
  `letter-spacing` 0,18 em, dans l'accent du rôle. Bordure basse `#2e2b27`.
- Bloc identité : carré 40 px bordure `#3a3631` avec les initiales en mono 12 px, nom
  13 px poids 600, sous-ligne mono 9 px en `#9a938a`. Bordure basse `#2e2b27`.
- Navigation : groupes séparés de 22 px. Titre de groupe en mono 9 px capitales
  `letter-spacing` 0,20 em en `#6E6A63`. Entrées de 38–40 px, rayon 3 px, icône Phosphor
  17 px + libellé 13 px. Inactif : `#9a938a`, survol `background: rgba(247,243,236,.05)`
  et texte craie. Actif : `border-left` 2 px dans l'accent, fond `rgba(<accent>,.16–.22)`,
  texte craie poids 600, icône en variante `fill` dans l'accent.
- Compteur d'entrée : mono 9 px dans l'accent, bordure 1 px `rgba(<accent>,.4)`, rayon 2 px.
- Pied : thème / langue côte à côte (36 px, bordure `#3a3631`), puis déconnexion 40 px
  qui passe en `#B8493C` au survol.
- Barre du bas mobile dérivée des **mêmes** `groups` — pas de seconde liste à maintenir.

### Barre du haut

Hauteur ~74 px, fond craie, bordure basse `#E2DACD`, `flex-wrap` autorisé.
À gauche : `title` en mono 11 px poids 600 capitales `letter-spacing` 0,20 em, puis la date
longue et l'heure en mono 10 px `#6E6A63`. À droite : la pastille `chip` (38 px, bordure
`#E2DACD`, fond blanc), la cloche (38 px, point terre 6 px si notification), l'avatar
(38 px, initiales mono 11 px).

### Icônes Phosphor par rôle

- Chauffeur : `SquaresFour`, `CalendarBlank`, `Clock`, `Wrench`, `ChartBar`, `User`
- Client : `SquaresFour`, `CalendarBlank`, `FileText`, `Receipt`, `PencilSimple`, `Star`, `User`
- Entreprise : `ChartBar`, `CalendarPlus`, `CalendarBlank`, `FileText`, `Receipt`, `Users`, `User`
- Admin : `SquaresFour`, `CalendarBlank`, `FileText`, `SteeringWheel`, `Car`, `ListChecks`,
  `MapPin`, `Users`, `LockKey`, `Receipt`, `Star`, `ChartLine`
- Partout : `Bell`, `SignOut`

### Ordre de migration

Chauffeur (déjà dessiné), puis client (structurellement le plus proche), puis entreprise
(qui passe d'une ligne d'onglets à un cadre — c'est celui qui change le plus), puis admin
(12 entrées et un état d'onglet géré par la page).

---

## Comportement élastique

**Aucune media query n'est nécessaire.** Les maquettes sont élastiques par construction, et
c'est volontaire : pas de palier arbitraire.

- Sections à deux colonnes : `repeat(auto-fit, minmax(min(100%, 380px), 1fr))`.
- Bandeaux d'indicateurs : `display: flex; flex-wrap: wrap` avec `flex: 1 1 168px` et
  `min-width: 168px` sur chaque cellule, filet en `border-right`. **Ne pas** utiliser
  `auto-fit` + `gap` coloré ici : le nombre de colonnes calculé ne divise pas le nombre de
  cellules et la zone restante peint le fond du conteneur.
- Cartes à deux volets (exactement deux enfants) : là au contraire, `gap: 1px` +
  `background: #E2DACD` sur le conteneur et fond blanc sur les volets. Le filet devient
  horizontal de lui-même au repli.
- Marges latérales : `clamp(16px, 3vw, 32px)`. Grands titres : `clamp(22px, 2.4vw, 30px)`.
- Barres du haut et en-têtes de section : `flex-wrap: wrap`.

En dessous de ~700 px, la barre latérale de 248 px n'est plus tenable. La réponse n'est pas
de la comprimer : c'est la barre du bas mobile pour le chauffeur (voir
`Chauffeur Mobile.dc.html`, coque Capacitor déjà en place), et un écran mobile à concevoir
pour le client.

---

## Écrans

### Chauffeur — tableau de bord
`docs/redesign/Dashboard Chauffeur.dc.html` → `src/app/driver/dashboard/`

Accent **terre**. De haut en bas : bandeau du corridor (jalons Dakar / AIBD / Mbour / Saly
avec les distances en mono) ; salutation + phrase du jour ; **carte de la course en cours**
(le cœur de l'écran) ; bandeau de 4 indicateurs ; deux colonnes : missions du jour à gauche,
revenus de la semaine (bloc encre) et rapport véhicule à droite.

La carte de course tient tout le cycle de vie, en 6 états, un seul bouton principal à la
fois : Nouvelle → *Accepter la mission* → Acceptée → *Je pars vers le client* → En route →
*Je suis sur place* → Sur place → *Démarrer la course* → En cours → *Clôturer la course* →
Terminée. Le badge de statut et la ligne de compte à rebours suivent l'état. Le même état
se reflète dans la ligne correspondante de la liste des missions du jour.

Volet gauche : trait du corridor avec distance et durée au milieu, adresses de départ et
d'arrivée avec heures en mono, bloc sable de suivi de vol (masquable). Volet droit :
passager, étiquettes (pax, bagages, siège enfant), prix en mono 22 px, bouton principal
48 px en lagune, deux boutons secondaires (Appeler, Itinéraire) en encre sur blanc, lien
souligné de signalement d'incident.

Interrupteur de service (En service / Hors service) dans la barre latérale et dans la barre
du haut ; il pilote `driver_availability`.

### Chauffeur — planning et disponibilités
`docs/redesign/Chauffeur Planning et Disponibilites.dc.html`
→ `src/app/driver/planning/` et `src/app/driver/disponibilites/`

Deux routes distinctes, réunies dans une seule maquette par un basculement.

Planning : navigation de semaine, sept cartes de jour (fond craie et bordure `#E2DACD` si
fermé, fond blanc et bordure encre sinon), puis la liste des courses avec le trait du
corridor sur chaque ligne.

Disponibilités : sept lignes ordonnées lundi → dimanche mais indexées `day_of_week`
0 = dimanche … 6 = samedi, comme en base. Interrupteur par jour, `start_time` et `end_time`
en champs mono, état à droite. Section "Exceptions par date" (`specific_date`) : une
exception prime toujours sur l'horaire hebdomadaire. Bloc sable expliquant que c'est ce
réglage qui produit le refus 409 côté admin.

### Client
`docs/redesign/Dashboard Client.dc.html` → `src/app/client/dashboard/`

Accent **lagune**. Priorité de l'écran : le **bandeau d'approbation de prix**, en sable,
premier élément après le titre. Le workflow existe en base (`priceProposedAt`,
`clientResponse`, `clientResponseAt`, `clientResponseMessage`) et l'API
`POST /api/client/bookings/[id]/respond-price` est écrite, mais
`docs/BOOKING_PRICE_APPROVAL_SYSTEM.md` note que l'intégration au dashboard client reste à
faire. C'est le point le plus rentable de cette refonte.

Accepter → `clientResponse: 'accepted'`, `status: 'confirmed'`, la réservation bascule en
"Confirmée" et le compteur "À venir" augmente. Refuser → `clientResponse: 'rejected'`,
`status` revient à `'pending'`, message de renégociation, la demande reste ouverte. Le
client ne peut répondre qu'une fois par proposition.

Ensuite : carte du prochain trajet (trait du corridor, chauffeur affecté avec appel et
message), bandeau de 4 indicateurs, deux colonnes — réservations à gauche, notation du
dernier trajet (bloc encre, 5 étoiles cliquables, `CreateReviewModal`), devis en cours et
factures téléchargeables à droite.

### Entreprise
`docs/redesign/Dashboard Entreprise.dc.html` → `src/app/entreprise/dashboard/`

Accent **lagune**. Cet espace n'a aujourd'hui **ni barre latérale ni barre du haut** : ses
six onglets sont une ligne horizontale dans `page.tsx`, avec un retour "Mon compte" vers
l'espace client. C'est l'espace qui gagne le plus au passage sur le shell.

Sélecteur de période (jour / semaine / mois / année) qui recalcule les quatre indicateurs,
comme le fait déjà `EntrepriseOverview`. Puis, en colonne large : **planifications
récurrentes** (le vrai levier de cet espace), une carte par plan avec le trait du corridor,
la règle de récurrence en mono, et trois compteurs — occurrences, en attente, passagers.
Les trois cas de `tripPlanRecurrenceEnum` doivent être représentés : `weekly` (avec
`daysOfWeek`), `monthly` (avec `dayOfMonth`), `custom` (avec `customDates`). Sous les plans,
l'activité de l'année en barres (encre, mois courant en terre).

Colonne étroite : bloc encre du relevé du mois avec lien vers le document, prochaines
missions, collaborateurs (`ClientUsersManagement`).

Rappel : `POST /api/entreprise/trip-plans` crée le plan **et** insère toutes les
occurrences en `bookings` avec `status: 'pending'` — d'où les compteurs "en attente".

### Admin
`docs/redesign/Dashboard Admin.dc.html` → `src/app/admin/dashboard/`

Accent **lagune**, 12 entrées de navigation en trois groupes (Exploitation, Référentiel,
Administration).

L'écran est construit autour de la **file d'assignation**, parce que c'est le travail réel.
Volet gauche : la réservation à assigner (trait du corridor, client, prix). Volet droit :
la liste des chauffeurs avec leur état à l'heure de la course.

`PUT /api/admin/bookings/[id]/assign` vérifie `checkDriverAvailability` et renvoie **409
`DRIVER_NOT_AVAILABLE`** si le créneau ne convient pas. Ce refus doit être visible dans
l'interface, avec la raison, à l'endroit où l'admin a cliqué — pas dans un toast qui
disparaît. En cas de succès : `status: 'assigned'`, et notification au chauffeur par email
puis WhatsApp via `sendWithRetry`. La file avance ; quand elle est vide, l'écran le dit.

Puis : bandeau de 5 indicateurs (`/api/admin/overview` fournit tout), tableau des
réservations récentes (client, chauffeur, montant, statut), et en colonne étroite un bloc
encre "ce qui attend une décision", la charge du corridor par segment, les derniers comptes
créés.

### Admin — permissions
`docs/redesign/Admin Permissions.dc.html` → onglet Permissions

Six ressources × deux actions, telles que déclarées dans `api/admin/permissions/route.ts` :
`bookings`, `quotes`, `users`, `vehicles`, `reviews`, `profile` × `read` / `manage`.

Règle : **gérer implique lire**. Activer la gestion active la lecture et l'affiche comme
"Incluse", verrouillée.

Cinq rôles en cartes cliquables avec leur effectif : Administrateur (verrouillé), Manager,
Chauffeur, Client, plus les rôles personnalisés que la table accepte.

**Deux héritages à trancher avant de coder — poser la question, ne pas décider seul :**

1. Le rôle **admin** n'est pas configurable : `hasBookingPermission` (dans
   `api/client/bookings/route.ts`) renvoie `true` avant de consulter la table. L'interface
   doit le dire et verrouiller la colonne, plutôt qu'afficher des cases sans effet.
2. Le rôle **client** passe par le même contournement, commenté "comportement legacy" dans
   le code. Sa ligne dans la matrice est décorative aujourd'hui.
3. Quatre migrations se contredisent sur le **manager** : `manager-read-update-only.sql`,
   `fix-manager-permissions.js`, `fix-manager-permissions-complete.sql`,
   `fix-manager-delete-permissions.sql`. L'état réel dépend de l'ordre d'exécution.

### Relevé mensuel entreprise
`docs/redesign/Releve Mensuel Entreprise.dc.html` → nouveau document

Aujourd'hui `EntrepriseInvoices` télécharge **un PDF par facture**, en boucle sur la
sélection. La page publique promet "un compte, un interlocuteur, une facture par mois,
relevé mensuel détaillé par mission, justificatifs joints". Ce document est ce relevé.

Un document par mois et par convention : en-tête et pied de page répétés à chaque feuille,
bloc "facturé à" (`companyName`, `companyAddress`, `bp`, `ninea`), métadonnées
(`invoiceNumber`, période, `issueDate`, `dueDate`, référence de convention), bandeau de
totaux, **tableau détaillé une ligne par mission** (date, référence, trajet, chauffeur,
passagers, km, montant HT), répartition par prestation, encadré sable des totaux avec
TVA 18 % et échéance, mentions de règlement et interlocuteur.

Format A4 ou Letter selon le destinataire, marge 0,7 in, pagination gérée par le moteur
d'impression. Les montants du relevé et ceux du tableau de bord entreprise doivent être
calculés à partir de la même requête — dans la maquette ils concordent (503 000 HT,
90 540 de TVA, 593 540 TTC, 14 missions, 878 km).

---

## Application chauffeur mobile
`docs/redesign/Chauffeur Mobile.dc.html`

Trois écrans dans la coque Android (Capacitor est déjà configuré : `capacitor.config.ts`,
dossier `android/`). Un seul geste par étape, bouton principal de 58 px en bas d'écran,
en-tête encre, contenu craie.

1. Course en cours — même machine à états que le tableau de bord desktop, trait du corridor
   vertical, appel et itinéraire côte à côte, bouton principal collé en bas.
2. Ma journée — trois compteurs sur en-tête encre, puis la liste des courses.
3. Gains et disponibilités — barres de la semaine, interrupteurs de disponibilité par jour,
   note du mois.

À traiter comme un livrable distinct du responsive : ce ne sont pas les mêmes écrans
comprimés.

---

## Fichiers de ce dossier

| Fichier | Écran |
|---|---|
| `Dashboard Chauffeur.dc.html` | chauffeur, tableau de bord |
| `Chauffeur Planning et Disponibilites.dc.html` | chauffeur, planning + disponibilités |
| `Chauffeur Mobile.dc.html` | application chauffeur, 3 écrans Android |
| `Dashboard Client.dc.html` | client |
| `Dashboard Entreprise.dc.html` | entreprise |
| `Dashboard Admin.dc.html` | admin, vue d'ensemble et file d'assignation |
| `Admin Permissions.dc.html` | admin, permissions |
| `Releve Mensuel Entreprise.dc.html` | document imprimable |
| `Shell Dashboard Partage.dc.html` | le shell, avec les 4 rôles commutables |
| `Systeme de Statuts.dc.html` | référence des statuts |
| `Audit Composants Admin.dc.html` | l'audit du nettoyage préalable |
| `support.js`, `doc-page.js`, `android-frame.jsx` | nécessaires pour ouvrir les fichiers |

## Ce que la refonte remplace

Les tableaux de bord actuels utilisent un vocabulaire visuel sans rapport avec le site
public : cartes en `rounded-2xl`, glassmorphism avec `backdrop-filter`, ombres portées,
dégradés, un accent violet `#6c63ff` résiduel dans `globals.css`, et trois systèmes de
statuts concurrents. Rien de tout cela ne subsiste.

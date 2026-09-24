# Templates WhatsApp (Geskap / Meta)

Source de vérité du **corps** de chaque template WhatsApp. Les corps ne vivent pas dans le
code : ils sont saisis dans la console Geskap puis approuvés par Meta. Ce fichier existe pour
que le texte exact et **l'ordre des variables** restent versionnés avec le code qui les
alimente — `src/lib/whatsapp/templates.ts`.

> **Règle absolue :** l'ordre des `{{n}}` ci-dessous doit correspondre exactement à l'ordre du
> tableau `variables` de la fonction correspondante dans `src/lib/whatsapp/templates.ts`.
> Toute insertion de variable au milieu décale tout le message.

## Principe bilingue

Les messages sont **bilingues dans un seul template** : bloc français, séparateur `———`, bloc
anglais. Ce choix évite de faire approuver par Meta une famille de templates par langue, et il
fonctionne pour les réservations créées par des visiteurs non connectés dont on ne connaît pas
la langue (aucune colonne `locale` n'existe sur `users` ni sur `bookings`).

Le champ `language` envoyé à l'API reste donc `fr` (`src/lib/whatsapp/geskap.ts`) : c'est la
langue **déclarée** du template, pas son contenu.

Les valeurs injectées sont elles aussi bilingues quand c'est un libellé métier (service,
statut de vol, bagages) — voir `src/lib/email-i18n.ts` (`bi()`, `flightStatusBilingual()`,
`luggageBilingual()`).

## Contraintes Meta à respecter

- Une variable **vide fait rejeter tout le message** : `orDash()` remplace toute valeur vide par `—`.
- Une variable **ne peut pas contenir de saut de ligne ni de tabulation** — d'où la liste des
  changements aplatie sur une ligne dans `reservation_modifiee`.
- Un libellé de bouton est limité à **20 caractères** : `Accepter / Accept` (17) et
  `Refuser / Decline` (17) passent.
- Compter **24 à 48 h** d'approbation Meta après soumission. Le code ne suppose jamais qu'un
  template est déjà approuvé : un échec d'envoi part dans la file de retry
  (`src/lib/notification-queue.ts`).

---

## 1a. `reservation_creee` — client, à la création

Fonction : `sendReservationCreeeClient(booking)`

```
Bonjour {{1}}, votre demande de réservation est bien enregistrée.
Nous revenons vers vous rapidement avec le tarif.
———
Hello {{1}}, your booking request has been received.
We will get back to you shortly with the fare.

Service : {{2}}
Départ / Pick-up : {{3}}
Arrivée / Drop-off : {{4}}
Date : {{5}}
Passagers / Passengers : {{6}}
Bagages / Luggage : {{7}}
Vol / Flight : {{8}} — {{9}} ({{10}})
Options : {{11}}
Précisions / Notes : {{12}}
Réf. / Ref. : {{13}}
```

| # | Variable |
|---|---|
| 1 | prénom du client |
| 2 | type de service (bilingue) |
| 3 | adresse de départ |
| 4 | adresse d'arrivée |
| 5 | date et heure (`JJ/MM/AAAA HH:MM`) |
| 6 | nombre de passagers |
| 7 | bagages (bilingue : `2 valises / 2 bags`) |
| 8 | numéro de vol |
| 9 | compagnie aérienne |
| 10 | statut du vol (bilingue) |
| 11 | services additionnels |
| 12 | demandes spéciales |
| 13 | référence (`NX-<id>`) |

---

## 1b. `nouvelle_reservation_admin` — admin, même événement

Fonction : `sendNouvelleReservationAdmin(booking)` → `GESKAP_ADMIN_PHONE`

```
Nouvelle réservation {{1}} à traiter.
———
New booking {{1}} to process.

Client / Customer : {{2}}
Téléphone / Phone : {{3}}
Service : {{4}}
Départ / Pick-up : {{5}}
Arrivée / Drop-off : {{6}}
Date : {{7}}
Passagers / Passengers : {{8}}
Bagages / Luggage : {{9}}
Vol / Flight : {{10}} — {{11}} ({{12}})
Options : {{13}}
Précisions / Notes : {{14}}
```

Variables : `1` référence, `2` nom client, `3` téléphone client, `4` service, `5` départ,
`6` arrivée, `7` date/heure, `8` passagers, `9` bagages, `10` n° de vol, `11` compagnie,
`12` statut du vol, `13` options, `14` précisions.

---

## 2. `chauffeur_assigne` — chauffeur, à l'assignation

Fonction : `sendChauffeurAssigne(booking, driver)`

```
Bonjour {{1}}, une course vous est proposée : {{2}}.
———
Hello {{1}}, a ride has been offered to you: {{2}}.

Client / Customer : {{3}}
Service : {{4}}
Départ / Pick-up : {{5}}
Arrivée / Drop-off : {{6}}
Date : {{7}}
Passagers / Passengers : {{8}}
Bagages / Luggage : {{9}}
Vol / Flight : {{10}} — {{11}} ({{12}})
Options : {{13}}
Précisions / Notes : {{14}}
```

Variables : `1` prénom du chauffeur, `2` référence, `3` nom client, `4` service, `5` départ,
`6` arrivée, `7` date/heure, `8` passagers, `9` bagages, `10` n° de vol, `11` compagnie,
`12` statut du vol, `13` options, `14` précisions.

---

## 3. `confirmation_chauffeur` — chauffeur, boutons Accepter/Refuser

Fonction : `sendConfirmationChauffeur(booking, driver)` — envoyé immédiatement après le n°2.

**C'est le seul template à boutons.** Les réponses arrivent sur
`POST /api/webhooks/geskap` (`src/app/api/webhooks/geskap/route.ts`), qui reconnaît les
racines `refus`/`declin`/`reject` et `accept`/`confirm`/`oui`/`yes` après normalisation
(minuscules, accents retirés). Ne pas renommer un bouton sans vérifier cette liste.

```
Bonjour {{1}}, confirmez-vous cette course ?
———
Hello {{1}}, do you confirm this ride?

Trajet / Route : {{2}}
Date : {{3}}
Réf. / Ref. : {{4}}
```

Boutons (quick reply) :

```
[ Accepter / Accept ]    [ Refuser / Decline ]
```

Variables : `1` prénom du chauffeur, `2` `départ → arrivée`, `3` date/heure, `4` référence.

---

## 4. `reservation_validee` — client, une fois le chauffeur confirmé

Fonction : `sendReservationValidee(booking, driver)`

```
Votre réservation {{1}} est confirmée. Bon voyage !
———
Your booking {{1}} is confirmed. Have a good trip!

Service : {{2}}
Départ / Pick-up : {{3}}
Arrivée / Drop-off : {{4}}
Date : {{5}}
Passagers / Passengers : {{6}}
Bagages / Luggage : {{7}}
Vol / Flight : {{8}} — {{9}} ({{10}})
Options : {{11}}
Précisions / Notes : {{12}}
Chauffeur / Driver : {{13}}
Téléphone / Phone : {{14}}
```

Variables : `1` référence, `2` service, `3` départ, `4` arrivée, `5` date/heure, `6` passagers,
`7` bagages, `8` n° de vol, `9` compagnie, `10` statut du vol, `11` options, `12` précisions,
`13` nom du chauffeur, `14` téléphone du chauffeur.

---

## 5. `rappel_depart` — client, avant le départ (cron)

Fonction : `sendRappelDepart(booking, driver, leadTimeLabel)` — déclenchée par
`/api/cron/whatsapp-reminders`, dédoublonnée via `bookings.whatsapp_reminder_sent_at`.

```
Rappel : votre course part dans {{1}}.
———
Reminder: your ride departs in {{1}}.

Réf. / Ref. : {{2}}
Service : {{3}}
Départ / Pick-up : {{4}}
Arrivée / Drop-off : {{5}}
Passagers / Passengers : {{6}}
Bagages / Luggage : {{7}}
Vol / Flight : {{8}} — {{9}} ({{10}})
Précisions / Notes : {{11}}
Chauffeur / Driver : {{12}}
Téléphone / Phone : {{13}}
```

Variables : `1` délai avant départ, `2` référence, `3` service, `4` départ, `5` arrivée,
`6` passagers, `7` bagages, `8` n° de vol, `9` compagnie, `10` statut du vol, `11` précisions,
`12` nom du chauffeur, `13` téléphone du chauffeur.

`leadTimeLabel` (variable 1) est construit côté cron : le rédiger en bilingue
(ex. `2 heures / 2 hours`) pour rester cohérent avec le reste du message.

---

## 6. `reservation_modifiee` — **nouveau template à soumettre**

Fonction : `sendReservationModifiee(booking, changes, recipient, driver?)` — envoyée au client
et au chauffeur déjà assigné après une correction en back-office (trajet, date, passagers…).

La liste des changements est aplatie sur **une seule ligne** (séparateur ` · `), car Meta
refuse les sauts de ligne à l'intérieur d'une variable.

```
Bonjour {{1}}, votre réservation {{2}} a été modifiée par notre équipe.
———
Hello {{1}}, your booking {{2}} has been updated by our team.

Modifications / Changes :
{{3}}

Départ / Pick-up : {{4}}
Arrivée / Drop-off : {{5}}
Date : {{6}}
```

| # | Variable |
|---|---|
| 1 | prénom du destinataire (client ou chauffeur) |
| 2 | référence (`NX-<id>`) |
| 3 | changements aplatis : `Départ/Pick-up: A → B · Date et heure/Date and time: … → …` |
| 4 | nouvelle adresse de départ |
| 5 | nouvelle adresse d'arrivée |
| 6 | nouvelle date et heure |

Tant que ce template n'est pas approuvé par Meta, l'envoi échoue et part dans la file de
retry : la notification **email** de modification, elle, part normalement.

---

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `GESKAP_API_KEY` | clé d'API (obligatoire, sinon l'envoi lève) |
| `GESKAP_API_BASE_URL` | défaut `https://wa-api.geskap.com` |
| `GESKAP_ADMIN_PHONE` | destinataire de `nouvelle_reservation_admin` |
| `GESKAP_WEBHOOK_SECRET` | signature HMAC-SHA256 du header `x-camairetech-signature` |
| `WHATSAPP_REMINDER_LEAD_MINUTES` | délai du rappel avant départ |

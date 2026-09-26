# Templates WhatsApp (Geskap / Meta)

Source de vérité du **corps** de chaque template WhatsApp. Les corps ne vivent pas dans le
code : ils sont saisis dans la console Geskap puis approuvés par Meta. Ce fichier existe pour
que le texte exact et **l'ordre des variables** restent versionnés avec le code qui les
alimente — `src/lib/whatsapp/templates.ts`.

> **Règle absolue :** l'ordre des `{{n}}` ci-dessous doit correspondre exactement à l'ordre du
> tableau `variables` de la fonction correspondante dans `src/lib/whatsapp/templates.ts`.
> Toute insertion de variable au milieu décale tout le message.

## Nommage des templates (2e génération, septembre 2026)

Un template soumis à Meta **ne peut plus être modifié** : toute réécriture impose un nouveau
nom. D'où le préfixe `2` sur quatre des cinq gabarits. `reservation_modifiee` n'en a pas, sa
première version n'ayant jamais été approuvée.

Les noms ne sont écrits qu'à **un seul endroit** dans le code : la constante
`WHATSAPP_TEMPLATES` de `src/lib/whatsapp/geskap.ts`, typée via `WhatsAppTemplateName`. Un
prochain renommage ne touche que cet objet.

Un sixième gabarit, `2confirmation_chauffeur` (rappel court à boutons envoyé au chauffeur
juste après l'assignation), a été **supprimé** : `2chauffeur_assigne` portant lui-même les
boutons Accepter/Refuser, le chauffeur recevait deux messages et deux jeux de boutons actifs
pour la même course. Le gabarit doit aussi être archivé côté console Geskap.

Les **clés d'idempotence** (`idempotencyKey`) conservent volontairement les libellés de la 1re
génération (`-rappel_depart`, `-reservation_creee_client`…) : les aligner sur les nouveaux noms
ferait repartir des envois déjà effectués pour les réservations en cours.

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

## Pas d'alerte WhatsApp vers l'admin

Les notifications partent toutes du numéro configuré dans Geskap. Ce numéro ne peut pas
s'envoyer un message à lui-même : il n'existe donc **aucun template WhatsApp à destination
de l'admin**. L'admin est prévenu par email (`sendNewBookingRequestEmail` et les autres
envois de `src/lib/resend-mailer.ts`). Ne pas réintroduire de template de type
`nouvelle_reservation_admin`.

## Contraintes Meta à respecter

- Une variable **vide fait rejeter tout le message** : `orDash()` remplace toute valeur vide par `—`.
- Une variable **ne peut pas contenir de saut de ligne ni de tabulation** — d'où la liste des
  changements aplatie sur une ligne dans `reservation_modifiee`.
- Un libellé de bouton est limité à **20 caractères** : `Accepter / Accept` (17) et
  `Refuser / Decline` (17) passent.
- Compter **24 à 48 h** d'approbation Meta après soumission. Le code ne suppose jamais qu'un
  template est déjà approuvé : un échec d'envoi part dans la file de retry
  (`src/lib/notification-queue.ts`).

## Traitement des boutons (webhook)

Deux gabarits portent des quick replies, avec des libellés **délibérément distincts** car le
webhook `POST /api/webhooks/geskap` ne reçoit que le texte du bouton cliqué, sans savoir de
quel template il provient :

| Libellé | Template | Effet |
|---|---|---|
| `Accepter / Accept` | `2chauffeur_assigne` | approuve la course en attente du chauffeur |
| `Refuser / Decline` | `2chauffeur_assigne` | refuse, la course retourne au pool admin |
| `Confirmer / Confirm` | `reservation_modifiee` | journalisé, **aucun changement d'état** |
| `Annuler / Cancel` | `reservation_modifiee` | journalisé, **aucun changement d'état** |

Les racines `confirm`/`annul`/`cancel` sont testées **en premier** et sortent immédiatement :
sans cela, un chauffeur cliquant « Confirmer » sur un avis de modification accepterait à son
insu sa course en attente (`confirm` matchait l'acceptation). Ne pas renommer un bouton sans
mettre à jour `src/app/api/webhooks/geskap/route.ts`.

---

## 1. `2reservation_creee` — client, à la création

Fonction : `sendReservationCreeeClient(booking)`

```
Bonjour {{1}}, nous avons bien reçu votre demande de réservation. Notre équipe la traite et revient vers vous très rapidement. Merci de votre confiance !
———
Hello {{1}}, we have received your reservation request. Our team processes it and gets back to you very quickly. Thank you for your trust!

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
-------
Pour toute question, répondez à ce message. / For any question, simply reply to this message.
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

C'est le **seul gabarit qui garde les trois variables de vol séparées** (`8`, `9`, `10`). Tous
les autres les fusionnent en une seule ligne via `flightLabel()`.

---

## 2. `2chauffeur_assigne` — chauffeur, à l'assignation, boutons Accepter/Refuser

Fonction : `sendChauffeurAssigne(booking, driver)`

```
Bonjour {{1}}, une nouvelle course vous est proposée (réf. {{2}}). Merci de confirmer avant {{3}} via les boutons ci-dessous.
———
Hello {{1}}, a new ride is offered to you (ref. {{2}}). Please confirm before {{3}} using the buttons below.

Service : {{4}}
Client / Customer : {{5}}
Départ / Pick-up : {{6}}
Arrivée / Drop-off : {{7}}
Date : {{8}}
Passagers / Passengers : {{9}}
Bagages / Luggage : {{10}}
Vol / Flight : {{11}}
Options : {{12}}
Précisions / Notes : {{13}}

Merci pour votre réactivité. / Thank you for your quick response.
```

Boutons (quick reply) :

```
[ Accepter / Accept ]    [ Refuser / Decline ]
```

Variables : `1` prénom du chauffeur, `2` référence, `3` échéance de confirmation, `4` service,
`5` client, `6` départ, `7` arrivée, `8` date/heure, `9` passagers, `10` bagages, `11` vol
(fusionné), `12` options, `13` précisions.

- **Variable 3** : horodatage calculé à l'envoi (`maintenant + WHATSAPP_DRIVER_CONFIRM_MINUTES`,
  défaut 30 min). Purement informative — **aucune réattribution automatique** n'est déclenchée
  à son expiration.
- **Variable 5** : sur une réservation pour un tiers, prend la forme
  `<passager> (réservé par <client>)`, le chauffeur devant savoir qui il va chercher.

---

## 3. `2reservation_validee` — client, une fois le chauffeur confirmé

Fonction : `sendReservationValidee(booking, driver)`

```
Bonjour {{1}}, votre réservation {{2}} est confirmée. Voici le récapitulatif de votre course.
———
Hello {{1}}, your booking {{2}} is confirmed. Here is your ride summary.

Service : {{3}}
Départ / Pick-up : {{4}}
Arrivée / Drop-off : {{5}}
Date : {{6}}
Passagers / Passengers : {{7}}
Bagages / Luggage : {{8}}
Vol / Flight : {{9}}
Options : {{10}}
Précisions / Notes : {{11}}
Chauffeur / Driver : {{12}}
Véhicule / Vehicle : {{13}}
Téléphone / Phone : {{14}}

Votre chauffeur vous contactera avant la prise en charge. Bon voyage ! / Your driver will contact you before pick-up. Have a good trip!
```

Variables : `1` prénom du client, `2` référence, `3` service, `4` départ, `5` arrivée,
`6` date/heure, `7` passagers, `8` bagages, `9` vol (fusionné), `10` options, `11` précisions,
`12` nom du chauffeur, `13` véhicule, `14` téléphone du chauffeur.

---

## 4. `2rappel_depart` — client, avant le départ (cron)

Fonction : `sendRappelDepart(booking, driver)` — déclenchée par
`/api/cron/whatsapp-reminders`, dédoublonnée via `bookings.whatsapp_reminder_sent_at`.

```
Bonjour {{1}}, petit rappel : votre course {{2}} est prévue le {{3}}.
———
Hello {{1}}, a quick reminder: your ride {{2}} is scheduled on {{3}}.

Départ / Pick-up : {{4}}
Arrivée / Drop-off : {{5}}
Vol / Flight : {{6}}
Chauffeur / Driver : {{7}}
Véhicule / Vehicle : {{8}}
Téléphone / Phone : {{9}}
Précisions / Notes : {{10}}

En cas d'imprévu, contactez directement votre chauffeur. Bon voyage ! / If anything changes, contact your driver directly. Have a good trip!
```

Variables : `1` prénom du client, `2` référence, `3` date/heure de la course, `4` départ,
`5` arrivée, `6` vol (fusionné), `7` nom du chauffeur, `8` véhicule, `9` téléphone du
chauffeur, `10` précisions.

Ce gabarit annonce **la date de la course** et non le délai restant : `leadTimeLabel` n'est
plus affiché. Le 3e paramètre de `sendRappelDepart` est conservé mais ignoré, des jobs
sérialisés avec trois arguments pouvant encore dormir dans la file de retry.
`WHATSAPP_REMINDER_LEAD_MINUTES` continue de piloter **quand** le rappel part.

---

## 5. `reservation_modifiee` — client + chauffeur, après une correction

Fonction : `sendReservationModifiee(booking, changes, recipient, driver?)` — envoyée au client
et au chauffeur déjà assigné après une correction en back-office (trajet, date, passagers…).

La liste des changements est aplatie sur **une seule ligne** (séparateur ` · `), car Meta
refuse les sauts de ligne à l'intérieur d'une variable.

```
Bonjour {{1}}, votre réservation {{2}} a été modifiée par notre équipe. Voici ce qui change : {{3}}.
———
Hello {{1}}, your booking {{2}} has been updated by our team. Here is what changed: {{3}}.

Départ / Pick-up : {{4}}
Arrivée / Drop-off : {{5}}
Date : {{6}}
Chauffeur / Driver : {{7}}
Véhicule / Vehicle : {{8}}
Téléphone / Phone : {{9}}

Merci de confirmer ces changements avec les boutons ci-dessous. / Please confirm these changes using the buttons below.
```

Boutons (quick reply) :

```
[ Confirmer / Confirm ]    [ Annuler / Cancel]
```

| # | Variable |
|---|---|
| 1 | prénom du destinataire (client ou chauffeur) |
| 2 | référence (`NX-<id>`) |
| 3 | changements aplatis : `Départ/Pick-up: A → B · Date et heure/Date and time: … → …` |
| 4 | nouvelle adresse de départ |
| 5 | nouvelle adresse d'arrivée |
| 6 | nouvelle date et heure |
| 7 | nom du chauffeur assigné |
| 8 | véhicule |
| 9 | téléphone du chauffeur |

Les variables `7`, `8` et `9` sont renseignées **dans les deux versions du message**, client
compris : la fiche chauffeur est donc chargée avant les deux envois dans
`PATCH /api/admin/bookings/[id]`. Sans chauffeur assigné, elles valent `—`.

Les deux boutons ne sont qu'un **accusé de lecture** : ils sont journalisés par le webhook
sans changer l'état de la réservation (cf. « Traitement des boutons » plus haut).

---

## Source de la ligne « Véhicule / Vehicle »

La fiche chauffeur (`users.vehicle_brand`, `vehicle_model`, `vehicle_plate_number`), pas le
véhicule éventuellement rattaché à la course (`bookings.vehicle_id`). Ces trois colonnes sont
déjà chargées à chaque site d'appel, ce qui évite une jointure supplémentaire. Le rendu est
`Toyota Corolla — DK-1234-AB`, dégradé en `—` si rien n'est renseigné (`vehicleLabel()`).

---

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `GESKAP_API_KEY` | clé d'API (obligatoire, sinon l'envoi lève) |
| `GESKAP_API_BASE_URL` | défaut `https://wa-api.geskap.com` |
| `GESKAP_WEBHOOK_SECRET` | signature HMAC-SHA256 du header `x-camairetech-signature` |
| `WHATSAPP_REMINDER_LEAD_MINUTES` | délai du rappel avant départ (défaut 60) |
| `WHATSAPP_DRIVER_CONFIRM_MINUTES` | échéance affichée au chauffeur dans `2chauffeur_assigne` (défaut 30) |

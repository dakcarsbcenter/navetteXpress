# Notifications WhatsApp (Geskap)

Remplace l'ancien service OpenWA/whatsapp-web.js (numéro bloqué par Meta le
2026-08-29, retiré en `9cc10e0`). Geskap est un wrapper HTTP/JSON au-dessus de
l'API Cloud **officielle** de Meta : numéro WhatsApp Business vérifié +
templates pré-approuvés, donc pas de risque de blocage pour usage non
conforme aux CGU de Meta.

## Architecture

- `src/lib/whatsapp/geskap.ts` — client générique (`sendWhatsAppTemplate`),
  normalisation de numéro (`toGeskapPhone`), throttle simple (5 req/s max
  côté Geskap).
- `src/lib/whatsapp/templates.ts` — une fonction par template, construit les
  variables dans le bon ordre et appelle `sendWhatsAppTemplate`.
- `src/lib/notification-queue.ts` — `sendWithRetry('whatsapp', 'whatsapp.xxx', args)`
  réessaie automatiquement en cas d'échec (backoff 1min→12h, 6 tentatives).
  Toujours passer par cette fonction, jamais appeler `templates.ts` en direct
  depuis une route.
- `src/app/api/webhooks/geskap/route.ts` — webhook entrant (statuts de
  livraison + réponses aux boutons Accepter/Refuser).
- `src/app/api/cron/whatsapp-reminders/route.ts` — rappel avant départ,
  déclenché par un cron externe.

## Variables d'environnement

```
GESKAP_API_KEY=sk_live_...
GESKAP_API_BASE_URL=https://api-meta.geskap.com   # optionnel, valeur par défaut
GESKAP_WEBHOOK_SECRET=...
GESKAP_ADMIN_PHONE=+221...
WHATSAPP_REMINDER_LEAD_MINUTES=60                 # optionnel, défaut 60
CRON_SECRET=...                                   # partagé avec /api/ads/expire
```

Sans `GESKAP_API_KEY`, un envoi échoue proprement (mis en file d'attente,
retenté plus tard) — n'empêche jamais le reste de la requête d'aboutir.

## Mapping événement → template

| Événement | Template(s) | Fichier |
|---|---|---|
| Réservation créée | `reservation_creee` (client) + `nouvelle_reservation_admin` (admin) | `src/app/api/bookings/route.ts` |
| Chauffeur assigné | `chauffeur_assigne` + `confirmation_chauffeur` (boutons) | `src/app/api/admin/bookings/[id]/assign/route.ts`, et le PATCH générique `src/app/api/admin/bookings/[id]/route.ts` |
| Chauffeur accepte | `reservation_validee` (client) | `src/lib/booking-driver-response.ts` (partagé par `/response` et le webhook), `src/app/api/driver/bookings/[id]/route.ts`, `src/app/api/admin/bookings/[id]/route.ts` |
| Chauffeur refuse | — (email admin seulement, pas de template dédié) | idem |
| Rappel avant départ | `rappel_depart` | `src/app/api/cron/whatsapp-reminders/route.ts` |

Les 6 templates (corps exact, variables, JSON de soumission Meta) ont été
rédigés séparément — non dupliqués ici, voir l'historique de conversation qui
a produit cette implémentation ou la console Geskap une fois les templates
soumis.

## Champs non structurés

`serviceType`, les options additionnelles et les précisions chauffeur ne sont
**pas** des colonnes de `bookings` : ils sont stockés en texte libre dans
`notes` par `POST /api/bookings` (format `Service: X\nContact: ...\nServices
additionnels: Y\nDemandes spéciales: Z`). `templates.ts` les reparse avec
`parseBookingNotes()` plutôt que d'ajouter une migration pour ce seul besoin
d'affichage. Si ce format de `notes` change un jour, ce parseur doit suivre.

## Idempotence

Clé déterministe `${bookingId}-${eventType}` (ex: `NX-10234` → `10234-chauffeur_assigne`)
envoyée à Geskap en header `Idempotency-Key` et en champ `idempotency_key` du
body — à adapter si la doc Geskap précise un mécanisme différent une fois le
compte créé.

## Webhook entrant — hypothèses à vérifier

Le compte Geskap n'existait pas encore au moment de l'écriture. Deux points
du webhook (`src/app/api/webhooks/geskap/route.ts`) sont des **hypothèses**,
à confirmer dès que la console/doc Geskap est disponible :

- **Nom de l'en-tête de signature** : `x-geskap-signature` (constante
  `SIGNATURE_HEADER` en haut du fichier).
- **Forme du payload** `message.inbound` : on lit `data.from`/`data.phone`
  pour le numéro et `data.button_text`/`data.text` pour le contenu du quick
  reply. À ajuster selon le payload réel une fois testé.

La résolution réservation↔réponse chauffeur se fait par numéro de téléphone
(`findDriverIdByPhone`) + course la plus récente au statut `assigned` pour ce
chauffeur (`findPendingAssignedBooking`), comme demandé dans le brief — pas
besoin d'écho de référence de réservation dans le payload.

## Cron du rappel avant départ

Pas d'infra de queue avec délai dans ce projet : un cron classique suffit au
volume actuel. À programmer sur le VPS (même modèle que
`scripts/setup-backup-cron.sh` / `/api/ads/expire`) :

```bash
*/15 * * * * curl -s -X POST https://<domaine>/api/cron/whatsapp-reminders -H "x-cron-secret: $CRON_SECRET"
```

La colonne `bookings.whatsapp_reminder_sent_at` (migration `0021`) empêche un
double envoi entre deux exécutions du cron.

## Limites connues / dette assumée

- Pas de table de log dédiée pour les statuts de livraison (`message.status`
  du webhook n'est que journalisé en console) — à ajouter si le volume de
  `Notifications en échec` (panel admin, déjà existant pour l'email) le
  justifie côté WhatsApp.
- Le throttle dans `geskap.ts` est un simple espacement minimal entre
  requêtes (250ms), pas une vraie file — suffisant tant que le volume reste
  sous ~500 messages/mois (cf. brief).

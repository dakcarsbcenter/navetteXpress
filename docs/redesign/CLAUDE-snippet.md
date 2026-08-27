# Extrait CLAUDE.md — refonte des tableaux de bord

Ce fichier est référencé par PROMPT.md (session 1). Il donne à Claude Code les règles
transverses à respecter pendant toute la refonte, en plus de ce que dit déjà
`claude/CLAUDE.md` à la racine du dépôt. Ne pas dupliquer : ce qui suit s'ajoute, ne
remplace rien.

## Portée

Cette refonte touche uniquement les tableaux de bord (chauffeur, client, entreprise,
admin) et les documents qui en dépendent (relevé mensuel). Elle ne touche pas :
- le site public (`src/app/[locale]/`) — déjà dans le système Corridor, sert de référence
- l'authentification, les schémas de base, les routes API (sauf le branchement
  respond-price côté client, explicitement demandé section "Client" du README)

## Système visuel — rappels durs

- Deux fonds seulement : `#F7F3EC` (craie) et `#12100E` (encre). Un composant qui
  introduit une troisième teinte de fond est un bug, pas une variante.
- Pas d'ombre, pas de dégradé, pas de `backdrop-filter`, pas de `rounded-full` sur un
  badge. Si le code existant en contient (glassmorphism actuel des dashboards), les
  retirer fait partie de la tâche, pas une extension du scope.
- `@phosphor-icons/react` est la seule librairie d'icônes. Ne jamais réintroduire
  `lucide-react`, même pour une icône isolée qui semble manquer côté Phosphor.
- Une seule famille de police (`Archivo`) pour tout le texte, `IBM Plex Mono` seulement
  pour les données chiffrées, horaires, références et libellés de champ.

## Statuts

Ne jamais coder une couleur de statut en dur dans un composant d'écran. Toujours passer
par `<StatusBadge domain=… value=… audience=… />` une fois qu'il existe (session 1). Un
écran qui a besoin d'un statut que `StatusBadge` ne couvre pas signale un domaine
manquant dans le README — poser la question plutôt qu'ajouter une couleur ad hoc.

## Nommage

Interdiction de créer un fichier `XxxRedesigned.tsx`, `ModernXxx.tsx`, `XxxV2.tsx` ou toute
variante numérotée. C'est exactement le problème que le nettoyage préalable corrige. Un
écran qui change se modifie en place ; l'historique git est la version précédente.

## Traductions

Toute chaîne visible passe par `next-intl` (`messages/{fr,en,es}/…`). Le français est la
langue de référence pour rédiger une clé manquante ; ne pas laisser une chaîne en dur même
temporairement.

## Ce qui n'est pas dans le scope de cette refonte

- Le contenu des migrations SQL contradictoires sur le rôle manager (section "Admin —
  permissions" du README) : à trancher par une décision produit séparée, pas par le code
  de l'écran de permissions.
- La suppression de `ModernUsersManagement.tsx` : il est vivant, seulement mal rangé.
- Toute traduction ou tout contenu du site public.

## Quand s'arrêter et demander

- Avant de coder la colonne "gérer" du rôle admin dans l'écran permissions (verrouillée
  par construction, voir README).
- Avant de choisir un comportement pour le rôle manager tant que les 4 migrations
  contradictoires n'ont pas été relues par un humain.
- Avant d'introduire une dépendance qui n'est pas déjà dans `package.json`.

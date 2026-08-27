# Refonte des tableaux de bord — Navette Xpress

Colle ce prompt dans Claude Code, à la racine du dépôt `navetteXpress`, après avoir
copié le dossier `design_handoff_dashboards/` dans `docs/redesign/`.

Ne colle rien d'autre. Ne colle jamais le contenu des fichiers HTML dans le chat :
Claude Code les lira lui-même, à la demande, et seulement s'il en a besoin.

---

## Prompt à coller (session 1 — fondations)

```
Lis docs/redesign/README.md, puis docs/redesign/CLAUDE-snippet.md.

Contexte : les quatre tableaux de bord (chauffeur, client, entreprise, admin) doivent
passer au système visuel "Corridor" déjà en place sur le site public. Les maquettes de
référence sont des fichiers HTML dans docs/redesign/ — ce sont des références de design,
pas du code à copier. Tu recrées ces écrans en Next.js/React dans le dépôt, avec Tailwind v4
et @phosphor-icons/react comme aujourd'hui.

Cette session ne touche à aucun écran. Trois tâches de fondation, dans cet ordre :

1. Suppression du code mort. La liste exacte est dans README.md, section "Nettoyage
   préalable" : 18 fichiers de src/components/admin/ et src/components/driver/ que rien
   ne rend. Vérifie d'abord avec `npx knip` (ou ts-prune) que la liste est juste sur
   l'arbre actuel, puis supprime en un commit par domaine. Ne touche pas à
   ModernUsersManagement.tsx : il est utilisé par le dashboard client.

2. Composant StatusBadge unique dans src/components/shared/StatusBadge.tsx, selon la
   spécification "Statuts" du README (5 tons, 5 domaines, libellés par rôle dans
   messages/{fr,en,es}/statuses.json). Puis supprime MissionStatusBadge.tsx,
   driver/shared/StatusBadge.tsx et client/TripStatusBadge.tsx et remplace leurs usages.

3. Composant DashboardShell unique dans src/components/shared/DashboardShell.tsx, selon
   la spécification "Shell" du README. Il remplace les 3 sidebars et les 3 topbars.
   Un fichier de configuration de navigation par rôle, à côté des routes.

Ne commence pas les écrans. À la fin, résume ce qui a changé et arrête-toi.
```

---

## Sessions suivantes — un écran par session

Après chaque session, `/clear`. L'ordre est important : chaque écran réutilise le shell
et les statuts de la session 1, donc les suivants sont des différences, pas des refontes.

| Session | Prompt |
|---|---|
| 2 | `Lis docs/redesign/README.md section "Chauffeur — tableau de bord". Implémente cet écran sur DashboardShell dans src/app/driver/dashboard/. Référence visuelle : docs/redesign/Dashboard Chauffeur.dc.html — ouvre-le seulement si une valeur te manque.` |
| 3 | `Lis docs/redesign/README.md section "Chauffeur — planning et disponibilités". Implémente src/app/driver/planning/ et src/app/driver/disponibilites/. Référence : docs/redesign/Chauffeur Planning et Disponibilites.dc.html` |
| 4 | `Lis docs/redesign/README.md section "Client". Implémente src/app/client/dashboard/. Le bandeau d'approbation de prix est la priorité : l'API respond-price existe déjà et n'est pas branchée. Référence : docs/redesign/Dashboard Client.dc.html` |
| 5 | `Lis docs/redesign/README.md section "Entreprise". Implémente src/app/entreprise/dashboard/ sur DashboardShell — cet espace n'a pas de sidebar aujourd'hui. Référence : docs/redesign/Dashboard Entreprise.dc.html` |
| 6 | `Lis docs/redesign/README.md section "Admin". Implémente src/app/admin/dashboard/. La file d'assignation est le cœur de l'écran. Référence : docs/redesign/Dashboard Admin.dc.html` |
| 7 | `Lis docs/redesign/README.md section "Admin — permissions". Référence : docs/redesign/Admin Permissions.dc.html. Lis aussi la section "Deux héritages à trancher" : ne code rien avant de m'avoir posé la question.` |
| 8 | `Lis docs/redesign/README.md section "Relevé mensuel entreprise". Implémente la génération du relevé mensuel consolidé (un document par mois et par convention, pas une facture par course). Référence : docs/redesign/Releve Mensuel Entreprise.dc.html` |

---

## Ce qu'il faut lui interdire

Ajoute ces trois lignes à la fin de n'importe quel prompt si tu le vois déraper :

```
Ne lis pas les fichiers .dc.html en entier sans raison : ce sont 35 ko chacun. Le README
contient les valeurs. Si tu as besoin d'un détail précis, grep la valeur dans le fichier.

Ne crée pas de nouvelle variante d'un composant existant (pas de "Modern...", pas de
"...Redesigned", pas de "...V2"). Modifie le fichier en place.

Ne réintroduis pas lucide-react, ni de nouvelle variable CSS de statut.
```

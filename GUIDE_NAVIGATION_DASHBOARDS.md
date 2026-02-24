# 🎯 Guide Rapide - Navigation des Dashboards

## 🚀 Comment ça marche ?

### Vue d'ensemble

Lorsque vous vous connectez et accédez à votre dashboard, vous voyez :

```
┌─────────────────────────────────────────────────────┐
│  [SIDEBAR]              │   [CONTENU PRINCIPAL]     │
│                         │                           │
│  🏠 Dashboard           │   📊 Statistiques         │
│  📈 Statistiques ←─────┼──→ Graphiques             │
│  👥 Utilisateurs        │   Tableaux                │
│  🚗 Véhicules           │   Données en temps réel   │
│  📅 Réservations        │                           │
│  💰 Devis               │                           │
│  🔐 Permissions         │                           │
│  ⭐ Avis                │                           │
│                         │                           │
│  [DÉCONNEXION]          │                           │
└─────────────────────────────────────────────────────┘
```

### Principe

**Cliquer sur un élément du menu → Change le contenu affiché à droite**

---

## 📱 Dashboard Admin

### Accès
- URL : `/admin/dashboard`
- Rôle requis : `admin` ou `manager`

### Menu de Navigation

| Icône | Section | Description |
|-------|---------|-------------|
| 🏠 | Dashboard | Vue d'accueil avec stats globales |
| 📈 | Statistiques | Analyses détaillées (admin only) |
| 👥 | Utilisateurs | Gestion des comptes |
| 🚗 | Véhicules | Gestion de la flotte |
| 📅 | Réservations | Suivi des courses |
| 💰 | Devis | Gestion des devis |
| 🔐 | Permissions | Contrôle d'accès (admin only) |
| ⭐ | Avis | Modération des avis |

### Exemple d'utilisation

1. **Voir les statistiques globales**
   - Cliquez sur **📈 Statistiques** dans le menu
   - → Affiche les graphiques et analyses

2. **Gérer les utilisateurs**
   - Cliquez sur **👥 Utilisateurs**
   - → Liste complète avec actions (créer, modifier, supprimer)

3. **Retour à l'accueil**
   - Cliquez sur **🏠 Dashboard**
   - → Retour à la vue d'ensemble

---

## 🚗 Dashboard Chauffeur

### Accès
- URL : `/driver/dashboard`
- Rôle requis : `driver`

### Menu de Navigation

| Icône | Section | Description |
|-------|---------|-------------|
| 🏠 | Dashboard | Réservations assignées |
| 📅 | Planning | Planning de la semaine |
| 🔧 | Véhicule | Signaler un problème |
| 📊 | Statistiques | Vos performances |
| 👤 | Profil | Paramètres du compte |

### Exemple d'utilisation

1. **Consulter votre planning**
   - Cliquez sur **📅 Planning**
   - → Calendrier hebdomadaire avec vos courses

2. **Voir vos statistiques**
   - Cliquez sur **📊 Statistiques**
   - → Revenus, nombre de courses, évaluations

3. **Signaler un problème de véhicule**
   - Cliquez sur **🔧 Véhicule**
   - → Formulaire de signalement

---

## 👤 Dashboard Client

### Accès
- URL : `/client/dashboard`
- Rôle requis : `customer`

### Menu de Navigation

| Icône | Section | Description |
|-------|---------|-------------|
| 📊 | Vue d'ensemble | Statistiques personnelles |
| 📅 | Mes réservations | Historique des courses |
| 📋 | Mes devis | Demandes de devis |
| ⭐ | Évaluer trajets | Laisser un avis |
| ✅ | Mes avis | Avis publiés |
| 👤 | Mon profil | Informations personnelles |

*Note : Les sections Véhicules et Utilisateurs apparaissent si vous avez les permissions nécessaires*

### Exemple d'utilisation

1. **Voir vos réservations**
   - Cliquez sur **📅 Mes réservations**
   - → Liste de toutes vos courses (passées et à venir)

2. **Laisser un avis**
   - Cliquez sur **⭐ Évaluer trajets**
   - → Formulaire pour noter vos courses terminées

3. **Consulter vos statistiques**
   - Cliquez sur **📊 Vue d'ensemble**
   - → Total courses, dépenses, note moyenne

---

## 💡 Astuces

### Desktop 🖥️

- **Sidebar toujours visible** : Pas besoin d'ouvrir/fermer le menu
- **Hover sur les icônes** : Affiche le nom complet si sidebar réduite
- **Indicateur visuel** : Un point animé montre la section active
- **Raccourcis** : Section utilisateur en bas avec déconnexion rapide

### Mobile 📱

- **Menu hamburger** : Cliquez sur ☰ en haut à droite
- **Liste déroulante** : Toutes les sections disponibles
- **Fermeture auto** : Le menu se ferme après sélection
- **Badge rôle** : Visible en haut (ADMIN/DRIVER/CLIENT)

---

## 🎨 Comprendre les Indicateurs Visuels

### Section Active

**Desktop :**
```
╔═══════════════════════════════╗
║ 📊 Statistiques ●            ║ ← Gradient bleu + point animé
╚═══════════════════════════════╝
```

**Mobile :**
```
╔═══════════════════════════════╗
║ 📊 Statistiques              ║ ← Fond bleu + texte blanc
╚═══════════════════════════════╝
```

### Section Inactive

**Desktop :**
```
┌───────────────────────────────┐
│ 👥 Utilisateurs              │ ← Texte gris + fond transparent
└───────────────────────────────┘
```

### Hover (survol)

**Desktop :**
```
╔═══════════════════════════════╗
║ 👥 Utilisateurs              ║ ← Fond légèrement coloré
╚═══════════════════════════════╝
```

---

## 🔒 Permissions et Accès

### Sections Réservées Admin

Certaines sections ne sont visibles que pour les administrateurs :

- 📈 **Statistiques globales** : Analyses de toute la plateforme
- 🔐 **Permissions** : Gestion des droits d'accès
- (autres sections selon configuration)

### Filtrage Dynamique

Le menu s'adapte automatiquement à vos permissions :
- Si vous n'avez pas la permission → Section invisible
- Si permission lecture seule → Actions limitées
- Si permission complète → Toutes les actions disponibles

---

## ❓ Dépannage

### Le menu ne change pas le contenu ?

1. **Vérifiez** que vous avez bien cliqué sur un élément du menu
2. **Regardez** l'indicateur visuel (fond bleu = section active)
3. **Rafraîchissez** la page si nécessaire (F5)

### Une section n'apparaît pas ?

1. **Vérifiez** votre rôle utilisateur
2. **Contactez** un administrateur si vous pensez devoir y avoir accès
3. **Certaines sections** sont réservées aux admins uniquement

### Le menu mobile ne s'ouvre pas ?

1. **Cliquez** sur l'icône hamburger (☰) en haut à droite
2. **Vérifiez** que JavaScript est activé dans votre navigateur
3. **Essayez** de rafraîchir la page

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que vous êtes bien connecté
2. Essayez de vous déconnecter/reconnecter
3. Contactez le support technique avec une capture d'écran

---

**Navigation simplifiée, intuitive et performante ! 🚀**

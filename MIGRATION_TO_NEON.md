# 🚀 Guide de Migration vers Neon

## Étapes de Migration

### 📋 Étape 1: Pousser le schéma vers Neon

Assurez-vous que le `.env.local` utilise l'URL Neon:

```bash
DATABASE_URL='postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

Puis exécutez:

```powershell
npm run db:push
```

Cela va créer toutes les tables dans Neon selon le schéma défini dans `src/schema.ts`.

### 📊 Étape 2: Copier les données

Une fois que le schéma est créé dans Neon, copiez les données:

```powershell
node scripts/copy-data-to-neon.mjs
```

Ce script va:
1. Se connecter à la base source (locale)
2. Se connecter à Neon
3. Pour chaque table:
   - Compter les lignes source
   - Vider la table destination
   - Copier toutes les données
4. Afficher un résumé

### ✅ Étape 3: Vérification

Vérifiez que les données ont bien été copiées:

```powershell
node scripts/test-invoices-api.mjs
```

### 🔄 Étape 4: Mettre à jour .env.local

Commentez l'ancienne URL et utilisez Neon:

```bash
# DATABASE_URL='postgres://postgres:...'  # ← Commenté
DATABASE_URL='postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

### 🚀 Étape 5: Redémarrer l'application

```powershell
# Arrêter le serveur (Ctrl+C)
npm run dev
```

## 📝 Tables qui seront migrées

1. `users` - Utilisateurs
2. `profiles` - Profils utilisateurs
3. `vehicles` - Véhicules
4. `quotes` - Devis
5. `bookings` - Réservations
6. `invoices` - Factures ⭐
7. `reviews` - Avis
8. `permissions` - Permissions
9. `role_permissions` - Permissions par rôle

## ⚠️ Important

- Les données existantes dans Neon seront **écrasées** (TRUNCATE)
- L'ordre des tables est important (contraintes de clés étrangères)
- La migration prend environ 1-2 minutes selon la taille des données

## 🆘 En cas de problème

### Erreur de connexion à Neon
```bash
# Vérifiez que l'URL est correcte dans .env.local
# Vérifiez votre connexion internet
```

### Tables non créées
```bash
# Re-pousser le schéma
npm run db:push
```

### Données non copiées
```bash
# Relancer la copie
node scripts/copy-data-to-neon.mjs
```

## 🎯 Commandes Rapides

```powershell
# Migration complète en 3 commandes
npm run db:push                      # 1. Créer le schéma
node scripts/copy-data-to-neon.mjs  # 2. Copier les données
npm run dev                          # 3. Redémarrer l'app
```

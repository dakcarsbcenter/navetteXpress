# 🔐 Guide d'Assignation du Rôle Administrateur

## Vue d'ensemble

Ce guide vous explique comment assigner le rôle administrateur dans votre application Premium Chauffeur. Plusieurs méthodes sont disponibles selon votre situation.

## 🎯 Méthodes disponibles

### 1. Interface Web (Recommandée)

**La plus simple** - Utilisez l'interface dédiée :

1. **Démarrer votre serveur** :
   ```bash
   npm run dev
   ```

2. **Accéder à la page d'initialisation** :
   ```
   http://localhost:3000/init-admin
   ```

3. **Obtenir l'ID Clerk** :
   - Allez sur [Dashboard Clerk](https://dashboard.clerk.dev)
   - Cliquez sur "Users"  
   - Sélectionnez l'utilisateur souhaité
   - Copiez son "User ID" (commence par `user_`)

4. **Assigner le rôle** :
   - Collez l'ID dans l'interface
   - Cliquez sur "Assigner le rôle admin"

### 2. Script Interactif

**Pratique** - Utilisez le script fourni :

```bash
# Avec ID utilisateur
node scripts/assign-admin.js user_2abc123def456

# Ou interactif
node scripts/assign-admin.js
```

### 3. Commande cURL

**Direct** - Appelez l'API directement :

```bash
curl -X POST http://localhost:3000/api/init-admin \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId":"user_2abc123def456"}'
```

### 4. Base de données directe

**Avancé** - Requête SQL directe :

```sql
INSERT INTO user_roles (clerk_user_id, role, created_at, updated_at) 
VALUES ('user_2abc123def456', 'admin', NOW(), NOW());
```

## 🔒 Sécurité

### Développement vs Production

- **Développement** : La route `/api/init-admin` est ouverte
- **Production** : La route vérifie qu'aucun admin n'existe déjà

### Une fois le premier admin créé

Utilisez l'interface administrative pour assigner d'autres rôles :

1. Connectez-vous avec le compte admin
2. Allez sur `/admin`
3. Onglet "Utilisateurs" 
4. "+ Assigner un Rôle"

## 🎛️ Rôles disponibles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **admin** | Administrateur | Accès complet au système |
| **manager** | Gestionnaire | Gestion chauffeurs/véhicules |
| **driver** | Chauffeur | Dashboard personnel uniquement |

## ✅ Vérification

### Tester l'accès admin :

1. **Connectez-vous** avec le compte admin
2. **Accédez à** `/admin`
3. **Vérifiez** que vous voyez le dashboard administrateur

### Via l'API :
```bash
curl -X GET http://localhost:3000/api/init-admin
```

Réponse attendue :
```json
{
  "success": true,
  "data": {
    "adminCount": 1,
    "hasAdmins": true,
    "isProduction": false
  }
}
```

## 🚨 Dépannage

### Erreurs communes

**"Format d'ID Clerk invalide"**
- L'ID doit commencer par `user_`
- Vérifiez dans le dashboard Clerk

**"Des administrateurs existent déjà"** (Production)
- Utilisez `/admin` avec un compte admin existant
- Ou utilisez `/init-admin` dans le navigateur

**"Erreur réseau"**
- Vérifiez que le serveur est démarré (`npm run dev`)
- Vérifiez l'URL (http://localhost:3000)

### Réinitialisation complète

Si vous devez tout réinitialiser :

```sql
DELETE FROM user_roles WHERE role = 'admin';
```

Puis recommencez l'assignation.

## 🎉 Prêt !

Une fois l'admin assigné :

- ✅ Accès à `/admin`
- ✅ Gestion complète des chauffeurs
- ✅ Gestion complète des véhicules  
- ✅ Gestion complète des réservations
- ✅ Assignation d'autres rôles utilisateurs

---

**💡 Conseil** : Gardez précieusement l'ID de votre compte admin principal et créez un admin de sauvegarde.









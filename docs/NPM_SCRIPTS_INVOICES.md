# 📝 Commandes NPM à ajouter au package.json

Ajoutez ces lignes à la section `"scripts"` de votre `package.json` :

```json
{
  "scripts": {
    // ... scripts existants ...
    
    // 🆕 Nouvelles commandes pour le système de facturation
    "invoice:migrate": "tsx scripts/add-invoices-migration.ts",
    "invoice:test": "tsx scripts/test-invoice-system.ts"
  }
}
```

## Utilisation

### Exécuter la migration
```bash
npm run invoice:migrate
```

### Tester le système de facturation
```bash
npm run invoice:test
```

## Commandes Alternatives (sans modification du package.json)

Si vous ne voulez pas modifier le package.json, utilisez directement :

```bash
# Migration
npx tsx scripts/add-invoices-migration.ts

# Tests
npx tsx scripts/test-invoice-system.ts
```

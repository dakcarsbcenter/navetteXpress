# 🚀 Démarrage Rapide - 3 Commandes

## Installation Complète en 3 Étapes

### 1️⃣ Installer la Table Factures
```bash
npx tsx scripts/add-invoices-migration.ts
```
✅ Crée la table `invoices` dans la base de données

---

### 2️⃣ Tester le Système
```bash
npx tsx scripts/test-invoice-system.ts
```
✅ Vérifie que tout fonctionne correctement

---

### 3️⃣ C'est Prêt ! 🎉
Le système est maintenant opérationnel.

**Pour tester en live :**
1. Connectez-vous en tant que client
2. Acceptez un devis existant (statut "Envoyé")
3. Une facture sera automatiquement générée ! ✨

---

## 📖 Voir Plus

- **Guide complet** : Ouvrir `INVOICE_SYSTEM_IMPLEMENTATION.md`
- **Guide rapide** : Ouvrir `INVOICE_QUICKSTART.md`
- **Exemples API** : Ouvrir `API_INVOICES_EXAMPLES.md`
- **Résumé** : Ouvrir `INVOICE_SUMMARY.md`

---

## 💡 Commandes Utiles

```bash
# Voir toutes les factures (via PostgreSQL)
psql -d votre_database -c "SELECT * FROM invoices;"

# Compter les factures
psql -d votre_database -c "SELECT status, COUNT(*) FROM invoices GROUP BY status;"

# Voir la dernière facture
psql -d votre_database -c "SELECT * FROM invoices ORDER BY id DESC LIMIT 1;"
```

---

**C'est tout ! Le système est prêt à l'emploi. 🎊**

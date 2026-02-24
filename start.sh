#!/bin/bash
# Script de démarrage pour l'application Next.js avec migrations

echo "🚀 Démarrage de Navette Xpress..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
until pg_isready -h postgres -p 5432 -U navettexpress_user; do
  echo "Base de données non disponible, attente..."
  sleep 2
done

echo "✅ Base de données prête!"

# Appliquer les migrations
echo "🔄 Application des migrations..."
npm run db:migrate

# Démarrer l'application
echo "🚀 Démarrage de l'application Next.js..."
exec npm start
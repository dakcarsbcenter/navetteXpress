# Utiliser l'image officielle Node.js 20 Alpine (compatible avec @neondatabase/serverless)
FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour les builds natifs
# bash est requis par start.sh (set -o pipefail, absent de sh/ash Alpine)
RUN apk add --no-cache libc6-compat postgresql-client bash

# Étape de dépendances
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Étape de dépendances de production uniquement
# Le tracing automatique de Next.js standalone n'inclut pas toujours "postgres"
# (imports conditionnels selon le runtime), nécessaire au script de migration
# exécuté hors du bundle tracé. On installe donc les deps de prod à part.
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Étape de build
FROM base AS builder
WORKDIR /app

# Copier les dépendances depuis l'étape précédente
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables dummy pour le build (remplacées au runtime par .env.docker)
# Ces valeurs ne sont utilisées QUE pendant la phase de build
# Les vraies valeurs sécurisées sont injectées au runtime via env_file (.env.docker)
ARG NEXTAUTH_SECRET="build-time-dummy-secret-will-be-replaced-at-runtime"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG GOOGLE_CLIENT_ID="dummy"
ARG GOOGLE_CLIENT_SECRET="dummy"

ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV DATABASE_URL=$DATABASE_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Variables NEXT_PUBLIC_* : contrairement aux variables ci-dessus, celles-ci sont
# figées dans le bundle JS cote client PENDANT ce `npm run build` et ne peuvent
# plus être changées au runtime via env_file. Il FAUT donc les fournir comme
# build-args (voir docker-compose.yml) et non uniquement dans .env.docker.
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""

ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

# Build de l'application Next.js en mode standalone
RUN npm run build

# Étape de production
FROM base AS runner
WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers publics
COPY --from=builder /app/public ./public

# Copier les fichiers de build Next.js standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier le script de démarrage et le rendre exécutable
COPY --chown=nextjs:nodejs start.sh ./
RUN chmod +x start.sh

# Copier les fichiers de migration pour Drizzle
COPY --chown=nextjs:nodejs migrations ./migrations
RUN mkdir -p scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-migrations.mjs ./scripts/run-migrations.mjs

# Compléter le node_modules élagué du build standalone avec les deps de prod
# complètes (garantit la présence de "postgres" pour run-migrations.mjs)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Changer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Vérification de santé HTTP de l'application
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

# Commande de démarrage
CMD ["./start.sh"]
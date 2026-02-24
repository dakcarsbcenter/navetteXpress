# Utiliser l'image officielle Node.js 20 Alpine (compatible avec @neondatabase/serverless)
FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour les builds natifs
RUN apk add --no-cache libc6-compat postgresql-client

# Étape de dépendances
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
RUN npm ci

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

# Variables dummy pour le build (seront remplacées au runtime par Coolify)
# Ces valeurs ne sont utilisées QUE pendant la phase de build
# Les vraies valeurs sécurisées seront injectées par Coolify au runtime
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
COPY --chown=nextjs:nodejs drizzle.config.ts ./
COPY --chown=nextjs:nodejs package.json ./

# Installer drizzle-kit pour les migrations
RUN npm install drizzle-kit

# Changer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande de démarrage
CMD ["./start.sh"]
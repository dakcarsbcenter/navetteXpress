import { NextRequest, NextFetchEvent, NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { isBlacklisted, addToBlacklist } from "./lib/security/blacklist"
import { consumeRateLimit } from "./lib/security/rateLimiter"
import { isVerifiedSearchEngineBot } from "./lib/security/searchEngineBots"
import { logSecurityEvent } from "./lib/security/logger"
import { getClientIp } from "./lib/security/ip"

// Next.js only allows a single proxy/middleware file, so the pre-existing
// role-based auth guard (dashboard/admin/driver/client) and the next-intl
// locale routing (public marketing pages) are combined here and dispatched
// by path prefix instead of running as two separate files.

const HONEYPOT_PATH = "/api/internal-catalog"

const SUSPICIOUS_UA_PATTERNS = ["headlesschrome", "puppeteer", "playwright"]

// Seuils volontairement larges : de nombreux clients mobiles partagent la même
// IP publique (CGNAT des opérateurs), un seuil bas bloquerait tout un quartier.
// La protection serrée est portée par SENSITIVE_RATE_LIMIT (voir plus bas).
const API_RATE_LIMIT = { limit: 120, windowMs: 60_000 }
const PAGE_RATE_LIMIT = { limit: 300, windowMs: 60_000 }

// Endpoints sensibles (tentatives de connexion, création de compte, e-mails
// transactionnels) : compteur séparé et strict, en POST uniquement.
const SENSITIVE_RATE_LIMIT = { limit: 10, windowMs: 60_000 }
const SENSITIVE_POST_PATHS = [
  "/api/auth/callback/credentials",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/resend-verification",
]

// Hors compteur général : appelés très souvent par le client (session NextAuth,
// flux temps réel), ou venant d'IP de prestataires partagées (webhooks, cron).
// Ils portent leur propre contrôle (session, signature, secret).
const RATE_LIMIT_EXEMPT_PREFIXES = ["/api/auth/", "/api/health", "/api/webhooks/", "/api/cron/"]
const RATE_LIMIT_EXEMPT_PATTERNS = [/^\/api\/conversations\/[^/]+\/stream/]

function isRateLimitExempt(pathname: string) {
  return (
    RATE_LIMIT_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    RATE_LIMIT_EXEMPT_PATTERNS.some((pattern) => pattern.test(pathname))
  )
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Blacklist, honeypot, rate limiting et logs d'anomalie — appliqué à toute
 * requête matchée par `config.matcher` avant la logique auth/i18n existante.
 * Ne bloque jamais silencieusement (toujours un 403/429 explicite) et ne
 * touche pas au parcours de réservation (aucune vérification supplémentaire
 * sur les soumissions de formulaire elles-mêmes).
 */
async function runSecurityChecks(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl
  const ip = getClientIp(req)
  const userAgent = req.headers.get("user-agent") || ""

  if (isBlacklisted(ip)) {
    logSecurityEvent("ip_blacklisted_blocked", { ip, path: pathname })
    return forbidden("Accès temporairement bloqué.")
  }

  if (pathname === HONEYPOT_PATH) {
    addToBlacklist(ip)
    logSecurityEvent("honeypot_hit", { ip, path: pathname, userAgent })
    return forbidden("Accès refusé.")
  }

  // Simple journalisation, jamais de blocage automatique sur le seul UA
  // (trop de faux positifs) : sert de piste pour un examen manuel régulier.
  const lowerUa = userAgent.toLowerCase()
  if (SUSPICIOUS_UA_PATTERNS.some((pattern) => lowerUa.includes(pattern))) {
    logSecurityEvent("suspicious_user_agent", { ip, path: pathname, userAgent })
  }

  // Sans IP identifiable, un seul compteur serait partagé par tous les clients :
  // on journalise et on laisse passer plutôt que de bloquer des inconnus en bloc.
  if (ip === "unknown") {
    logSecurityEvent("unknown_client_ip", { path: pathname, userAgent })
    return null
  }

  const isSensitive =
    req.method === "POST" && SENSITIVE_POST_PATHS.some((path) => pathname.startsWith(path))
  if (!isSensitive && isRateLimitExempt(pathname)) return null

  const isApiRoute = pathname.startsWith("/api/")
  const { limit, windowMs } = isSensitive
    ? SENSITIVE_RATE_LIMIT
    : isApiRoute
      ? API_RATE_LIMIT
      : PAGE_RATE_LIMIT
  const rateLimitKey = `${isSensitive ? "sensitive" : isApiRoute ? "api" : "page"}:${ip}`
  const result = consumeRateLimit(rateLimitKey, limit, windowMs)

  if (!result.allowed) {
    // Les vrais Googlebot/Bingbot (vérifiés par reverse DNS) ne sont jamais
    // limités — la vérification DNS n'est faite qu'à ce moment précis (pas
    // sur chaque requête) pour ne pas ajouter de latence inutile.
    if (await isVerifiedSearchEngineBot(ip, userAgent)) {
      logSecurityEvent("search_engine_bot_exempted", { ip, path: pathname, userAgent })
      return null
    }

    logSecurityEvent("rate_limit_exceeded", { ip, path: pathname, userAgent, limit, windowMs })
    return NextResponse.json(
      { error: "Trop de requêtes. Merci de réessayer dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
    )
  }

  return null
}

// Correspondance par segment : `/entreprise` ne doit pas capturer la page
// publique `/entreprises`.
function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

const AUTH_PREFIXES = ['/dashboard', '/admin', '/driver', '/client', '/entreprise', '/my-quotes']

const authProtected = withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirection basée sur le rôle après connexion
    if (pathname === '/dashboard') {
      if (token?.role === 'admin' || token?.role === 'manager') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (token?.role === 'driver') {
        return NextResponse.redirect(new URL('/driver/dashboard', req.url))
      } else if (token?.role === 'customer') {
        return NextResponse.redirect(new URL('/client/dashboard', req.url))
      }
    }

    // Protection des routes admin - admins et managers peuvent y accéder
    if (pathname.startsWith('/admin') && token?.role !== 'admin' && token?.role !== 'manager') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protection des routes driver - seuls les chauffeurs peuvent y accéder
    if (pathname.startsWith('/driver') && token?.role !== 'driver') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protection des routes client - seuls les clients peuvent y accéder
    if (pathname.startsWith('/client') && token?.role !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Espace entreprise : compte client uniquement. Le statut `isCompany`
    // n'est pas dans le JWT, la page le vérifie elle-même.
    if (isUnder(pathname, '/entreprise') && token?.role !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Toute route listée dans AUTH_PREFIXES exige une session.
        if (AUTH_PREFIXES.some((prefix) => isUnder(req.nextUrl.pathname, prefix))) {
          return !!token
        }
        return true
      },
    },
  }
)

const intlMiddleware = createMiddleware(routing)

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl

  const securityResponse = await runSecurityChecks(req)
  if (securityResponse) return securityResponse

  // Les routes API gèrent leur propre auth par requête (getServerSession) et
  // n'ont pas besoin du rewrite de locale next-intl : une fois les contrôles
  // anti-scraping passés, on les laisse simplement continuer.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (AUTH_PREFIXES.some((prefix) => isUnder(pathname, prefix))) {
    return (authProtected as unknown as (req: NextRequest, event: NextFetchEvent) => ReturnType<typeof NextResponse.next>)(req, event)
  }

  return intlMiddleware(req)
}

// IMPORTANT: only add a route prefix here once its page actually exists
// under src/app/[locale]/... — the matcher below intercepts and rewrites
// matching requests to the locale segment, so listing a route before it has
// been migrated results in a 404. Grow this list incrementally as each
// Phase 1 page is moved.
export const config = {
  // Le rate limiting/honeypot s'appuie sur `dns` (Node) et sur des compteurs
  // en mémoire qui doivent survivre entre requêtes : le runtime Edge ne
  // convient pas. Le déploiement est un conteneur Docker autonome sur le
  // VPS (next start), pas Vercel Edge. Pas besoin de le préciser ici : dans
  // Next.js 16, proxy.ts tourne toujours en runtime Node (voir l'erreur de
  // build "Route segment config is not allowed in Proxy file" si on le remet).
  matcher: [
    // Anti-scraping (rate limit + honeypot + blacklist) sur toutes les
    // routes API — celles-ci ne sont pas listées plus bas car elles ne
    // passent jamais par le rewrite de locale next-intl.
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/driver/:path*',
    '/client/:path*',
    '/entreprise/:path*',
    '/my-quotes/:path*',
    '/',
    '/(fr|en|es)',
    '/flotte/:path*',
    '/(fr|en|es)/flotte/:path*',
    '/contact/:path*',
    '/(fr|en|es)/contact/:path*',
    '/faq/:path*',
    '/(fr|en|es)/faq/:path*',
    '/tarifs/:path*',
    '/(fr|en|es)/tarifs/:path*',
    '/services/:path*',
    '/(fr|en|es)/services/:path*',
    '/routes/:path*',
    '/(fr|en|es)/routes/:path*',
    '/zones/:path*',
    '/(fr|en|es)/zones/:path*',
    '/entreprises/:path*',
    '/(fr|en|es)/entreprises/:path*',
    '/diaspora/:path*',
    '/(fr|en|es)/diaspora/:path*',
    '/devenir-partenaire/:path*',
    '/(fr|en|es)/devenir-partenaire/:path*',
    '/reservation/:path*',
    '/(fr|en|es)/reservation/:path*',
    '/quote-request/:path*',
    '/(fr|en|es)/quote-request/:path*',
    '/auth/:path*',
    '/(fr|en|es)/auth/:path*',
    '/cgv',
    '/(fr|en|es)/cgv',
    '/mentions-legales',
    '/(fr|en|es)/mentions-legales',
    '/confidentialite',
    '/(fr|en|es)/confidentialite',
  ],
}

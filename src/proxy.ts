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

const API_RATE_LIMIT = { limit: 30, windowMs: 60_000 }
const PAGE_RATE_LIMIT = { limit: 100, windowMs: 60_000 }

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

  const isApiRoute = pathname.startsWith("/api/")
  const { limit, windowMs } = isApiRoute ? API_RATE_LIMIT : PAGE_RATE_LIMIT
  const rateLimitKey = `${isApiRoute ? "api" : "page"}:${ip}`
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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard, admin, driver and client routes
        if (req.nextUrl.pathname.startsWith('/dashboard') ||
          req.nextUrl.pathname.startsWith('/admin') ||
          req.nextUrl.pathname.startsWith('/driver') ||
          req.nextUrl.pathname.startsWith('/client')) {
          return !!token
        }
        return true
      },
    },
  }
)

const intlMiddleware = createMiddleware(routing)

const AUTH_PREFIXES = ['/dashboard', '/admin', '/driver', '/client']

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

  if (AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
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
    '/',
    '/(fr|en|es)',
    '/flotte/:path*',
    '/(fr|en|es)/flotte/:path*',
    '/contact/:path*',
    '/(fr|en|es)/contact/:path*',
    '/temoignages/:path*',
    '/(fr|en|es)/temoignages/:path*',
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
  ],
}

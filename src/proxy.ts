import { NextRequest, NextFetchEvent, NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

// Next.js only allows a single proxy/middleware file, so the pre-existing
// role-based auth guard (dashboard/admin/driver/client) and the next-intl
// locale routing (public marketing pages) are combined here and dispatched
// by path prefix instead of running as two separate files.

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

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl

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
  matcher: [
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

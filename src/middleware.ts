import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirection basée sur le rôle après connexion
    if (pathname === '/dashboard') {
      if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (token?.role === 'customer') {
        return NextResponse.redirect(new URL('/client/dashboard', req.url))
      }
    }
    
    if (pathname === '/admin/dashboard' && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (pathname === '/client/dashboard' && token?.role !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protection des routes admin
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protection des routes client
    if (pathname.startsWith('/client') && token?.role !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard, admin and client routes
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/admin') ||
            req.nextUrl.pathname.startsWith('/client')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/client/:path*',
  ]
}
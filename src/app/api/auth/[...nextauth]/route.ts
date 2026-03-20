import NextAuth from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"

// ✅ Debug: Verify handler creation
if (!authOptions.secret) {
  console.error("❌ CRITICAL: NEXTAUTH_SECRET is not configured!")
}

console.log("✅ [Auth Route] NextAuth handler initialized")

import { NextRequest } from "next/server"

const handler = NextAuth(authOptions)
type NextAuthRouteContext = { params: Promise<{ nextauth: string[] }> }

// ✅ Export for both GET and POST methods
export async function GET(req: NextRequest, props: NextAuthRouteContext) {
  const params = await props.params;
  return handler(req, { params });
}

export async function POST(req: NextRequest, props: NextAuthRouteContext) {
  const params = await props.params;
  return handler(req, { params });
}

// ✅ Ensure the route is recognized by Next.js
export const dynamic = "force-dynamic"

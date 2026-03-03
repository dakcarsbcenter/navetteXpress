import NextAuth from "next-auth/next"
import { authOptions } from "@/lib/auth"

// ✅ Debug: Verify handler creation
if (!authOptions.secret) {
  console.error("❌ CRITICAL: NEXTAUTH_SECRET is not configured!")
}

console.log("✅ [Auth Route] NextAuth handler initialized")

const handler = NextAuth(authOptions)

// ✅ Export for both GET and POST methods
export const GET = handler
export const POST = handler

// ✅ Ensure the route is recognized by Next.js
export const dynamic = "force-dynamic"

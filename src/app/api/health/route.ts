import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: {
          nextauthUrl: process.env.NEXTAUTH_URL,
          hasSecret: !!process.env.NEXTAUTH_SECRET,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    )
  }
}

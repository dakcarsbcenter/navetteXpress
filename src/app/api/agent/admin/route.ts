export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { runAdminAgent } from "@/lib/agent/admin-agent"

export async function POST() {
  const session = await getServerSession(authOptions) as { user?: { role?: string } } | null

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "manager")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-REMPLACER")) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée. Ajoutez votre clé API dans le fichier .env." },
      { status: 503 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        for await (const event of runAdminAgent()) {
          send(event)
        }
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Erreur inconnue de l'agent",
        })
      } finally {
        send({ type: "done" })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

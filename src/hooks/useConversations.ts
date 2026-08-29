"use client"

import { useCallback, useEffect, useState } from "react"

export interface ConversationSummary {
  id: number
  type: "booking" | "support"
  bookingId: number | null
  lastMessageAt: string | null
  client: { id: string; name: string } | null
  driver: { id: string; name: string } | null
  unreadCount: number
}

/** Liste des conversations de l'utilisateur courant, avec un polling léger pour le badge "non lu". */
export function useConversations(pollMs = 30_000) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations")
      const data = await res.json()
      if (data.success) setConversations(data.conversations)
    } catch {
      // silencieux : la liste/le badge restent inchangés, non bloquant pour la navigation
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, pollMs)
    return () => clearInterval(interval)
  }, [load, pollMs])

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return { conversations, loading, unreadTotal, reload: load }
}

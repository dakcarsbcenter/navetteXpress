"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface ChatMessage {
  id: number
  conversationId: number
  senderId: string | null
  content: string
  createdAt: string
}

export function useChatConversation(conversationId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seenIds = useRef<Set<number>>(new Set())

  const appendIfNew = useCallback((message: ChatMessage) => {
    if (seenIds.current.has(message.id)) return
    seenIds.current.add(message.id)
    setMessages((prev) => [...prev, message])
  }, [])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      seenIds.current = new Set()
      return
    }

    let cancelled = false
    seenIds.current = new Set()
    setLoading(true)
    setError(null)

    fetch(`/api/conversations/${conversationId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.success) {
          const initial: ChatMessage[] = data.messages
          initial.forEach((m) => seenIds.current.add(m.id))
          setMessages(initial)
        } else {
          setError(data.error || "Erreur")
        }
      })
      .catch(() => {
        if (!cancelled) setError("Erreur de connexion")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const eventSource = new EventSource(`/api/conversations/${conversationId}/stream`)
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ChatMessage
        appendIfNew(message)
      } catch {
        // ignore les lignes non-JSON (heartbeat/commentaires SSE)
      }
    }
    eventSource.onerror = () => {
      // EventSource se reconnecte automatiquement ; rien à faire ici
    }

    fetch(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {})

    return () => {
      cancelled = true
      eventSource.close()
    }
  }, [conversationId, appendIfNew])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return
      setSending(true)
      setError(null)
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })
        const data = await res.json()
        if (data.success) {
          appendIfNew(data.message)
        } else {
          setError(data.error || "Erreur")
        }
      } catch {
        setError("Erreur de connexion")
      } finally {
        setSending(false)
      }
    },
    [conversationId, appendIfNew]
  )

  return { messages, loading, sending, error, sendMessage }
}

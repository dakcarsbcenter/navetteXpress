"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ChatCircle, Headset } from "@phosphor-icons/react"
import { useConversations } from "@/hooks/useConversations"
import { ConversationListItem } from "@/components/chat/ConversationListItem"
import { ChatWindow } from "@/components/chat/ChatWindow"

interface BookingForChat {
  id: number
  status: string
  driver?: { id: string; name: string; phone: string | null } | null
}

interface ClientMessagesPanelProps {
  bookings: BookingForChat[]
  initialBookingId?: number | null
}

const CLOSED_STATUSES = new Set(["cancelled", "rejected"])

export function ClientMessagesPanel({ bookings, initialBookingId }: ClientMessagesPanelProps) {
  const t = useTranslations("common.chat")
  const { conversations, reload } = useConversations()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [starting, setStarting] = useState<number | "support" | null>(null)
  const [autoOpened, setAutoOpened] = useState(false)

  const startConversation = useCallback(
    async (body: { type: "booking"; bookingId: number } | { type: "support" }) => {
      const key = body.type === "booking" ? body.bookingId : "support"
      setStarting(key)
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.success) {
          setSelectedId(data.conversation.id)
          reload()
        }
      } finally {
        setStarting(null)
      }
    },
    [reload]
  )

  useEffect(() => {
    if (autoOpened || !initialBookingId) return
    setAutoOpened(true)
    const existing = conversations.find((c) => c.type === "booking" && c.bookingId === initialBookingId)
    if (existing) {
      setSelectedId(existing.id)
    } else {
      startConversation({ type: "booking", bookingId: initialBookingId })
    }
  }, [autoOpened, initialBookingId, conversations, startConversation])

  const bookingConversations = conversations.filter((c) => c.type === "booking")
  const supportConversation = conversations.find((c) => c.type === "support") ?? null

  const startableBookings = bookings.filter(
    (b) => b.driver && !CLOSED_STATUSES.has(b.status) && !bookingConversations.some((c) => c.bookingId === b.id)
  )

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null

  const listPane = (
    <div style={{ width: "100%", maxWidth: "320px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2DACD" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{t("title")}</h3>
      </div>
      <div style={{ overflowY: "auto" }}>
        <button
          type="button"
          onClick={() => (supportConversation ? setSelectedId(supportConversation.id) : startConversation({ type: "support" }))}
          disabled={starting === "support"}
          style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px 14px", border: "none", borderBottom: "1px solid #F0EAE0", background: selectedId === supportConversation?.id ? "#F7F3EC" : "#FFFFFF", cursor: "pointer", textAlign: "left" }}
        >
          <Headset size={16} style={{ color: "#1F5245", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#12100E", flex: 1 }}>{t("support.title")}</span>
          {supportConversation && supportConversation.unreadCount > 0 && (
            <span style={{ minWidth: "18px", height: "18px", padding: "0 5px", display: "grid", placeItems: "center", borderRadius: "9px", background: "#1F5245", color: "#FFFFFF", fontSize: "10px", fontWeight: 700 }}>
              {supportConversation.unreadCount}
            </span>
          )}
        </button>

        {bookingConversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={selectedId === conversation.id}
            label={conversation.driver?.name ?? t("unassignedDriver")}
            onClick={() => setSelectedId(conversation.id)}
          />
        ))}

        {startableBookings.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => startConversation({ type: "booking", bookingId: booking.id })}
            disabled={starting === booking.id}
            style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px 14px", border: "none", borderBottom: "1px solid #F0EAE0", background: "#FFFFFF", cursor: starting === booking.id ? "default" : "pointer", textAlign: "left", opacity: starting === booking.id ? 0.6 : 1 }}
          >
            <ChatCircle size={16} style={{ color: "#6E6A63", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#12100E" }}>
              {t("booking.startWithDriver")} · {booking.driver?.name}
            </span>
          </button>
        ))}

        {bookingConversations.length === 0 && startableBookings.length === 0 && (
          <p style={{ padding: "14px", fontSize: "12px", color: "#6E6A63" }}>{t("noConversations")}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row" style={{ gap: "16px", height: "calc(100vh - 220px)", minHeight: "480px" }}>
      <div className={selectedId ? "hidden md:flex" : "flex"} style={{ flexDirection: "column" }}>
        {listPane}
      </div>
      <div className={selectedId ? "flex" : "hidden md:flex"} style={{ flex: 1, minWidth: 0 }}>
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation.id}
            title={selectedConversation.type === "support" ? t("support.title") : selectedConversation.driver?.name ?? t("unassignedDriver")}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div style={{ display: "grid", placeItems: "center", width: "100%", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#6E6A63", fontSize: "13px" }}>
            {t("emptyConversation")}
          </div>
        )}
      </div>
    </div>
  )
}

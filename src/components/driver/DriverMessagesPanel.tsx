"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ChatCircle } from "@phosphor-icons/react"
import { useConversations } from "@/hooks/useConversations"
import { ConversationListItem } from "@/components/chat/ConversationListItem"
import { ChatWindow } from "@/components/chat/ChatWindow"
import type { DriverBookingsApiResponse } from "@/types/dashboard"

const CLOSED_STATUSES = new Set(["cancelled", "rejected"])

export function DriverMessagesPanel() {
  const t = useTranslations("common.chat")
  const { conversations, reload } = useConversations()
  const [bookings, setBookings] = useState<{ id: number; status: string; customerName: string }[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [starting, setStarting] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/driver/bookings")
      .then((res) => res.json())
      .then((data: DriverBookingsApiResponse) => {
        if (data.success) {
          setBookings(data.data.map(({ booking }) => ({ id: booking.id, status: booking.status, customerName: booking.customerName })))
        }
      })
      .catch(() => {})
  }, [])

  const bookingConversations = conversations.filter((c) => c.type === "booking")

  const startableBookings = bookings.filter(
    (b) => !CLOSED_STATUSES.has(b.status) && !bookingConversations.some((c) => c.bookingId === b.id)
  )

  const startConversation = async (bookingId: number) => {
    setStarting(bookingId)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "booking", bookingId }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedId(data.conversation.id)
        reload()
      }
    } finally {
      setStarting(null)
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null

  const listPane = (
    <div style={{ width: "100%", maxWidth: "320px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2DACD" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{t("title")}</h3>
      </div>
      <div style={{ overflowY: "auto" }}>
        {bookingConversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={selectedId === conversation.id}
            label={conversation.client?.name ?? "—"}
            onClick={() => setSelectedId(conversation.id)}
          />
        ))}

        {startableBookings.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => startConversation(booking.id)}
            disabled={starting === booking.id}
            style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px 14px", border: "none", borderBottom: "1px solid #F0EAE0", background: "#FFFFFF", cursor: starting === booking.id ? "default" : "pointer", textAlign: "left", opacity: starting === booking.id ? 0.6 : 1 }}
          >
            <ChatCircle size={16} style={{ color: "#6E6A63", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#12100E" }}>{booking.customerName}</span>
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
            title={selectedConversation.client?.name ?? "—"}
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

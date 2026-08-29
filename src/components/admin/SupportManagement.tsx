"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useConversations } from "@/hooks/useConversations"
import { ConversationListItem } from "@/components/chat/ConversationListItem"
import { ChatWindow } from "@/components/chat/ChatWindow"

export default function SupportManagement() {
  const t = useTranslations("common.chat")
  const { conversations } = useConversations()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null

  const listPane = (
    <div style={{ width: "100%", maxWidth: "320px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2DACD" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{t("support.title")}</h3>
      </div>
      <div style={{ overflowY: "auto" }}>
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={selectedId === conversation.id}
            label={conversation.client?.name ?? "—"}
            onClick={() => setSelectedId(conversation.id)}
          />
        ))}
        {conversations.length === 0 && <p style={{ padding: "14px", fontSize: "12px", color: "#6E6A63" }}>{t("noConversations")}</p>}
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

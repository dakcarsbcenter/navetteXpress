"use client"

import type { ConversationSummary } from "@/hooks/useConversations"

interface ConversationListItemProps {
  conversation: ConversationSummary
  active: boolean
  label: string
  onClick: () => void
}

export function ConversationListItem({ conversation, active, label, onClick }: ConversationListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        width: "100%",
        padding: "12px 14px",
        border: "none",
        borderBottom: "1px solid #F0EAE0",
        background: active ? "#F7F3EC" : "#FFFFFF",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: conversation.unreadCount > 0 ? 700 : 500, color: "#12100E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {conversation.unreadCount > 0 && (
        <span
          style={{
            flexShrink: 0,
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            display: "grid",
            placeItems: "center",
            borderRadius: "9px",
            background: "#1F5245",
            color: "#FFFFFF",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {conversation.unreadCount}
        </span>
      )}
    </button>
  )
}

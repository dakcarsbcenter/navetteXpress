"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { PaperPlaneTilt, ArrowLeft } from "@phosphor-icons/react"
import { toIntlLocale } from "@/lib/intl-locale"
import { useChatConversation } from "@/hooks/useChatConversation"

interface ChatWindowProps {
  conversationId: number
  title: string
  subtitle?: string
  onBack?: () => void
}

export function ChatWindow({ conversationId, title, subtitle, onBack }: ChatWindowProps) {
  const t = useTranslations("common.chat")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const { data: session } = useSession()
  const currentUserId = (session?.user as { id?: string } | undefined)?.id
  const { messages, loading, sending, error, sendMessage } = useChatConversation(conversationId)
  const [draft, setDraft] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setDraft("")
    await sendMessage(content)
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px", borderBottom: "1px solid #E2DACD", background: "#F7F3EC" }}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Retour" style={{ display: "grid", placeItems: "center", width: "28px", height: "28px", background: "transparent", border: "none", cursor: "pointer", color: "#12100E" }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{title}</p>
          {subtitle && <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6E6A63" }}>{subtitle}</p>}
        </div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <p style={{ fontSize: "12px", color: "#6E6A63" }}>{t("loading")}</p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#6E6A63" }}>{t("emptyConversation")}</p>
        ) : (
          messages.map((message) => {
            const isSelf = message.senderId === currentUserId
            return (
              <div key={message.id} style={{ display: "flex", justifyContent: isSelf ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius: "10px",
                    background: isSelf ? "#1F5245" : "#F7F3EC",
                    color: isSelf ? "#FFFFFF" : "#12100E",
                    border: isSelf ? "none" : "1px solid #E2DACD",
                    fontSize: "13px",
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {message.content}
                  <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.7, textAlign: "right" }}>
                    {new Date(message.createdAt).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && <p style={{ margin: "0 20px 8px", fontSize: "11px", color: "#B8493C" }}>{t("error")}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", padding: "12px 16px", borderTop: "1px solid #E2DACD" }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("placeholder")}
          maxLength={4000}
          style={{ flex: 1, height: "40px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "6px", fontSize: "13px", outline: "none", color: "#12100E" }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label={t("send")}
          style={{ display: "grid", placeItems: "center", width: "40px", height: "40px", background: "#1F5245", border: "none", borderRadius: "6px", color: "#FFFFFF", cursor: sending || !draft.trim() ? "default" : "pointer", opacity: sending || !draft.trim() ? 0.5 : 1 }}
        >
          <PaperPlaneTilt size={17} weight="fill" />
        </button>
      </form>
    </section>
  )
}

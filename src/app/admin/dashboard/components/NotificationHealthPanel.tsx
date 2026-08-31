"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"

interface FailedNotification {
  id: number
  channel: "email" | "whatsapp"
  handler: string
  lastError: string | null
  attempts: number
  updatedAt: string
}

const CHANNEL_LABEL: Record<FailedNotification["channel"], string> = {
  email: "Email",
  whatsapp: "WhatsApp",
}

export function NotificationHealthPanel() {
  const t = useTranslations("admin.overview.notificationHealth")
  const [failed, setFailed] = useState<FailedNotification[]>([])
  const [pendingRetryCount, setPendingRetryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notification-queue")
      const json = await res.json()
      if (json.success) {
        setFailed(json.data.failed)
        setPendingRetryCount(json.data.pendingRetryCount)
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la file de notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dismiss = useCallback(async (id: number) => {
    setFailed((current) => current.filter((job) => job.id !== id))
    try {
      await fetch(`/api/admin/notification-queue?id=${id}`, { method: "DELETE" })
    } catch (error) {
      console.error("Erreur lors de la suppression du job de notification:", error)
    }
  }, [])

  if (loading) return null

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
        {pendingRetryCount > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
            {t("retrying", { count: pendingRetryCount })}
          </span>
        )}
      </div>

      {failed.length === 0 ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E2DACD", border: "1px solid #E2DACD", borderRadius: "3px", overflow: "hidden" }}>
          {failed.map((job) => (
            <div key={job.id} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "11px 14px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{CHANNEL_LABEL[job.channel]} — {job.handler.split(".")[1] || job.handler}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.08em", color: "#B8493C" }}>
                    {t("attempts", { count: job.attempts })}
                  </span>
                  <button
                    type="button"
                    onClick={() => dismiss(job.id)}
                    title={t("dismiss")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6E6A63", fontSize: "13px", lineHeight: 1, padding: "2px 4px" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {job.lastError && (
                <span style={{ fontSize: "12px", color: "#6E6A63", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.lastError}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

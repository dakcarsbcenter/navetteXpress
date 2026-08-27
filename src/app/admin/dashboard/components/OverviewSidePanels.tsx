"use client"

import { useTranslations } from "next-intl"

export interface AwaitingDecision {
  unansweredPriceProposals: number
  quotesToSend: number
  reviewsToModerate: number
  openVehicleReports: number
}

export interface CorridorSegment {
  segment: "dakarAibd" | "aibdPetiteCote" | "intraDakar" | "other"
  count: number
  widthPercent: number
}

export interface NewAccount {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "driver" | "customer"
}

const SEGMENT_FILL: Record<CorridorSegment["segment"], string> = {
  dakarAibd: "#12100E",
  aibdPetiteCote: "#12100E",
  intraDakar: "#12100E",
  other: "#B4643A",
}

export function AwaitingDecisionPanel({ decisions }: { decisions: AwaitingDecision }) {
  const t = useTranslations("admin.overview.decisions")

  const items = [
    { key: "unansweredPrices", count: decisions.unansweredPriceProposals, color: "#B4643A" },
    { key: "quotesToSend", count: decisions.quotesToSend, color: "#B4643A" },
    { key: "reviewsToModerate", count: decisions.reviewsToModerate, color: "#B4643A" },
    { key: "openReports", count: decisions.openVehicleReports, color: "#B8493C" },
  ] as const

  return (
    <div style={{ background: "#12100E", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>{t("title")}</span>
      {items.map((item, index) => (
        <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", paddingBottom: "13px", borderBottom: index < items.length - 1 ? "1px solid #2e2b27" : "none" }}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#F7F3EC" }}>{t(item.key)}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "17px", fontWeight: 600, color: item.color, flexShrink: 0 }}>{item.count}</span>
        </div>
      ))}
    </div>
  )
}

export function CorridorLoadPanel({ segments }: { segments: CorridorSegment[] }) {
  const t = useTranslations("admin.overview.segments")

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("today")}</span>
      </div>

      {segments.length === 0 ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      ) : (
        segments.map((seg) => (
          <div key={seg.segment} style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500 }}>{t(`labels.${seg.segment}`)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#6E6A63" }}>{t("count", { count: seg.count })}</span>
            </div>
            <div style={{ height: "6px", background: "#F0EAE0", borderRadius: "1px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${seg.widthPercent}%`, background: SEGMENT_FILL[seg.segment] }} />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export function NewAccountsPanel({ accounts }: { accounts: NewAccount[] }) {
  const t = useTranslations("admin.overview.newAccounts")

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
      {accounts.length === 0 ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E2DACD", border: "1px solid #E2DACD", borderRadius: "3px", overflow: "hidden" }}>
          {accounts.map((account) => (
            <div key={account.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "11px 14px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                <span style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.08em", color: "#6E6A63", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.email}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#12100E", border: "1px solid #E2DACD", borderRadius: "2px", padding: "3px 7px", flexShrink: 0 }}>
                {t(`roles.${account.role}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

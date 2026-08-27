"use client"

import { useTranslations } from "next-intl"

export type StatusDomain = "booking" | "quote" | "invoice" | "report" | "tripPlan"
export type StatusAudience = "client" | "driver" | "admin"

export type Tone = "attente" | "valide" | "enCours" | "clos" | "arrete"

// Les cinq tons du systeme de statuts (README redesign) — reutilisable par tout
// composant qui a besoin d'un pastille de statut hors du couple domaine/valeur
// de StatusBadge (ex: sous-etapes locales d'une course chauffeur).
export const TONE_STYLE: Record<Tone, { color: string; bg: string }> = {
  attente: { color: "#B4643A", bg: "rgba(180,100,58,.10)" },
  valide: { color: "#1F5245", bg: "rgba(31,82,69,.10)" },
  enCours: { color: "#1B9E4B", bg: "rgba(34,197,94,.12)" },
  clos: { color: "#6E6A63", bg: "rgba(110,106,99,.12)" },
  arrete: { color: "#B8493C", bg: "rgba(184,73,60,.10)" },
}

const DOMAIN_TONES: Record<StatusDomain, Record<string, Tone>> = {
  booking: {
    pending: "attente",
    assigned: "valide",
    approved: "valide",
    rejected: "arrete",
    confirmed: "valide",
    in_progress: "enCours",
    completed: "clos",
    cancelled: "arrete",
  },
  quote: {
    pending: "attente",
    in_progress: "enCours",
    sent: "attente",
    accepted: "valide",
    rejected: "arrete",
    expired: "clos",
  },
  invoice: {
    draft: "clos",
    pending: "attente",
    paid: "valide",
    cancelled: "arrete",
    overdue: "arrete",
  },
  report: {
    open: "attente",
    in_progress: "enCours",
    resolved: "valide",
    closed: "clos",
  },
  tripPlan: {
    active: "valide",
    completed: "clos",
    cancelled: "arrete",
  },
}

// Expose le ton d'un couple domaine/valeur aux composants qui ont besoin de la
// meme couleur que StatusBadge pour autre chose qu'une pastille (ex: une barre
// d'accent de carte), sans dupliquer DOMAIN_TONES localement.
export function toneForStatus(domain: StatusDomain, value: string): Tone {
  return DOMAIN_TONES[domain]?.[value] ?? "clos"
}

interface StatusBadgeProps {
  domain: StatusDomain
  value: string
  audience: StatusAudience
  live?: boolean
}

export function StatusBadge({ domain, value, audience, live }: StatusBadgeProps) {
  const t = useTranslations("statuses")
  const tone = DOMAIN_TONES[domain]?.[value]

  if (!tone && typeof window !== "undefined") {
    console.warn(`StatusBadge: valeur inconnue "${value}" pour le domaine "${domain}"`)
  }

  const style = TONE_STYLE[tone ?? "clos"]
  const label = tone ? t(`${domain}.${value}.${audience}`) : value
  const isLive = Boolean(live) && tone === "enCours"

  return (
    <span
      className="inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-[2px] px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      <span
        className={`h-[5px] w-[5px] shrink-0 rounded-full${isLive ? " live-badge" : ""}`}
        style={{ backgroundColor: style.color }}
      />
      {label}
    </span>
  )
}

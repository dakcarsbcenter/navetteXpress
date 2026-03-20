"use client"

import { useState, useRef } from "react"
import { Bot, Play, CheckCircle, XCircle, Loader2, AlertTriangle, Star, Car } from "lucide-react"
import type { AgentProposal, AssignmentProposal, ReviewProposal, StreamEvent } from "@/lib/agent/admin-agent"

type ProposalState = "pending" | "approved" | "rejected"

interface ProposalItem {
  proposal: AgentProposal
  state: ProposalState
  loading: boolean
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ConfidenceBadge({ confidence }: { confidence: AssignmentProposal["confidence"] }) {
  const styles = {
    high: "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-(--success) border-[color-mix(in_srgb,var(--success)_30%,transparent)]",
    medium: "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-(--accent) border-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
    low: "bg-[color-mix(in_srgb,#f59e0b_15%,transparent)] text-amber-400 border-[color-mix(in_srgb,#f59e0b_30%,transparent)]",
  }
  const labels = { high: "Fiable", medium: "Modérée", low: "Incertaine" }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-bold ${styles[confidence]}`}>
      {labels[confidence]}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? "fill-amber-400 text-amber-400" : "text-(--border)"}
        />
      ))}
    </span>
  )
}

function AssignmentCard({
  item,
  onApprove,
  onReject,
}: {
  item: ProposalItem
  onApprove: () => void
  onReject: () => void
}) {
  const p = item.proposal as AssignmentProposal
  return (
    <article className="rounded-xl border border-(--border) bg-(--bg-card) p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Car size={16} className="shrink-0 text-(--accent)" />
          <span className="text-sm font-bold text-(--text-primary)">{p.customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={p.confidence} />
          {item.state === "approved" && <CheckCircle size={18} className="text-(--success)" />}
          {item.state === "rejected" && <XCircle size={18} className="text-red-400" />}
        </div>
      </div>

      <div className="grid gap-1 text-xs text-(--text-secondary)">
        <p><span className="font-semibold text-(--text-primary)">Départ :</span> {p.pickupAddress}</p>
        <p><span className="font-semibold text-(--text-primary)">Arrivée :</span> {p.dropoffAddress}</p>
        <p><span className="font-semibold text-(--text-primary)">Date :</span> {formatDateTime(p.scheduledDateTime)}</p>
        <p><span className="font-semibold text-(--text-primary)">Chauffeur proposé :</span> {p.driverName}</p>
      </div>

      <p className="rounded-lg bg-[color-mix(in_srgb,var(--bg-secondary)_60%,transparent)] px-3 py-2 text-xs text-(--text-secondary) italic">
        {p.reasoning}
      </p>

      {item.state === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={item.loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-(--accent) px-3 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
          >
            {item.loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Approuver
          </button>
          <button
            onClick={onReject}
            disabled={item.loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-(--border) bg-(--bg-secondary) px-3 py-2 text-xs font-bold text-(--text-primary) hover:bg-(--bg-primary) disabled:opacity-50"
          >
            <XCircle size={13} />
            Rejeter
          </button>
        </div>
      )}
      {item.state === "approved" && (
        <p className="text-center text-xs font-semibold text-(--success)">✓ Assignation effectuée</p>
      )}
      {item.state === "rejected" && (
        <p className="text-center text-xs text-(--text-muted)">Proposition rejetée</p>
      )}
    </article>
  )
}

function ReviewCard({
  item,
  onApprove,
  onReject,
}: {
  item: ProposalItem
  onApprove: () => void
  onReject: () => void
}) {
  const p = item.proposal as ReviewProposal
  return (
    <article className="rounded-xl border border-(--border) bg-(--bg-card) p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-(--text-primary)">{p.customerName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={p.rating} />
            <span className="text-xs text-(--text-muted)">{p.driverName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-(--border) px-2 py-0.5 text-[0.7rem] font-semibold text-(--text-muted) uppercase">{p.language}</span>
          {item.state === "approved" && <CheckCircle size={18} className="text-(--success)" />}
          {item.state === "rejected" && <XCircle size={18} className="text-red-400" />}
        </div>
      </div>

      <div className="grid gap-2 text-xs">
        <div className="rounded-lg bg-[color-mix(in_srgb,var(--bg-secondary)_60%,transparent)] px-3 py-2">
          <p className="mb-1 font-semibold text-(--text-muted) uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Avis client</p>
          <p className="text-(--text-secondary) italic">&ldquo;{p.comment || "(sans commentaire)"}&rdquo;</p>
        </div>
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--success)_25%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-3 py-2">
          <p className="mb-1 font-semibold text-(--success) uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>Réponse proposée</p>
          <p className="text-(--text-primary) text-xs">{p.proposedResponse}</p>
        </div>
      </div>

      <p className="text-[0.7rem] text-(--text-muted) italic">{p.reasoning}</p>

      {item.state === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={item.loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-(--accent) px-3 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
          >
            {item.loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Publier
          </button>
          <button
            onClick={onReject}
            disabled={item.loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-(--border) bg-(--bg-secondary) px-3 py-2 text-xs font-bold text-(--text-primary) hover:bg-(--bg-primary) disabled:opacity-50"
          >
            <XCircle size={13} />
            Rejeter
          </button>
        </div>
      )}
      {item.state === "approved" && (
        <p className="text-center text-xs font-semibold text-(--success)">✓ Réponse publiée</p>
      )}
      {item.state === "rejected" && (
        <p className="text-center text-xs text-(--text-muted)">Proposition rejetée</p>
      )}
    </article>
  )
}

export function AgentAdminPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (text: string) => {
    setLogs((prev) => [...prev, text])
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  const TOOL_LABELS: Record<string, string> = {
    get_pending_bookings: "réservations en attente",
    get_active_drivers: "chauffeurs actifs",
    get_driver_availability: "disponibilités d'un chauffeur",
    get_driver_existing_bookings: "planning existant d'un chauffeur",
    get_unresponded_reviews: "avis sans réponse",
  }

  const runAgent = async () => {
    setIsRunning(true)
    setLogs([])
    setProposals([])
    setError(null)

    try {
      const response = await fetch("/api/agent/admin", { method: "POST" })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Erreur serveur")
        return
      }

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event: StreamEvent & { type: string } = JSON.parse(line.slice(6))

            if (event.type === "thinking" && event.text) {
              addLog(`💭 ${event.text}`)
            } else if (event.type === "tool_call" && event.toolName) {
              addLog(`🔍 Lecture : ${TOOL_LABELS[event.toolName] ?? event.toolName}...`)
            } else if (event.type === "tool_result" && event.toolName) {
              const label = TOOL_LABELS[event.toolName] ?? event.toolName
              const count = event.count !== undefined ? ` (${event.count} résultats)` : ""
              addLog(`✅ ${label}${count}`)
            } else if (event.type === "proposals" && event.proposals) {
              addLog(`📋 ${event.proposals.length} proposition(s) générée(s)`)
              setProposals(
                event.proposals.map((p) => ({ proposal: p, state: "pending", loading: false }))
              )
            } else if (event.type === "error" && event.error) {
              setError(event.error)
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion")
    } finally {
      setIsRunning(false)
    }
  }

  const approveProposal = async (index: number) => {
    setProposals((prev) =>
      prev.map((item, i) => (i === index ? { ...item, loading: true } : item))
    )
    try {
      const res = await fetch("/api/agent/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposals[index].proposal),
      })
      const data = await res.json()
      if (data.success) {
        setProposals((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, state: "approved", loading: false } : item
          )
        )
      } else {
        setProposals((prev) =>
          prev.map((item, i) => (i === index ? { ...item, loading: false } : item))
        )
        setError(data.error ?? "Échec de l'approbation")
      }
    } catch {
      setProposals((prev) =>
        prev.map((item, i) => (i === index ? { ...item, loading: false } : item))
      )
    }
  }

  const rejectProposal = (index: number) => {
    setProposals((prev) =>
      prev.map((item, i) => (i === index ? { ...item, state: "rejected" } : item))
    )
  }

  const assignments = proposals.filter((p) => p.proposal.type === "assignment")
  const reviews = proposals.filter((p) => p.proposal.type === "review_response")

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
            <Bot size={20} className="text-(--accent)" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-(--text-primary)">Agent Admin IA</h2>
            <p className="text-xs text-(--text-secondary)">Powered by Claude Opus 4.6</p>
          </div>
        </div>
        <button
          onClick={runAgent}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-(--accent) px-4 py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} />
          )}
          {isRunning ? "Analyse en cours..." : "Lancer l'analyse"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-(--border) bg-(--bg-secondary) p-3">
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-(--text-muted)">
            Journal d&apos;analyse
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs text-(--text-secondary)">
            {logs.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Proposals */}
      {proposals.length > 0 && (
        <div className="space-y-5">
          {assignments.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-(--text-primary)">
                <Car size={15} className="text-(--accent)" />
                Assignations proposées
                <span className="ml-auto rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-2 py-0.5 text-[0.7rem] font-bold text-(--accent)">
                  {assignments.filter((p) => p.state === "pending").length} en attente
                </span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {assignments.map((item) => {
                  const index = proposals.indexOf(item)
                  return (
                    <AssignmentCard
                      key={item.proposal.type + (item.proposal as AssignmentProposal).bookingId}
                      item={item}
                      onApprove={() => approveProposal(index)}
                      onReject={() => rejectProposal(index)}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {reviews.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-(--text-primary)">
                <Star size={15} className="text-(--accent)" />
                Réponses aux avis proposées
                <span className="ml-auto rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-2 py-0.5 text-[0.7rem] font-bold text-(--accent)">
                  {reviews.filter((p) => p.state === "pending").length} en attente
                </span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {reviews.map((item) => {
                  const index = proposals.indexOf(item)
                  return (
                    <ReviewCard
                      key={item.proposal.type + (item.proposal as ReviewProposal).reviewId}
                      item={item}
                      onApprove={() => approveProposal(index)}
                      onReject={() => rejectProposal(index)}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isRunning && proposals.length === 0 && logs.length === 0 && (
        <div className="rounded-xl border border-dashed border-(--border) p-8 text-center">
          <Bot size={32} className="mx-auto mb-3 text-(--text-muted)" />
          <p className="text-sm font-semibold text-(--text-secondary)">Aucune analyse effectuée</p>
          <p className="mt-1 text-xs text-(--text-muted)">
            Cliquez sur &ldquo;Lancer l&apos;analyse&rdquo; pour que l&apos;agent vérifie les réservations en attente et les avis sans réponse.
          </p>
        </div>
      )}
    </div>
  )
}

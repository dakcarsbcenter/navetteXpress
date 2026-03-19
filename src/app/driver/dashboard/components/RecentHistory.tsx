"use client"

import Link from "next/link"
import type { HistoryItem, RecentHistoryProps } from "@/types/dashboard"
import { EmptyState } from "@/components/driver/shared"

function statusClass(status: HistoryItem["statut"]): string {
  if (status === "Terminé") {
    return "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-(--success)"
  }

  if (status === "Annulé") {
    return "bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-(--danger)"
  }

  return "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-(--accent)"
}

export function RecentHistory({ items }: RecentHistoryProps) {
  return (
    <section className="driver-dashboard-card rounded-2xl border border-(--border) bg-(--bg-card) p-6">
      <header className="mb-5 flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-(--text-primary)">Historique Récent</h3>
        <Link href="/driver/history" className="text-sm font-semibold text-(--accent) hover:opacity-80">
          Voir tout →
        </Link>
      </header>

      {items.length === 0 ? (
        <EmptyState icon={<span className="text-xl">🗂️</span>} title="AUCUN HISTORIQUE" description="Aucun historique disponible" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-(--border) text-left text-xs uppercase tracking-wide text-(--text-muted)">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Trajet</th>
                <th className="pb-3 font-medium">Distance</th>
                <th className="pb-3 font-medium">Revenu</th>
                <th className="pb-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-(--border)/60 text-sm text-(--text-primary)">
                  <td className="py-3">{item.date}</td>
                  <td className="py-3">{item.trajet}</td>
                  <td className="py-3">{item.distance}</td>
                  <td className="py-3">{item.revenu}</td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.statut)}`}>
                      {item.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

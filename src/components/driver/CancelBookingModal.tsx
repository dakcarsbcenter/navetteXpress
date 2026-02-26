"use client"

import { useState } from "react"
import {
  Warning,
  User,
  Wrench,
  TrafficSignal,
  Siren,
  CloudRain,
  Thermometer,
  Phone,
  Pencil,
  Prohibit,
  X,
  CircleNotch
} from "@phosphor-icons/react"

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  bookingId?: number
  customerName?: string
  isLoading?: boolean
}

export function CancelBookingModal({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
  customerName,
  isLoading = false
}: CancelBookingModalProps) {
  const [reason, setReason] = useState("")
  const [selectedReason, setSelectedReason] = useState("")

  if (!isOpen) return null

  const predefinedReasons = [
    { id: "vehicle_issue", label: "Problème technique avec le véhicule", icon: <Wrench weight="fill" /> },
    { id: "traffic", label: "Embouteillages importants / Route bloquée", icon: <TrafficSignal weight="fill" /> },
    { id: "emergency", label: "Urgence personnelle", icon: <Siren weight="fill" /> },
    { id: "weather", label: "Conditions météorologiques dangereuses", icon: <CloudRain weight="fill" /> },
    { id: "illness", label: "Indisposition / Problème de santé", icon: <Thermometer weight="fill" /> },
    { id: "customer_request", label: "Demande du client", icon: <Phone weight="fill" /> },
    { id: "other", label: "Autre raison (préciser)", icon: <Pencil weight="fill" /> }
  ]

  const handleSubmit = () => {
    let finalReason = ""

    // Construire le motif d'annulation complet
    if (selectedReason === "other") {
      finalReason = reason.trim()
    } else {
      const selectedReasonData = predefinedReasons.find(r => r.id === selectedReason)
      finalReason = selectedReasonData?.label.replace(/^[^\s]+ /, '') || selectedReason
    }

    onConfirm(finalReason)
    // Reset form
    setReason("")
    setSelectedReason("")
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">

        {/* Header */}
        <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Warning size={24} weight="fill" className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Annuler la réservation
                </h2>
                <p className="text-red-100 text-sm">
                  Réservation #{bookingId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Client info */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User size={20} weight="fill" className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {customerName || 'Client non spécifié'}
                </p>
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex gap-3">
              <Warning size={20} weight="fill" className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Attention
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Cette action annulera définitivement la réservation. Le client sera automatiquement notifié de l'annulation.
                </p>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Motif de l'annulation *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {predefinedReasons.map((reasonOption) => (
                <label
                  key={reasonOption.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedReason === reasonOption.id
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reasonOption.id}
                    checked={selectedReason === reasonOption.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <div className="text-lg text-slate-500 dark:text-slate-400">
                    {reasonOption.icon}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                    {reasonOption.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional details for "Other" reason */}
          {selectedReason === "other" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Précisez la raison
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Décrivez brièvement la raison de l'annulation..."
                rows={3}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-600">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !selectedReason || (selectedReason === "other" && !reason.trim())}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} weight="bold" className="animate-spin" />
                  Annulation en cours...
                </>
              ) : (
                <>
                  <Prohibit size={18} weight="bold" />
                  Confirmer l'annulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

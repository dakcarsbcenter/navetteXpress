"use client"

import Image from "next/image"

export type DeleteVehicle = {
  id: number
  make: string
  model: string
  plateNumber: string
  year: number
  capacity: number
  photo?: string | null
  vehicleType?: string | null
}

interface DeleteVehicleModalProps {
  isOpen: boolean
  vehicle: DeleteVehicle | null
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function DeleteVehicleModal({ isOpen, vehicle, onCancel, onConfirm, loading = false }: DeleteVehicleModalProps) {
  if (!isOpen || !vehicle) return null

  const typeIcon: Record<string, string> = { sedan: '🚗', suv: '🚙', van: '🚐', luxury: '🚘', bus: '🚌' }
  const icon = typeIcon[(vehicle.vehicleType || 'sedan')] || '🚗'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-red-200 dark:border-red-800 bg-linear-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Confirmer la suppression</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cette action est irréversible</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-slate-700 dark:text-slate-300 mb-4">Êtes-vous sûr de vouloir supprimer ce véhicule ?</p>

          <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-slate-50 dark:bg-slate-900/40 p-4">
            <div className="flex items-center gap-4">
              {vehicle.photo ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <Image src={vehicle.photo} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-3xl">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">{vehicle.make} {vehicle.model}</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{vehicle.plateNumber}</span>
                  <span>•</span>
                  <span>{vehicle.year}</span>
                  <span>•</span>
                  <span>{vehicle.capacity} places</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-200 text-sm">
            <strong className="font-semibold">Attention :</strong> Toutes les données associées à ce véhicule seront définitivement perdues.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 bg-slate-50 dark:bg-slate-900/40">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition"
          >
            ❌ Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-xl text-white font-semibold bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg disabled:opacity-60"
          >
            {loading ? 'Suppression…' : '🗑️ Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  )
}


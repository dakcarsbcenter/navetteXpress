"use client"

import Image from "next/image"
import { Warning, Car } from "@phosphor-icons/react"

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={onCancel} />

      <div className="relative w-full max-w-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid #E2DACD' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '4px', backgroundColor: 'rgba(184,73,60,.10)', border: '1px solid rgba(184,73,60,.25)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Warning size={20} weight="bold" style={{ color: '#B8493C' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#12100E' }}>Confirmer la suppression</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#6E6A63' }}>Cette action est irréversible</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: '#3d3a35' }}>Êtes-vous sûr de vouloir supprimer ce véhicule ?</p>

          <div style={{ border: '1px solid #E2DACD', borderRadius: '3px', backgroundColor: '#F7F3EC', padding: '14px' }}>
            <div className="flex items-center gap-4">
              {vehicle.photo ? (
                <div className="relative" style={{ width: '64px', height: '64px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={vehicle.photo} alt={`${vehicle.make} ${vehicle.model}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Car size={26} style={{ color: '#6E6A63' }} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#12100E' }} className="truncate">{vehicle.make} {vehicle.model}</div>
                <div className="flex items-center gap-2" style={{ marginTop: '4px', fontSize: '12px', color: '#6E6A63' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', padding: '2px 8px', borderRadius: '2px' }}>{vehicle.plateNumber}</span>
                  <span>{vehicle.year}</span>
                  <span>{vehicle.capacity} places</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px', border: '1px solid rgba(180,100,58,.3)', backgroundColor: 'rgba(180,100,58,.06)', borderRadius: '3px', padding: '10px 12px', fontSize: '12.5px', color: '#8a5a3d' }}>
            <strong style={{ color: '#B4643A' }}>Attention :</strong> toutes les données associées à ce véhicule seront définitivement perdues.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3" style={{ padding: '0 24px 24px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ flex: 1, height: '42px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2"
            style={{ flex: 1, height: '42px', backgroundColor: '#B8493C', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,.35)', borderTopColor: '#FFFFFF' }} />
            ) : (
              'Supprimer définitivement'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

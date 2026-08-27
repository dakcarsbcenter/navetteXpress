"use client"

import { useEffect, useState } from "react"
import { Warning, User, EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName?: string
  userEmail?: string
  userRole?: string
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrateur', color: '#B8493C' },
  manager: { label: 'Manager', color: '#B4643A' },
  driver: { label: 'Chauffeur', color: '#1F5245' },
  customer: { label: 'Client', color: '#6E6A63' },
}

const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const iconBoxStyle: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', display: 'grid', placeItems: 'center', flexShrink: 0 }
const fieldLabelStyle: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6A63' }

export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName = "cet utilisateur",
  userEmail,
  userRole
}: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setConfirmText("")
    } else {
      document.body.style.overflow = 'unset'
      setConfirmText("")
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setIsConfirming(false)
      setConfirmText("")
    }
  }

  const isConfirmValid = confirmText.toLowerCase() === "supprimer"
  const roleMeta = userRole ? ROLE_META[userRole] : undefined

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={onClose} />

      <div className="relative w-full max-w-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
          <div className="mx-auto" style={{ width: '52px', height: '52px', borderRadius: '4px', backgroundColor: 'rgba(184,73,60,.10)', border: '1px solid rgba(184,73,60,.25)', display: 'grid', placeItems: 'center', marginBottom: '14px' }}>
            <Warning size={24} weight="bold" style={{ color: '#B8493C' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>
            Supprimer l&apos;utilisateur
          </h3>
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(184,73,60,.06)', borderLeft: '3px solid #B8493C', borderRadius: '3px', padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, color: '#B8493C' }}>Action irréversible</p>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#8a5a3d' }}>
              Cette action supprimera définitivement l&apos;utilisateur et toutes ses données associées.
            </p>
          </div>

          <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={rowStyle}>
              <div style={iconBoxStyle}>
                <User size={15} style={{ color: '#6E6A63' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={fieldLabelStyle}>Nom</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>{userName}</p>
              </div>
            </div>

            {userEmail && (
              <div style={rowStyle}>
                <div style={iconBoxStyle}>
                  <EnvelopeSimple size={15} style={{ color: '#6E6A63' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={fieldLabelStyle}>Email</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: '#12100E' }} className="truncate">{userEmail}</p>
                </div>
              </div>
            )}

            {roleMeta && (
              <div style={rowStyle}>
                <div style={iconBoxStyle}>
                  <ShieldCheck size={15} style={{ color: '#6E6A63' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={fieldLabelStyle}>Rôle</p>
                  <span
                    className="inline-block"
                    style={{ marginTop: '4px', padding: '2px 9px', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: `${roleMeta.color}15`, color: roleMeta.color }}
                  >
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: '#3d3a35', marginBottom: '8px' }}>
              Pour confirmer, tapez <strong style={{ color: '#B8493C' }}>supprimer</strong>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez 'supprimer' pour confirmer"
              autoComplete="off"
              style={{ width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E' }}
            />
          </div>

          <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63', backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '10px 12px', lineHeight: 1.5 }}>
            Les données suivantes seront également supprimées : historique des réservations, préférences utilisateur, et toutes les informations personnelles.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3" style={{ padding: '0 24px 24px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            style={{ flex: 1, height: '42px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isConfirming ? 0.5 : 1 }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isConfirming}
            className="flex items-center justify-center gap-2"
            style={{
              flex: 1, height: '42px', border: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600,
              cursor: isConfirmValid && !isConfirming ? 'pointer' : 'not-allowed',
              backgroundColor: isConfirmValid ? '#B8493C' : '#E2DACD',
              color: isConfirmValid ? '#FFFFFF' : '#9a938a',
            }}
          >
            {isConfirming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,.35)', borderTopColor: '#FFFFFF' }} />
            ) : (
              "Supprimer définitivement"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

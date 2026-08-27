import React, { useState } from 'react'
import { Warning as AlertTriangle, Trash } from '@phosphor-icons/react'

interface BulkDeleteModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    count: number
    resourceName: string
}

export function BulkDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    count,
    resourceName
}: BulkDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        setIsDeleting(true)
        try {
            await onConfirm()
        } finally {
            setIsDeleting(false)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(18,16,14,.55)" }}
                onClick={!isDeleting ? onClose : undefined}
            />
            <div
                className="relative w-full max-w-sm overflow-hidden"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }}
            >
                <div className="p-6 text-center">
                    <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center"
                        style={{ backgroundColor: "rgba(184,73,60,.10)", border: "1px solid rgba(184,73,60,.25)", borderRadius: "4px" }}
                    >
                        <AlertTriangle size={26} style={{ color: "#B8493C" }} weight="fill" />
                    </div>

                    <h3 className="mb-2 text-[17px] font-semibold" style={{ color: "#12100E", letterSpacing: "-0.01em" }}>
                        Suppression multiple
                    </h3>

                    <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: "#3d3a35" }}>
                        Vous êtes sur le point de supprimer de façon permanente{" "}
                        <strong style={{ color: "#12100E" }}>{count} {resourceName}</strong>.
                        Cette action est irréversible et supprimera toutes les données associées.
                    </p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-50"
                            style={{ border: "1px solid #E2DACD", borderRadius: "3px", color: "#6E6A63", fontFamily: "var(--font-mono)" }}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="flex flex-1 items-center justify-center gap-2 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors disabled:opacity-50"
                            style={{ backgroundColor: "#B8493C", border: "none", borderRadius: "3px", fontFamily: "var(--font-mono)" }}
                        >
                            {isDeleting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,.35)", borderTopColor: "#FFFFFF" }} />
                            ) : (
                                <>
                                    <Trash size={15} />
                                    Confirmer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

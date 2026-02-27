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
                className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-sm"
                onClick={!isDeleting ? onClose : undefined}
            />
            <div className="relative w-full max-w-sm bg-[#12121A] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <AlertTriangle size={32} className="text-red-500" weight="fill" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        Suppression Multiple
                    </h3>

                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        Vous êtes sur le point de supprimer de façon permanente <strong className="text-white">{count} {resourceName}</strong>.
                        Cette action est irréversible et supprimera toutes les données associées.
                    </p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                                <>
                                    <Trash size={16} />
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

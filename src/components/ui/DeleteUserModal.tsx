"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, X, User, Mail, Shield } from "lucide-react"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName?: string
  userEmail?: string
  userRole?: string
}

export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName = "cet utilisateur",
  userEmail,
  userRole
}: DeleteUserModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => setIsVisible(true), 10)
      setConfirmText("")
    } else {
      document.body.style.overflow = 'unset'
      setIsVisible(false)
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

  const getRoleBadgeColor = (role?: string) => {
    switch(role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'driver':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'customer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'admin': return 'Administrateur'
      case 'driver': return 'Chauffeur'
      case 'customer': return 'Client'
      default: return role || 'Utilisateur'
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop amélioré avec effet blur */}
      <div 
        className={`fixed inset-0 backdrop-blur-sm transition-all duration-300 ${
          isVisible ? 'bg-black/70' : 'bg-black/0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all duration-300 w-full max-w-md border border-red-200 dark:border-red-900/50 ${
            isVisible 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Header avec gradient rouge */}
          <div className="relative bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 px-6 pt-6 pb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Icon d'alerte animé */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
                <div className="relative bg-red-500 dark:bg-red-600 rounded-full p-4 shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Supprimer l&apos;utilisateur
            </h3>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Avertissement */}
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                ⚠️ Action irréversible
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Cette action supprimera définitivement l&apos;utilisateur et toutes ses données associées.
              </p>
            </div>

            {/* Informations utilisateur */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Nom</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
                </div>
              </div>

              {userEmail && (
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userEmail}</p>
                  </div>
                </div>
              )}

              {userRole && (
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rôle</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(userRole)}`}>
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation par saisie */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pour confirmer, tapez <span className="font-bold text-red-600 dark:text-red-400">supprimer</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez 'supprimer' pour confirmer"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                autoComplete="off"
              />
            </div>

            {/* Note additionnelle */}
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg">
              <p className="flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>Les données suivantes seront également supprimées : historique des réservations, préférences utilisateur, et toutes les informations personnelles.</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirming}
                className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isConfirmValid || isConfirming}
                className={`flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isConfirmValid 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform hover:scale-105' 
                    : 'bg-gray-400 dark:bg-gray-600'
                }`}
              >
                {isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Suppression...
                  </span>
                ) : (
                  "Supprimer définitivement"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { ModernUsersManagement } from "@/components/admin/ModernUsersManagement"

interface UserPermissions {
  [resource: string]: string[]
}

export function ClientUsersManagement() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserPermissions()
  }, [])

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions')
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || {})
      }
    } catch (err) {
      console.error("Erreur lors du chargement des permissions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier si l'utilisateur a au moins une permission sur les utilisateurs
  const hasUsersPermission = 
    userPermissions.users?.includes('read') ||
    userPermissions.users?.includes('create') ||
    userPermissions.users?.includes('update') ||
    userPermissions.users?.includes('delete')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasUsersPermission) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
              Accès refusé
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header avec informations sur les permissions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Vos permissions actuelles
            </h4>
            <div className="flex flex-wrap gap-2">
              {userPermissions.users?.map((permission) => (
                <span 
                  key={permission}
                  className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium"
                >
                  <span>•</span>
                  {permission === 'manage' && '⚡ Gestion complète'}
                  {permission === 'read' && '👁️ Lecture'}
                  {permission === 'create' && '➕ Création'}
                  {permission === 'update' && '✏️ Modification'}
                  {permission === 'delete' && '🗑️ Suppression'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Composant de gestion des utilisateurs */}
      <ModernUsersManagement userPermissions={userPermissions} />
    </div>
  )
}

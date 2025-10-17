"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"

// Définition des permissions composées
const COMPOSED_PERMISSIONS = {
  manage: {
    label: 'Gérer',
    description: 'Créer, lire, modifier, supprimer',
    icon: '⚡',
    actions: ['create', 'read', 'update', 'delete']
  },
  read: {
    label: 'Lire',
    description: 'Lecture seule',
    icon: '👁️',
    actions: ['read']
  },
  update: {
    label: 'Modifier',
    description: 'Modification uniquement',
    icon: '✏️',
    actions: ['update']
  },
  delete: {
    label: 'Supprimer',
    description: 'Suppression uniquement',
    icon: '🗑️',
    actions: ['delete']
  }
}

// Ressources disponibles
const RESOURCES = [
  { name: 'users', label: 'Utilisateurs', icon: '👥' },
  { name: 'vehicles', label: 'Véhicules', icon: '🚗' },
  { name: 'bookings', label: 'Réservations', icon: '📅' },
  { name: 'quotes', label: 'Devis', icon: '📋' },
  { name: 'reviews', label: 'Avis', icon: '⭐' }
]

interface RolePermissions {
  [resource: string]: string[]
}

interface Role {
  name: string
  label: string
  icon: string
  userCount: number
}

export function ComposedPermissionsMatrix() {
  const { data: session } = useSession()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Record<string, RolePermissions>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Récupérer les rôles
      const rolesRes = await fetch('/api/admin/roles')
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        console.log('Rôles récupérés:', rolesData)
        
        // L'API retourne { success: true, data: [...] }
        const rolesList = rolesData.data || rolesData.roles || []
        console.log('Liste des rôles:', rolesList)
        
        // Transformer en format simple pour l'affichage
        const rolesFormatted = rolesList.map((role: any) => ({
          name: role.name,
          label: role.displayName || role.name,
          icon: getRoleIcon(role.name),
          userCount: role.userCount || 0
        }))
        
        setRoles(rolesFormatted)
        
        // Récupérer les permissions pour chaque rôle
        const permissionsData: Record<string, RolePermissions> = {}
        
        for (const role of rolesList) {
          const permRes = await fetch(`/api/admin/permissions/composed?role=${role.name}`)
          if (permRes.ok) {
            const data = await permRes.json()
            console.log(`Permissions pour ${role.name}:`, data)
            permissionsData[role.name] = data.permissions || {}
          }
        }
        
        console.log('Toutes les permissions:', permissionsData)
        setPermissions(permissionsData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      showError('Erreur lors du chargement des permissions')
    } finally {
      setIsLoading(false)
    }
  }
  
  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, string> = {
      'admin': '👑',
      'manager': '🎯',
      'customer': '👤',
      'driver': '🚗'
    }
    return icons[roleName] || '👤'
  }

  const hasComposedPermission = (roleName: string, resource: string, composedPerm: string): boolean => {
    const rolePerms = permissions[roleName]?.[resource] || []
    
    // Si c'est "manage", vérifier si toutes les actions sont présentes
    if (composedPerm === 'manage') {
      const requiredActions = ['create', 'read', 'update', 'delete']
      return requiredActions.every(action => rolePerms.includes(action))
    }
    
    // Pour les autres, vérifier l'action spécifique
    return rolePerms.includes(composedPerm)
  }

  const togglePermission = async (roleName: string, resource: string, composedPerm: string) => {
    const currentState = hasComposedPermission(roleName, resource, composedPerm)
    
    console.log('🔧 Toggle permission:', { roleName, resource, composedPerm, currentState })
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/permissions/composed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName,
          resource,
          composedPermission: composedPerm,
          enabled: !currentState
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Response:', result)
        showSuccess(`Permission ${!currentState ? 'activée' : 'désactivée'}`)
        // Recharger les permissions
        await fetchData()
      } else {
        const error = await response.json()
        console.error('❌ API Error:', error)
        showError(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      showError('Erreur lors de la mise à jour de la permission')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <NotificationCenter 
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Matrice des Permissions</h1>
        <p className="text-blue-100">
          Contrôlez l'accès et les droits de vos utilisateurs
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">
              🔧
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{roles.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Rôles totaux</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
              🔐
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{RESOURCES.length * 4}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Permissions</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {roles.reduce((sum, role) => sum + (role.userCount || 0), 0)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{RESOURCES.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Ressources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matrice */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Vue d'ensemble des permissions par rôle
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Cliquez sur les cases pour activer/désactiver les permissions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white sticky left-0 bg-slate-50 dark:bg-slate-900/50 z-20 min-w-[250px]">
                  Permissions
                </th>
                {roles.map((role) => (
                  <th key={role.name} className="px-4 py-4 text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl">{role.icon}</div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white">
                        {role.label || role.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {role.userCount || 0} utilisateur{(role.userCount || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {RESOURCES.map((resource) => (
                <React.Fragment key={resource.name}>
                  {/* En-tête de ressource */}
                  <tr className="bg-slate-100 dark:bg-slate-800/50">
                    <td 
                      colSpan={roles.length + 1} 
                      className="px-6 py-3 sticky left-0 z-10"
                    >
                      <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="text-xl">{resource.icon}</span>
                        <span className="uppercase text-sm tracking-wide">{resource.label}</span>
                      </div>
                    </td>
                  </tr>

                  {/* Permissions composées pour cette ressource */}
                  {Object.entries(COMPOSED_PERMISSIONS).map(([key, perm]) => (
                    <tr 
                      key={`${resource.name}-${key}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 sticky left-0 bg-white dark:bg-slate-800 z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{perm.icon}</span>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {perm.label} {resource.label.toLowerCase()}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {perm.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      {roles.map((role) => {
                        const hasAccess = hasComposedPermission(role.name, resource.name, key)
                        
                        return (
                          <td key={role.name} className="px-4 py-4 text-center">
                            <button
                              onClick={() => togglePermission(role.name, resource.name, key)}
                              disabled={isSaving}
                              title={hasAccess ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}
                              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                                hasAccess
                                  ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30 scale-100'
                                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-green-400 hover:scale-105'
                              } ${
                                isSaving 
                                  ? 'opacity-50 cursor-wait' 
                                  : 'cursor-pointer hover:shadow-md'
                              }`}
                            >
                              {hasAccess && (
                                <svg 
                                  className="w-6 h-6 mx-auto" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={3} 
                                    d="M5 13l4 4L19 7" 
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <span className="text-xl">ℹ️</span>
          Types de permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(COMPOSED_PERMISSIONS).map(([key, perm]) => (
            <div key={key} className="flex items-start gap-3">
              <span className="text-2xl">{perm.icon}</span>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{perm.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{perm.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> La permission "Gérer" inclut toutes les actions (créer, lire, modifier, supprimer) 
            et donne accès aux données de tous les utilisateurs. Les autres permissions limitent l'accès aux propres données de l'utilisateur.
          </p>
        </div>
      </div>
    </div>
  )
}

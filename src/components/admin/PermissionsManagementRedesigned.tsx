"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import {
  Shield,
  Lock,
  Users,
  FileText,
  Plus,
  ArrowsCounterClockwise as RefreshCw,
  FloppyDisk as Save
} from "@phosphor-icons/react"

// Définition des permissions composées
const COMPOSED_PERMISSIONS = {
  manage: {
    label: 'Gérer',
    description: 'Créer, modifier, supprimer',
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
  }
}

// Ressources disponibles avec leurs permissions spécifiques
const RESOURCES = [
  {
    name: 'users',
    label: 'UTILISATEURS',
    icon: '👥',
    permissions: [
      { key: 'manage', label: 'Gérer utilisateurs', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire utilisateurs', description: 'Lecture seule' },
      { key: 'update', label: 'Modifier utilisateurs', description: 'Modification uniquement' }
    ]
  },
  {
    name: 'vehicles',
    label: 'VÉHICULES',
    icon: '🚗',
    permissions: [
      { key: 'manage', label: 'Gérer véhicules', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire véhicules', description: 'Consultation uniquement' },
      { key: 'update', label: 'Modifier véhicules', description: 'Modification statut' }
    ]
  },
  {
    name: 'bookings',
    label: 'RÉSERVATIONS',
    icon: '📅',
    permissions: [
      { key: 'manage', label: 'Gérer réservations', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire réservations', description: 'Consultation uniquement' },
      { key: 'update', label: 'Modifier réservations', description: 'Modification uniquement' }
    ]
  },
  {
    name: 'quotes',
    label: 'DEVIS',
    icon: '📋',
    permissions: [
      { key: 'manage', label: 'Gérer devis', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire devis', description: 'Consultation uniquement' }
    ]
  },
  {
    name: 'reviews',
    label: 'AVIS',
    icon: '⭐',
    permissions: [
      { key: 'manage', label: 'Gérer avis', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire avis', description: 'Consultation uniquement' }
    ]
  },
  {
    name: 'profile',
    label: 'PROFIL',
    icon: '👤',
    permissions: [
      { key: 'read', label: 'Lire profil', description: 'Voir son propre profil' },
      { key: 'update', label: 'Modifier profil', description: 'Modifier son propre profil' }
    ]
  }
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

export default function PermissionsManagementRedesigned() {
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
      console.log('🔍 Chargement des rôles et permissions...')

      // Récupérer les rôles
      const rolesRes = await fetch('/api/admin/roles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!rolesRes.ok) {
        throw new Error(`HTTP error! status: ${rolesRes.status}`)
      }

      const rolesData = await rolesRes.json()
      const rolesList = rolesData.data || rolesData.roles || []

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
        const permRes = await fetch(`/api/admin/permissions/composed?role=${role.name}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        })

        if (!permRes.ok) {
          console.error(`❌ HTTP Error (permissions ${role.name}):`, permRes.status)
          continue
        }

        const data = await permRes.json()
        permissionsData[role.name] = data.permissions || {}
      }

      setPermissions(permissionsData)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des permissions:', error)
      showError('Impossible de charger les permissions.')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, string> = {
      'admin': '👑',
      'manager': '💼',
      'customer': '👤',
      'driver': '🚗',
      'client': '👤'
    }
    return icons[roleName] || '👤'
  }

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      'admin': { bg: 'bg-red-50', icon: 'bg-red-100', text: 'text-red-700' },
      'manager': { bg: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-700' },
      'driver': { bg: 'bg-blue-50', icon: 'bg-blue-100', text: 'text-blue-700' },
      'customer': { bg: 'bg-gray-50', icon: 'bg-gray-100', text: 'text-gray-700' },
      'client': { bg: 'bg-gray-50', icon: 'bg-gray-100', text: 'text-gray-700' }
    }
    return colors[roleName] || colors.client
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
        showSuccess(`Permission ${!currentState ? 'activée' : 'désactivée'}`)
        await fetchData()
      } else {
        const error = await response.json()
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const totalRoles = roles.length
  const totalPermissions = RESOURCES.reduce((sum, res) => sum + res.permissions.length, 0)
  const totalUsers = roles.reduce((sum, role) => sum + (role.userCount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Matrice des Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">Définissez précisément les accès pour chaque rôle.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
              <span className="text-lg">⚡</span>
              Créer
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <span className="text-lg">👁️</span>
              Lire
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <span className="text-lg">✏️</span>
              Modifier
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              <span className="text-lg">🗑️</span>
              Supprimer
            </button>
            <button
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-2"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">RÔLES TOTAUX</div>
                <div className="text-3xl font-bold text-gray-900">{totalRoles}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-700 mb-1">PERMISSIONS</div>
                <div className="text-3xl font-bold text-blue-600">{totalPermissions}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 mb-1">UTILISATEURS</div>
                <div className="text-3xl font-bold text-green-600">{totalUsers}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-700 mb-1">RESSOURCES</div>
                <div className="text-3xl font-bold text-orange-600">{RESOURCES.length}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Column Headers */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5">
                <h3 className="text-sm font-semibold text-gray-600 uppercase">Permissions</h3>
              </div>
              <div className="col-span-7 grid grid-cols-4 gap-4">
                {roles.map((role) => {
                  const colors = getRoleColor(role.name)
                  return (
                    <div key={role.name} className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colors.icon} mb-2`}>
                        <span className="text-2xl">{role.icon}</span>
                      </div>
                      <div className={`text-sm font-semibold ${colors.text} capitalize`}>
                        {role.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {role.userCount} util.
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Permission Rows */}
          <div className="divide-y divide-gray-200">
            {RESOURCES.map((resource) => (
              <div key={resource.name}>
                {/* Module Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{resource.icon}</span>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {resource.label}
                    </span>
                  </div>
                </div>

                {/* Permissions for this resource */}
                {resource.permissions.map((perm) => (
                  <div key={`${resource.name}-${perm.key}`} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{COMPOSED_PERMISSIONS[perm.key as keyof typeof COMPOSED_PERMISSIONS]?.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{perm.label}</div>
                            <div className="text-sm text-gray-500">{perm.description}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-7 grid grid-cols-4 gap-4">
                        {roles.map((role) => {
                          const isEnabled = hasComposedPermission(role.name, resource.name, perm.key)

                          return (
                            <div key={role.name} className="flex justify-center">
                              <button
                                onClick={() => togglePermission(role.name, resource.name, perm.key)}
                                disabled={isSaving}
                                className={`
                                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                  ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}
                                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
                                `}
                              >
                                <span
                                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                                    ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                  `}
                                />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

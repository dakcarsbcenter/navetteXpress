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
  FloppyDisk as Save,
  Crown,
  Briefcase,
  User,
  Car,
  Lightning,
  Eye,
  PencilSimple,
  Calendar,
  ClipboardText,
  Star,
  UserCircle
} from "@phosphor-icons/react"

// Définition des permissions composées
const COMPOSED_PERMISSIONS = {
  manage: {
    label: 'Gérer',
    description: 'Créer, modifier, supprimer',
    icon: <Lightning size={18} weight="fill" />,
    actions: ['create', 'read', 'update', 'delete']
  },
  read: {
    label: 'Lire',
    description: 'Lecture seule',
    icon: <Eye size={18} weight="fill" />,
    actions: ['read']
  },
  update: {
    label: 'Modifier',
    description: 'Modification uniquement',
    icon: <PencilSimple size={18} weight="fill" />,
    actions: ['update']
  }
}

// Ressources disponibles avec leurs permissions spécifiques
const RESOURCES = [
  {
    name: 'users',
    label: 'UTILISATEURS',
    icon: <Users size={20} weight="fill" />,
    permissions: [
      { key: 'manage', label: 'Gérer utilisateurs', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire utilisateurs', description: 'Lecture seule' },
      { key: 'update', label: 'Modifier utilisateurs', description: 'Modification uniquement' }
    ]
  },
  {
    name: 'vehicles',
    label: 'VÉHICULES',
    icon: <Car size={20} weight="fill" />,
    permissions: [
      { key: 'manage', label: 'Gérer véhicules', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire véhicules', description: 'Consultation uniquement' },
      { key: 'update', label: 'Modifier véhicules', description: 'Modification statut' }
    ]
  },
  {
    name: 'bookings',
    label: 'RÉSERVATIONS',
    icon: <Calendar size={20} weight="fill" />,
    permissions: [
      { key: 'manage', label: 'Gérer réservations', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire réservations', description: 'Consultation uniquement' },
      { key: 'update', label: 'Modifier réservations', description: 'Modification uniquement' }
    ]
  },
  {
    name: 'quotes',
    label: 'DEVIS',
    icon: <ClipboardText size={20} weight="fill" />,
    permissions: [
      { key: 'manage', label: 'Gérer devis', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire devis', description: 'Consultation uniquement' }
    ]
  },
  {
    name: 'reviews',
    label: 'AVIS',
    icon: <Star size={20} weight="fill" />,
    permissions: [
      { key: 'manage', label: 'Gérer avis', description: 'Créer, modifier, supprimer' },
      { key: 'read', label: 'Lire avis', description: 'Consultation uniquement' }
    ]
  },
  {
    name: 'profile',
    label: 'PROFIL',
    icon: <UserCircle size={20} weight="fill" />,
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
  icon: React.ReactNode
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
      showError('Impossible de charger les permissions.', 'Erreur technique')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'admin': <Crown weight="fill" />,
      'manager': <Briefcase weight="fill" />,
      'customer': <User weight="fill" />,
      'driver': <Car weight="fill" />,
      'client': <User weight="fill" />
    }
    return icons[roleName] || <User weight="fill" />
  }

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      'admin': { bg: 'bg-red-500/10', icon: 'bg-red-500/20', text: 'text-red-500' },
      'manager': { bg: 'bg-purple-500/10', icon: 'bg-purple-500/20', text: 'text-purple-400' },
      'driver': { bg: 'bg-blue-500/10', icon: 'bg-blue-500/20', text: 'text-blue-400' },
      'customer': { bg: 'bg-gray-500/10', icon: 'bg-gray-500/20', text: 'text-gray-400' },
      'client': { bg: 'bg-gray-500/10', icon: 'bg-gray-500/20', text: 'text-gray-400' }
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
        showSuccess(`Permission ${!currentState ? 'activée' : 'désactivée'}`, 'Succès')
        await fetchData()
      } else {
        const error = await response.json()
        showError(error.error || 'Erreur lors de la mise à jour', 'Échec')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      showError('Erreur lors de la mise à jour de la permission', 'Erreur technique')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
      </div>
    )
  }

  const totalRoles = roles.length
  const totalPermissions = RESOURCES.reduce((sum, res) => sum + res.permissions.length, 0)
  const totalUsers = roles.reduce((sum, role) => sum + (role.userCount || 0), 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main Header Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div>
            <h1 className="text-2xl font-bold text-white">Matrice des Permissions</h1>
            <p className="text-xs text-slate-500 mt-1">Définissez précisément les accès pour chaque rôle.</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-2">
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all whitespace-nowrap">
              <Lightning size={16} weight="fill" />
              Créer
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all whitespace-nowrap">
              <Eye size={16} weight="fill" />
              Lire
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all whitespace-nowrap">
              <PencilSimple size={16} weight="fill" />
              Modifier
            </button>

            <div className="flex-1"></div>

            <button
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/10 whitespace-nowrap"
            >
              <Save size={16} />
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {[
          { label: 'Rôles Totaux', value: totalRoles, color: 'var(--color-gold)', icon: <Shield size={20} /> },
          { label: 'Permissions', value: totalPermissions, color: '#3B82F6', icon: <Lock size={20} /> },
          { label: 'Utilisateurs', value: totalUsers, color: '#10B981', icon: <Users size={20} /> },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: 'var(--color-dash-card)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Column Headers */}
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 w-1/4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ressources & Accès</h3>
                </th>
                <th className="px-6 py-4 w-3/4">
                  <div className="grid grid-cols-4 gap-4">
                    {roles.map((role) => {
                      const colors = getRoleColor(role.name)
                      return (
                        <div key={role.name} className="flex flex-col items-center justify-center text-center">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl border border-white/5 ${colors.icon} mb-2`}>
                            <span className={`text-xl ${colors.text}`}>{role.icon}</span>
                          </div>
                          <div className={`text-[10px] uppercase tracking-widest font-bold ${colors.text}`}>
                            {role.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            {role.userCount} utils.
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </th>
              </tr>
            </thead>

            {/* Permission Rows */}
            <tbody className="divide-y divide-white/[0.02]">
              {RESOURCES.map((resource) => (
                <React.Fragment key={resource.name}>
                  {/* Module Header Row */}
                  <tr className="bg-white/[0.01]">
                    <td colSpan={2} className="px-6 py-3 border-b border-white/5 border-t border-t-white/10">
                      <div className="flex items-center gap-2 text-gold">
                        <span className="opacity-90">{resource.icon}</span>
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
                          {resource.label}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Permissions for this resource */}
                  {resource.permissions.map((perm) => (
                    <tr key={`${resource.name}-${perm.key}`} className="hover:bg-white/[0.01] transition-colors group border-b border-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-slate-400 group-hover:text-gold transition-colors">
                            {COMPOSED_PERMISSIONS[perm.key as keyof typeof COMPOSED_PERMISSIONS]?.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{perm.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{perm.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-4 gap-4">
                          {roles.map((role) => {
                            const isEnabled = hasComposedPermission(role.name, resource.name, perm.key)

                            return (
                              <div key={role.name} className="flex justify-center">
                                <button
                                  onClick={() => togglePermission(role.name, resource.name, perm.key)}
                                  disabled={isSaving}
                                  className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
                                    ${isEnabled ? 'bg-gold shadow-[0_0_10px_rgba(201,168,76,0.3)]' : 'bg-white/10'}
                                    ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
                                  `}
                                >
                                  <span
                                    className={`
                                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm
                                      ${isEnabled ? 'translate-x-[22px]' : 'translate-x-1 opacity-70'}
                                    `}
                                  />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

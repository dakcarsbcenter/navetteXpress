"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Edit, Trash2, MoreVertical } from "lucide-react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import { ImageUploader } from "@/components/ImageUploader"

interface Permission {
  id: number
  name: string
  description: string
  category: string
  resource: string
  action: string
  isActive: boolean
  createdAt: string
}

interface Role {
  id: number
  name: string
  description: string
  color: string
  level: number
  permissions: Permission[]
  userCount: number
  isSystem: boolean
  createdAt: string
}

interface User {
  id: number
  name: string
  email: string
  photo?: string
  role: Role
  isActive: boolean
  lastLogin: string | null
}

export function ModernPermissionsManagement() {
  const { data: session, status } = useSession()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'matrix' | 'roles' | 'users'>('matrix')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    role: 'customer',
    licenseNumber: ''
  })
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    role: 'customer',
    licenseNumber: ''
  })
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    resource: '',
    level: '',
    status: 'active'
  })

  useEffect(() => {
    if (status === 'loading') return // Attendre que la session se charge
    if (status === 'unauthenticated') {
      showError('Vous devez être connecté pour accéder à cette page')
      return
    }
    if (session?.user && 'role' in session.user && session.user.role === 'admin') {
      fetchData()
    } else {
      showError('Accès refusé. Vous devez être administrateur.')
    }
  }, [session, status])

  const fetchData = async () => {
    try {
      console.log('🔄 Chargement des données...')

      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        fetch('/api/admin/roles', {
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/permissions', {
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/users', {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      ])

      console.log('📡 Réponses API:', {
        roles: rolesRes.status,
        permissions: permissionsRes.status, 
        users: usersRes.status
      })

      // Gérer les erreurs individuelles
      if (!rolesRes.ok) {
        console.error('❌ Erreur API roles:', rolesRes.status, rolesRes.statusText)
        const errorText = await rolesRes.text()
        console.error('Détails erreur roles:', errorText)
      }
      if (!permissionsRes.ok) {
        console.error('❌ Erreur API permissions:', permissionsRes.status, permissionsRes.statusText)
        const errorText = await permissionsRes.text()
        console.error('Détails erreur permissions:', errorText)
      }
      if (!usersRes.ok) {
        console.error('❌ Erreur API users:', usersRes.status, usersRes.statusText)
        const errorText = await usersRes.text()
        console.error('Détails erreur users:', errorText)
      }
      
      // Ne traiter que les réponses OK
      const rolesData = rolesRes.ok ? await rolesRes.json() : { success: false, data: [] }
      const permissionsData = permissionsRes.ok ? await permissionsRes.json() : { success: false, data: [] }
      const usersData = usersRes.ok ? await usersRes.json() : { success: false, data: [] }
      
      if (rolesData.success) setRoles(rolesData.data)
      if (permissionsData.success) setPermissions(permissionsData.data)
      if (usersData.success) {
        // Transformer les données utilisateurs pour convertir role (string) en objet Role
        const transformedUsers = usersData.data.map((user: any) => {
          // Trouver le rôle correspondant dans la liste des rôles
          const roleObj = rolesData.success 
            ? rolesData.data.find((r: any) => r.name === user.role)
            : null
          
          return {
            ...user,
            role: roleObj || {
              id: user.role === 'admin' ? 1 : user.role === 'driver' ? 2 : 3,
              name: user.role,
              description: `Rôle ${user.role}`,
              color: '#6b7280',
              level: 1,
              permissions: [],
              userCount: 0,
              isSystem: true,
              createdAt: new Date().toISOString()
            },
            lastLogin: user.lastLogin || null
          }
        })
        setUsers(transformedUsers)
      }
      
      console.log('✅ Données chargées avec succès')
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
      showError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: Role) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'driver': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'client': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'guest': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
    return colors[role.name as keyof typeof colors] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
  }

  const getRoleIcon = (roleName: string) => {
    const icons = {
      'super_admin': '👑',
      'admin': '⚡',
      'driver': '🚗',
      'client': '👤',
      'guest': '👁️'
    }
    return icons[roleName as keyof typeof icons] || '🔧'
  }

  const getPermissionCategories = () => {
    const categories = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = []
      }
      acc[perm.category].push(perm)
      return acc
    }, {} as Record<string, Permission[]>)
    
    return Object.entries(categories).map(([name, perms]) => ({
      name,
      permissions: perms,
      icon: getCategoryIcon(name)
    }))
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Utilisateurs': '👥',
      'Réservations': '📅',
      'Devis': '💰',
      'Flotte': '🚗',
      'Système': '⚙️',
      'Rapports': '📊',
      'Finances': '💳',
      'Support': '🎧',
      'Profil': '👤',
      'users': '👥',
      'bookings': '📅',
      'quotes': '💰',
      'vehicles': '🚗',
      'profile': '👤',
      'reviews': '⭐'
    }
    return icons[category as keyof typeof icons] || '🔧'
  }

  const hasPermission = (role: Role, permission: Permission) => {
    return role.permissions.some(p => p.id === permission.id)
  }

  const toggleRolePermission = async (roleId: number, permissionId: number, hasAccess: boolean) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          permissionId, 
          action: hasAccess ? 'remove' : 'add' 
        })
      })
      
      if (response.ok) {
        await fetchData()
        showSuccess(
          `Permission ${hasAccess ? 'retirée' : 'accordée'} avec succès`,
          'Mise à jour réussie'
        )
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour des permissions', 'Erreur')
    }
  }

  const createUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserForm,
          password: 'defaultPassword123'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchData()
        setShowCreateUserModal(false)
        setNewUserForm({
          name: '',
          email: '',
          phone: '',
          photo: '',
          role: 'customer',
          licenseNumber: ''
        })
        showSuccess('Utilisateur créé avec succès', 'Création réussie')
      } else {
        throw new Error(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      showError('Erreur lors de la création de l\'utilisateur', 'Erreur')
    }
  }

  const handleCreateRole = async () => {
    try {
      // Validation
      if (!newRoleForm.name.trim()) {
        showError('Le nom du rôle est obligatoire', 'Validation')
        return
      }

      await createRole({
        name: newRoleForm.name.toLowerCase().replace(/\s+/g, '_'),
        description: newRoleForm.description,
        permissions: []
      } as Partial<Role>)
      
      setShowCreateRoleModal(false)
      setNewRoleForm({
        name: '',
        description: '',
        permissions: []
      })
    } catch (error) {
      showError('Erreur lors de la création du rôle', 'Erreur')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditUserForm({
      name: user.name,
      email: user.email,
      phone: '',
      photo: user.photo || '',
      role: user.role.name,
      licenseNumber: ''
    })
    setShowEditUserModal(true)
  }

  const editUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchData()
        setShowEditUserModal(false)
        setSelectedUser(null)
        showSuccess('Utilisateur modifié avec succès', 'Modification réussie')
      } else {
        throw new Error(result.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      showError('Erreur lors de la modification de l\'utilisateur', 'Erreur')
    }
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowDeleteUserModal(true)
  }

  const deleteUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchData()
        setShowDeleteUserModal(false)
        setSelectedUser(null)
        showSuccess('Utilisateur supprimé avec succès', 'Suppression réussie')
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showError('Erreur lors de la suppression de l\'utilisateur', 'Erreur')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         user.email.toLowerCase().includes(filters.search.toLowerCase())
    const matchesRole = !filters.category || user.role.name === filters.category
    const matchesStatus = !filters.status || 
                         (filters.status === 'active' ? user.isActive : !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getUniqueCategories = () => {
    const categories = [...new Set(roles.map(role => role.name))]
    return categories
  }

  const createRole = async (roleData: Partial<Role>) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
      })
      
      if (response.ok) {
        await fetchData()
        showSuccess('Nouveau rôle créé avec succès', 'Création réussie')
      }
    } catch (error) {
      showError('Erreur lors de la création du rôle', 'Erreur')
    }
  }

  const updateUserRole = async (userId: number, newRoleId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId })
      })
      
      if (response.ok) {
        await fetchData()
        showSuccess('Rôle utilisateur mis à jour', 'Mise à jour réussie')
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du rôle', 'Erreur')
    }
  }

  const getStats = () => {
    const totalRoles = roles.length
    const totalPermissions = permissions.length
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length
    const systemRoles = roles.filter(r => r.isSystem).length
    const customRoles = roles.filter(r => !r.isSystem).length
    
    return { totalRoles, totalPermissions, totalUsers, activeUsers, systemRoles, customRoles }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Vérification d'authentification
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-900/10 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-900/10 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Accès refusé</h2>
          <p className="text-slate-600 dark:text-slate-400">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  if (!session?.user || !('role' in session.user) || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-900/10 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Accès refusé</h2>
          <p className="text-slate-600 dark:text-slate-400">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  const stats = getStats()
  const categories = getPermissionCategories()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-900/10 dark:to-slate-900">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Gestion des permissions
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Contrôlez l'accès et les droits de vos utilisateurs
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Boutons de vue */}
              <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'matrix'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Matrice
                </button>
                <button
                  onClick={() => setViewMode('roles')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'roles'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Rôles
                </button>
                <button
                  onClick={() => setViewMode('users')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'users'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Utilisateurs
                </button>
              </div>
              
              {/* Boutons d'action selon la vue */}
              <div className="flex gap-3">
                {viewMode === 'users' && (
                  <button 
                    onClick={() => setShowCreateUserModal(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nouvel utilisateur
                  </button>
                )}
                
                <button 
                  onClick={() => setShowCreateRoleModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nouveau rôle
                </button>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalRoles}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Rôles totaux</p>
                </div>
                <div className="text-2xl">🔐</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.systemRoles}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Système</p>
                </div>
                <div className="text-2xl">⚙️</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.customRoles}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Personnalisés</p>
                </div>
                <div className="text-2xl">🎨</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalPermissions}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Permissions</p>
                </div>
                <div className="text-2xl">🔑</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Utilisateurs</p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Actifs</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtres additionnels avec options dynamiques */}
            {viewMode === 'users' && (
              <>
                {/* Filtre par rôle */}
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Tous les rôles</option>
                  {getUniqueCategories().map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                {/* Filtre par statut */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </>
            )}
            
            {viewMode === 'matrix' && (
              <>
                {['category', 'resource', 'level'].map((field) => {
                  const filterLabels = {
                    category: 'Toutes les catégories',
                    resource: 'Toutes les ressources', 
                    level: 'Tous les niveaux'
                  }
                  
                  return (
                    <select
                      key={field}
                      value={filters[field as keyof typeof filters]}
                      onChange={(e) => setFilters(prev => ({ ...prev, [field]: e.target.value }))}
                      className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">{filterLabels[field as keyof typeof filterLabels]}</option>
                    </select>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Vue Matrice des permissions */}
        {viewMode === 'matrix' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Matrice des permissions
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Vue d'ensemble des permissions par rôle
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white sticky left-0 bg-slate-50 dark:bg-slate-900/50 z-10">
                      Permissions
                    </th>
                    {roles.map((role) => (
                      <th key={role.id} className="px-4 py-4 text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-2xl">{getRoleIcon(role.name)}</div>
                          <span className="text-xs font-medium text-slate-900 dark:text-white">
                            {role.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {role.userCount} utilisateur{role.userCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {categories.map((category) => (
                    <React.Fragment key={category.name}>
                      {/* Ligne de catégorie */}
                      <tr className="bg-slate-25 dark:bg-slate-800/50">
                        <td className="px-6 py-3 sticky left-0 bg-slate-25 dark:bg-slate-800/50 z-10">
                          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                            <span className="text-lg">{category.icon}</span>
                            {category.name}
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className="px-4 py-3"></td>
                        ))}
                      </tr>
                      
                      {/* Lignes des permissions */}
                      {category.permissions.map((permission) => (
                        <tr key={permission.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 sticky left-0 bg-white dark:bg-slate-800 z-10">
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {permission.name}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {permission.description}
                              </div>
                            </div>
                          </td>
                          {roles.map((role) => {
                            const hasAccess = hasPermission(role, permission)
                            return (
                              <td key={role.id} className="px-4 py-4 text-center">
                                <button
                                  onClick={() => toggleRolePermission(role.id, permission.id, hasAccess)}
                                  disabled={role.isSystem && role.name === 'super_admin'}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    hasAccess
                                      ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-green-400'
                                  } ${
                                    role.isSystem && role.name === 'super_admin'
                                      ? 'cursor-not-allowed opacity-50'
                                      : 'cursor-pointer'
                                  }`}
                                >
                                  {hasAccess && (
                                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
        )}

        {/* Vue Rôles */}
        {viewMode === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getRoleIcon(role.name)}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {role.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Niveau {role.level}
                        </p>
                      </div>
                    </div>
                    {role.isSystem && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Système
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {role.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Utilisateurs</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {role.userCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Permissions</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {role.permissions.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRole(role)}
                        className="flex-1 text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Modifier
                      </button>
                      {!role.isSystem && (
                        <button className="text-sm text-red-600 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vue Utilisateurs */}
        {viewMode === 'users' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Gestion des utilisateurs
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Assignez des rôles aux utilisateurs
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Photo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Rôle actuel
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Dernière connexion
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-slate-500 dark:text-slate-400">
                          <svg className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                          <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                          <p className="text-sm mt-1">Essayez de modifier vos filtres de recherche</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            {user.photo ? (
                              <img
                                src={user.photo}
                                alt={`Photo de ${user.name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback en cas d'erreur de chargement
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  target.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`text-slate-500 dark:text-slate-400 text-sm font-medium ${user.photo ? 'hidden' : ''}`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role.name)} {user.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {user.isActive ? '✅ Actif' : '❌ Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('fr-FR')
                          : 'Jamais connecté'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role.id}
                            onChange={(e) => updateUserRole(user.id, parseInt(e.target.value))}
                            className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {getRoleIcon(role.name)} {role.name}
                              </option>
                            ))}
                          </select>
                          
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Modifier l'utilisateur"
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création d'utilisateur */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Nouvel utilisateur
                </h3>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="jean.dupont@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <ImageUploader
                    onUploadComplete={(url) => setNewUserForm(prev => ({ ...prev, photo: url }))}
                    currentImage={newUserForm.photo}
                    className="w-full"
                    label="Photo de l'utilisateur"
                    required={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rôle
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="customer">Client</option>
                    <option value="driver">Chauffeur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                {newUserForm.role === 'driver' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Numéro de permis (obligatoire pour chauffeurs)
                    </label>
                    <input
                      type="text"
                      value={newUserForm.licenseNumber}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                      placeholder="Ex: ABC123456"
                    />
                  </div>
                )}
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={createUser}
                  disabled={!newUserForm.name || !newUserForm.email || (newUserForm.role === 'driver' && !newUserForm.licenseNumber)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer l'utilisateur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de rôle */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Nouveau rôle
                </h3>
                <button
                  onClick={() => setShowCreateRoleModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nom du rôle
                  </label>
                  <input
                    type="text"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Ex: Gestionnaire, Support..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newRoleForm.description}
                    onChange={(e) => setNewRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white resize-none"
                    placeholder="Description du rôle et de ses responsabilités..."
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Fonctionnalité en développement
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        La création de nouveaux rôles personnalisés n'est pas encore supportée. Cette fonctionnalité sera disponible dans une prochaine version.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoleModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRole}
                    disabled={!newRoleForm.name.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-4 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    Créer le rôle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'utilisateur */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Modifier l'utilisateur
              </h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div>
                <ImageUploader
                  onUploadComplete={(url) => setEditUserForm(prev => ({ ...prev, photo: url }))}
                  currentImage={editUserForm.photo}
                  className="w-full"
                  label="Photo de l'utilisateur"
                  required={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rôle
                </label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="customer">Client</option>
                  <option value="driver">Chauffeur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </form>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditUserModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editUser}
                disabled={!editUserForm.name || !editUserForm.email}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression d'utilisateur */}
      {showDeleteUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                Supprimer l'utilisateur
              </h3>
              <button
                onClick={() => setShowDeleteUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-4">
                  {selectedUser.photo ? (
                    <img
                      src={selectedUser.photo}
                      alt={`Photo de ${selectedUser.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  ⚠️ <strong>Attention !</strong> Cette action est irréversible. 
                  Toutes les données associées à cet utilisateur seront définitivement supprimées.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteUserModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={deleteUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
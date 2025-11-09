"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'driver' | 'customer'
  phone?: string
  licenseNumber?: string
  isActive: boolean
  image?: string
  createdAt: string
}

interface ModernUsersManagementProps {
  userPermissions?: {
    [resource: string]: string[]
  }
}

export function ModernUsersManagement({ userPermissions }: ModernUsersManagementProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer' as 'admin' | 'manager' | 'driver' | 'customer',
    phone: '',
    licenseNumber: '',
    isActive: true,
    password: '',
    image: ''
  })
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Vérifier si l'utilisateur actuel est admin ou manager
  const isCurrentUserAdmin = () => {
    return !userPermissions || currentUserRole === 'admin' || currentUserRole === 'manager'
  }

  // Vérifier si l'utilisateur actuel est strictement admin (pas manager)
  const isStrictAdmin = () => {
    return currentUserRole === 'admin'
  }

  // Fonctions de vérification des permissions
  const canCreate = () => {
    if (!userPermissions) return true // Admin par défaut
    const usersPerms = userPermissions.users || []
    console.log('🔍 canCreate - userPermissions:', userPermissions)
    console.log('🔍 canCreate - usersPerms:', usersPerms)
    console.log('🔍 canCreate - result:', usersPerms.includes('create'))
    return usersPerms.includes('create')
  }

  const canUpdate = () => {
    if (!userPermissions) return true // Admin par défaut
    const usersPerms = userPermissions.users || []
    console.log('🔍 canUpdate - userPermissions:', userPermissions)
    console.log('🔍 canUpdate - usersPerms:', usersPerms)
    console.log('🔍 canUpdate - result:', usersPerms.includes('update'))
    return usersPerms.includes('update')
  }

  const canDelete = () => {
    if (!userPermissions) {
      console.log('⚠️ canDelete - NO userPermissions, returning TRUE (default admin)')
      return true // Admin par défaut
    }
    const usersPerms = userPermissions.users || []
    console.log('🔍 canDelete - userPermissions:', userPermissions)
    console.log('🔍 canDelete - usersPerms:', usersPerms)
    console.log('🔍 canDelete - includes delete?:', usersPerms.includes('delete'))
    const result = usersPerms.includes('delete')
    console.log('🔍 canDelete - FINAL RESULT:', result)
    return result
  }

  // Filtrer les admins si l'utilisateur actuel n'est pas admin
  const filterAdminUsers = (usersList: User[]) => {
    if (isCurrentUserAdmin()) {
      return usersList // Les admins voient tout
    }
    return usersList.filter(user => user.role !== 'admin') // Les autres ne voient pas les admins
  }

  // Handlers pour les actions CRUD
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchUsers()
        setIsModalOpen(false)
        resetForm()
        showSuccess('Utilisateur créé avec succès', 'Création réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la création')
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      showError('Une erreur est survenue lors de la création', 'Erreur technique')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    try {
      // Exclure le champ image du formData car il est géré séparément
      const { image, ...updateData } = formData
      
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        await fetchUsers()
        setIsModalOpen(false)
        setEditingUser(null)
        resetForm()
        showSuccess('Utilisateur mis à jour avec succès', 'Modification réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la modification')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError('Une erreur est survenue lors de la modification', 'Erreur technique')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })
      
      if (response.ok) {
        setIsPasswordModalOpen(false)
        setNewPassword('')
        setSelectedUser(null)
        showSuccess('Le mot de passe a été mis à jour avec succès', 'Mot de passe modifié')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la modification')
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      showError('Une erreur est survenue lors de la modification du mot de passe', 'Erreur technique')
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    
    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchUsers()
        setDeletingUser(null)
        showSuccess('Utilisateur supprimé avec succès', 'Suppression réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError('Une erreur est survenue lors de la suppression', 'Erreur technique')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'customer',
      phone: '',
      licenseNumber: '',
      isActive: true,
      password: '',
      image: ''
    })
  }

  const handleProfilePhotoUpdate = (url: string | null) => {
    setFormData(prev => ({ ...prev, image: url || '' }))
  }

  // Charger le rôle de l'utilisateur actuel
  const fetchCurrentUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const session = await response.json()
        setCurrentUserRole(session?.user?.role || '')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rôle:', error)
    }
  }

  useEffect(() => {
    fetchCurrentUserRole()
    fetchUsers()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const result = await response.json()
        if (result?.success) {
          // Filtrer les admins si l'utilisateur n'est pas admin
          const allUsers = result.data ?? []
          setUsers(filterAdminUsers(allUsers))
        } else {
          console.error('Erreur lors du chargement des utilisateurs:', result?.error)
          setUsers([])
        }
      } else {
        console.error('Erreur HTTP:', response.status)
        setUsers([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    // Commencer avec les utilisateurs déjà filtrés (sans les admins si nécessaire)
    let filtered = [...users]

    // Filtres
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role)
    }
    if (filters.status) {
      if (filters.status === 'active') {
        filtered = filtered.filter(user => user.isActive)
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(user => !user.isActive)
      }
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phone?.toLowerCase().includes(searchTerm)
      )
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof User] as string
      let bValue = b[filters.sortBy as keyof User] as string
      
      if (filters.sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime().toString()
        bValue = new Date(bValue).getTime().toString()
      }
      
      const result = aValue.localeCompare(bValue)
      return filters.sortOrder === 'asc' ? result : -result
    })

    setFilteredUsers(filtered)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return '👑'
      case 'manager': return '👨‍💼'
      case 'driver': return '🚗'
      case 'customer': return '👤'
      default: return '👤'
    }
  }

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'Administrateur'
      case 'manager': return 'Manager'
      case 'driver': return 'Chauffeur'
      case 'customer': return 'Client'
      default: return 'Client'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'manager': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'driver': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'customer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStats = () => {
    const total = users.length
    const active = users.filter(u => u.isActive).length
    const admins = users.filter(u => u.role === 'admin').length
    const managers = users.filter(u => u.role === 'manager').length
    const drivers = users.filter(u => u.role === 'driver').length
    const customers = users.filter(u => u.role === 'customer').length
    
    return { total, active, admins, managers, drivers, customers }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        
        {/* Header avec statistiques */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
                Gestion des utilisateurs
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Gérez tous vos utilisateurs, rôles et permissions
              </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Boutons de vue - Cachés sur mobile */}
              <div className="hidden sm:flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cartes
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Tableau
                </button>
              </div>
              
              {/* Bouton Nouvel utilisateur */}
              {canCreate() && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">Nouvel utilisateur</span>
                  <span className="sm:hidden">Nouveau</span>
                </button>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className={`grid grid-cols-2 ${isCurrentUserAdmin() ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3 sm:gap-4 mb-4 sm:mb-6`}>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-xl sm:text-2xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Actifs</p>
                </div>
                <div className="text-xl sm:text-2xl">✅</div>
              </div>
            </div>
            
            {isStrictAdmin() && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Admins</p>
                  </div>
                  <div className="text-xl sm:text-2xl">👑</div>
                </div>
              </div>
            )}
            
            {isCurrentUserAdmin() && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.managers}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Managers</p>
                  </div>
                  <div className="text-xl sm:text-2xl">👨‍💼</div>
                </div>
              </div>
            )}
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.drivers}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Chauffeurs</p>
                </div>
                <div className="text-xl sm:text-2xl">🚗</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.customers}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Clients</p>
                </div>
                <div className="text-xl sm:text-2xl">👤</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Recherche */}
            <div className="relative md:col-span-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9 sm:pl-10 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtre par rôle */}
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les rôles</option>
              {isStrictAdmin() && <option value="admin">👑 Administrateurs</option>}
              {isCurrentUserAdmin() && <option value="manager">👨‍💼 Managers</option>}
              <option value="driver">🚗 Chauffeurs</option>
              <option value="customer">👤 Clients</option>
            </select>

            {/* Filtre par statut */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="active">✅ Actifs</option>
              <option value="inactive">❌ Inactifs</option>
            </select>

            {/* Tri */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
              }}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="name-asc">Nom A-Z</option>
              <option value="name-desc">Nom Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="createdAt-desc">Plus récents</option>
              <option value="createdAt-asc">Plus anciens</option>
            </select>
          </div>

          {/* Résultats et actions rapides */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
            </p>
            
            {(filters.search || filters.role || filters.status) && (
              <button
                onClick={() => setFilters({ role: '', status: '', search: '', sortBy: 'name', sortOrder: 'asc' })}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Vue en cartes */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Header avec photo et statut */}
                <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        {/* Indicateur de statut */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                          user.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 sm:mt-1 truncate">
                            📞 {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Badge de rôle */}
                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getRoleBadgeColor(user.role)}`}>
                      <span className="hidden sm:inline">{getRoleIcon(user.role)} {getRoleLabel(user.role)}</span>
                      <span className="sm:hidden">{getRoleIcon(user.role)}</span>
                    </span>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                  {user.licenseNumber && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">Permis : {user.licenseNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col gap-2">
                    {/* Ligne 1: Modifier + Mot de passe */}
                    <div className="flex gap-2">
                      {canUpdate() && (
                        <button
                          onClick={() => {
                            setEditingUser(user)
                            setFormData({
                              name: user.name,
                              email: user.email,
                              role: user.role,
                              phone: user.phone || '',
                              licenseNumber: user.licenseNumber || '',
                              isActive: user.isActive,
                              password: '',
                              image: user.image || ''
                            })
                            setIsModalOpen(true)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modifier
                        </button>
                      )}
                      
                      {canUpdate() && (
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setIsPasswordModalOpen(true)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors border border-amber-200 dark:border-amber-800 whitespace-nowrap"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.257A6 6 0 0112 5h3.001z" />
                          </svg>
                          <span className="hidden sm:inline">Mot de passe</span>
                          <span className="sm:hidden">MDP</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Ligne 2: Supprimer */}
                    {canDelete() && (
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vue en tableau */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
                      >
                        Utilisateur
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
                      >
                        Créé le
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                              user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)} {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {user.phone && (
                            <p className="text-slate-900 dark:text-white">📞 {user.phone}</p>
                          )}
                          {user.licenseNumber && (
                            <p className="text-slate-600 dark:text-slate-400">🆔 {user.licenseNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {user.isActive ? '✅ Actif' : '❌ Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate() && (
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setFormData({
                                  name: user.name,
                                  email: user.email,
                                  role: user.role,
                                  phone: user.phone || '',
                                  licenseNumber: user.licenseNumber || '',
                                  isActive: user.isActive,
                                  password: '',
                                  image: user.image || ''
                                })
                                setIsModalOpen(true)
                              }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          
                          {canUpdate() && (
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setIsPasswordModalOpen(true)
                              }}
                              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title="Modifier le mot de passe"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.257A6 6 0 0112 5h3.001z" />
                              </svg>
                            </button>
                          )}
                          
                          {canDelete() && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message si aucun utilisateur */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {filters.search || filters.role || filters.status
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre premier utilisateur'
              }
            </p>
            {!filters.search && !filters.role && !filters.status && canCreate() && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Créer un utilisateur
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de création/modification d'utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              
              {/* Photo de profil - seulement pour les utilisateurs existants */}
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Photo de profil
                  </label>
                  <UniversalProfilePhotoUpload
                    userId={editingUser.id}
                    currentImage={formData.image}
                    onImageUpdate={handleProfilePhotoUpdate}
                    onSuccess={(message) => {
                      showSuccess(message, 'Photo mise à jour')
                      fetchUsers()
                    }}
                    onError={showError}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'manager' | 'driver' | 'customer'})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="customer">👤 Client</option>
                  <option value="driver">🚗 Chauffeur</option>
                  {isCurrentUserAdmin() && <option value="manager">👨‍💼 Manager</option>}
                  {isStrictAdmin() && <option value="admin">👑 Admin</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Numéro de permis
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Optionnel"
                />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Laissez vide pour mot de passe par défaut"
                  />
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  Utilisateur actif
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="px-6 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de réinitialisation de mot de passe */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.257A6 6 0 0112 5h3.001z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Réinitialiser le mot de passe
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedUser.name}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false)
                    setSelectedUser(null)
                    setNewPassword('')
                  }}
                  className="px-6 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full animate-scaleIn">
            {/* Header avec image de profil */}
            <div className="relative h-32 bg-gradient-to-br from-red-500 via-red-600 to-rose-700 rounded-t-2xl overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Supprimer l'utilisateur ?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Cette action est irréversible et supprimera définitivement cet utilisateur.
                </p>
              </div>

              {/* Informations de l'utilisateur */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-4 mb-4">
                  {deletingUser.image ? (
                    <Image
                      src={deletingUser.image}
                      alt={deletingUser.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover border-2 border-slate-300 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                      <svg className="w-8 h-8 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {deletingUser.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {deletingUser.email}
                    </p>
                  </div>
                </div>

                {/* Badges d'informations */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    deletingUser.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : deletingUser.role === 'driver'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {deletingUser.role === 'admin' && '👑'}
                    {deletingUser.role === 'driver' && '🚗'}
                    {deletingUser.role === 'customer' && '👤'}
                    <span className="capitalize">{
                      deletingUser.role === 'admin' ? 'Administrateur' :
                      deletingUser.role === 'driver' ? 'Chauffeur' : 'Client'
                    }</span>
                  </span>
                  
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    deletingUser.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${deletingUser.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {deletingUser.isActive ? 'Actif' : 'Inactif'}
                  </span>

                  {deletingUser.phone && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                      📱 {deletingUser.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Message d'avertissement */}
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                      Attention : Action définitive
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-300">
                      Toutes les données associées à cet utilisateur seront supprimées. Cette action ne peut pas être annulée.
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Supprimer définitivement
                </button>
              </div>
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
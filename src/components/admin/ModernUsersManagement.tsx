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
  role: 'admin' | 'driver' | 'customer'
  phone?: string
  licenseNumber?: string
  isActive: boolean
  image?: string
  createdAt: string
}

export function ModernUsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
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
    role: 'customer' as 'admin' | 'driver' | 'customer',
    phone: '',
    licenseNumber: '',
    isActive: true,
    password: '',
    image: ''
  })
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
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
          setUsers(result.data ?? [])
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
      case 'driver': return '🚗'
      case 'customer': return '👤'
      default: return '👤'
    }
  }

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'Administrateur'
      case 'driver': return 'Chauffeur'
      case 'customer': return 'Client'
      default: return 'Client'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'driver': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'customer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStats = () => {
    const total = users.length
    const active = users.filter(u => u.isActive).length
    const admins = users.filter(u => u.role === 'admin').length
    const drivers = users.filter(u => u.role === 'driver').length
    const customers = users.filter(u => u.role === 'customer').length
    
    return { total, active, admins, drivers, customers }
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
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Gestion des utilisateurs
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Gérez tous vos utilisateurs, rôles et permissions
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Boutons de vue */}
              <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
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
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouvel utilisateur
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Actifs</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Admins</p>
                </div>
                <div className="text-2xl">👑</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.drivers}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Chauffeurs</p>
                </div>
                <div className="text-2xl">🚗</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.customers}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Clients</p>
                </div>
                <div className="text-2xl">👤</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtre par rôle */}
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">👑 Administrateurs</option>
              <option value="driver">🚗 Chauffeurs</option>
              <option value="customer">👤 Clients</option>
            </select>

            {/* Filtre par statut */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
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
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
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
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
            </p>
            
            {(filters.search || filters.role || filters.status) && (
              <button
                onClick={() => setFilters({ role: '', status: '', search: '', sortBy: 'name', sortOrder: 'asc' })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Vue en cartes */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Header avec photo et statut */}
                <div className="relative p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={56}
                            height={56}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        {/* Indicateur de statut */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                          user.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            📞 {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Badge de rôle */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)} {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="px-6 pb-4">
                  {user.licenseNumber && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Permis : {user.licenseNumber}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setIsPasswordModalOpen(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.257A6 6 0 0112 5h3.001z" />
                        </svg>
                        Mot de passe
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                          // handleDeleteUser(user.id)
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
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
                          
                          <button
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                                // handleDeleteUser(user.id)
                              }
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
            {!filters.search && !filters.role && !filters.status && (
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

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
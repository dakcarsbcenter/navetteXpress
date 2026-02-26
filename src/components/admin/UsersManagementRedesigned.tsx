"use client"

import { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  Plus,
  Users,
  UserPlus,
  Crown,
  DotsThreeVertical as MoreVertical,
  Eye,
  PencilSimple as Edit,
  Trash as Trash2,
  Key,
  Clock
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { DeleteUserModal } from "@/components/ui/DeleteUserModal"
import { useNotification } from "@/hooks/useNotification"
import Image from "next/image"

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
  lastLogin?: string
}

interface UsersManagementRedesignedProps {
  userPermissions?: {
    [resource: string]: string[]
  }
}

export function UsersManagementRedesigned({ userPermissions }: UsersManagementRedesignedProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer' as 'admin' | 'manager' | 'driver' | 'customer',
    phone: '',
    licenseNumber: '',
    isActive: true,
    password: ''
  })

  useEffect(() => {
    fetchUsers()
    fetchCurrentUserRole()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

  const fetchCurrentUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserRole(data?.user?.role || '')
      }
    } catch (error) {
      console.error('Erreur récupération rôle:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUsers(result.data || [])
        }
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      showError('Erreur lors du chargement des utilisateurs', 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    if (filters.role !== 'all') {
      filtered = filtered.filter(u => u.role === filters.role)
    }

    if (filters.status !== 'all') {
      const isActive = filters.status === 'active'
      filtered = filtered.filter(u => u.isActive === isActive)
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredUsers(filtered)
  }

  const getStatsData = () => {
    const total = users.length
    const thisMonth = users.filter(u => {
      const createdDate = new Date(u.createdAt)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
    }).length
    const drivers = users.filter(u => u.role === 'driver').length
    const premium = users.filter(u => u.role === 'admin' || u.role === 'manager').length

    return { total, thisMonth, drivers, premium }
  }

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      admin: { label: 'Administrateur', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
      manager: { label: 'Manager', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
      driver: { label: 'Chauffeur', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
      customer: { label: 'Client', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
    }
    return configs[role] || configs.customer
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? { label: 'Actif', color: 'text-green-700', dot: 'bg-green-500' }
      : { label: 'En pause', color: 'text-orange-700', dot: 'bg-orange-500' }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getLastConnection = (lastLogin?: string) => {
    if (!lastLogin) return "Aujourd'hui à 08:00"

    const now = new Date()
    const loginDate = new Date(lastLogin)
    const diffMs = now.getTime() - loginDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffMins < 1440) return `Hier à ${loginDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    return formatDate(lastLogin)
  }

  const openDeleteModal = (user: User) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        showSuccess('Utilisateur supprimé avec succès', 'Succès')
        setIsDeleteModalOpen(false)
        setDeletingUser(null)
        fetchUsers()
      } else {
        // Afficher le message d'erreur spécifique retourné par l'API
        const errorMessage = data.error || 'Erreur lors de la suppression'
        showError(errorMessage, 'Erreur')
        console.error('Erreur API:', data)
      }
    } catch (error) {
      console.error('Erreur technique:', error)
      showError('Erreur technique lors de la suppression', 'Erreur')
    }
  }

  const openResetPasswordModal = (user: User) => {
    setResettingPasswordUser(user)
    setNewPassword('')
    setIsResetPasswordModalOpen(true)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resettingPasswordUser) return
    if (newPassword.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères', 'Erreur')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${resettingPasswordUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })

      if (response.ok) {
        showSuccess(`Mot de passe de ${resettingPasswordUser.name} réinitialisé avec succès`, 'Succès')
        setIsResetPasswordModalOpen(false)
        setResettingPasswordUser(null)
        setNewPassword('')
      } else {
        const data = await response.json()
        showError(data.error || 'Erreur lors de la réinitialisation', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      role: 'customer',
      phone: '',
      licenseNumber: '',
      isActive: true,
      password: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      licenseNumber: user.licenseNumber || '',
      isActive: user.isActive,
      password: ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showSuccess(
          editingUser ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès',
          'Succès'
        )
        setIsModalOpen(false)
        fetchUsers()
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec')
      }
    } catch (error) {
      showError('Une erreur est survenue', 'Erreur technique')
    }
  }

  const stats = getStatsData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Gestion des Utilisateurs</h2>
            <p className="text-xs text-slate-500 mt-1">Gérez les accès et les comptes du personnel</p>
          </div>

          <div className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Rechercher nom, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/10">
              <Plus size={16} />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>

        {[
          { label: 'Total', value: stats.total, color: 'var(--color-gold)', icon: <Users size={16} /> },
          { label: 'Nouveaux', value: stats.thisMonth, color: '#10B981', icon: <UserPlus size={16} /> },
          { label: 'Chauffeurs', value: stats.drivers, color: '#3B82F6', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
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

      {/* Main Table Card */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.01]">
          {['all', 'admin', 'manager', 'driver', 'customer'].map((role) => (
            <button
              key={role}
              onClick={() => setFilters({ ...filters, role })}
              className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all ${filters.role === role ? 'bg-gold text-black' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}>
              {role === 'all' ? 'Tout' : role}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 outline-none focus:border-gold/50 cursor-pointer">
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilisateur</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rôle & Accès</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">État</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activité</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                        <Users size={24} />
                      </div>
                      <p className="text-sm text-slate-500 italic">Aucun utilisateur ne correspond à vos critères</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  const statusBadge = getStatusBadge(user.isActive)

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.image ? (
                              <Image src={user.image} alt={user.name} width={40} height={40} className="rounded-xl object-cover border border-white/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border border-white/10 bg-linear-to-br from-gold/20 to-transparent text-gold">
                                {getInitials(user.name)}
                              </div>
                            )}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090F] ${statusBadge.dot}`} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-gold transition-colors">{user.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${roleBadge.bg.replace('bg-', 'bg-').replace('border-', 'border-')} ${roleBadge.color}`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                          {roleBadge.label}
                        </span>
                        {user.phone && <div className="text-[10px] text-slate-500 mt-1.5 font-mono">{user.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${statusBadge.color}`}>
                          {statusBadge.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={12} className="text-slate-600" />
                          <span className="text-[10px] font-mono">{getLastConnection(user.lastLogin)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-slate-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
                            title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                            title="Réinitialiser MDP">
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{editingUser ? "Édition Profil" : "Nouvel Utilisateur"}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Terminal de Configuration</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Identité complète</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-gold/50 outline-none transition-all"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Adresse Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-gold/50 outline-none transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Niveau d'accès</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-gold/50 outline-none cursor-pointer appearance-none">
                    <option value="customer">Client</option>
                    <option value="driver">Chauffeur</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-gold/50 outline-none transition-all font-mono"
                  />
                </div>

                {!editingUser && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mot de passe initial</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-gold/50 outline-none transition-all"
                      required={!editingUser}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50 transition-all cursor-pointer"
                />
                <label htmlFor="isActive" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider cursor-pointer">
                  Activer les privilèges de connexion
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                  Abandonner
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gold text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-gold/20 transition-all">
                  Executer {editingUser ? 'Mise à jour' : 'Création'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isResetPasswordModalOpen && resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-sm" onClick={() => setIsResetPasswordModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 bg-blue-500/[0.02] flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Protocole de sécurité</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-blue-500/30 pl-3">
                Réinitialisation forcée pour: <span className="text-blue-400 font-bold">{resettingPasswordUser.name}</span>.
                Le nouveau mot de passe doit respecter les politiques de sécurité (6+ char).
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nouveau Secret</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingUser(null)
        }}
        onConfirm={handleDelete}
        userName={deletingUser?.name}
        userEmail={deletingUser?.email}
        userRole={deletingUser?.role}
      />
    </div>
  )
}

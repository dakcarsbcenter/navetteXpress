"use client"

import { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  Plus,
  Users,
  UserPlus,
  SteeringWheel,
  PencilSimple as Edit,
  Trash as Trash2,
  Key,
  Clock,
  X,
  Buildings
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { DeleteUserModal } from "@/components/ui/DeleteUserModal"
import Image from "next/image"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import { useNotification } from "@/hooks/useNotification"

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'driver' | 'customer'
  phone?: string
  licenseNumber?: string
  isActive: boolean
  image?: string
  isCompany?: boolean
  companyType?: 'hotel' | 'entreprise' | 'ong' | null
  companyName?: string | null
  createdAt: string
  lastLogin?: string
}

interface UsersManagementProps {
  userPermissions?: {
    [resource: string]: string[]
  }
  openCreate?: number
  initialRoleFilter?: 'all' | 'admin' | 'manager' | 'driver' | 'customer'
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrateur', color: '#B8493C' },
  manager: { label: 'Manager', color: '#B4643A' },
  driver: { label: 'Chauffeur', color: '#1F5245' },
  customer: { label: 'Client', color: '#6E6A63' },
}

const COMPANY_TYPE_META: Record<string, { label: string; color: string }> = {
  hotel: { label: 'Hôtel', color: '#2F6690' },
  entreprise: { label: 'Entreprise', color: '#6B4FA0' },
  ong: { label: 'ONG', color: '#3D8361' },
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px',
}
const fieldInput: React.CSSProperties = {
  width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E',
}

export function UsersManagement({ userPermissions, openCreate, initialRoleFilter }: UsersManagementProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const [filters, setFilters] = useState<{ role: string; status: string; search: string }>({
    role: initialRoleFilter ?? 'all',
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
    password: '',
    isCompany: false,
    companyType: '' as '' | 'hotel' | 'entreprise' | 'ong',
    companyName: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (openCreate && openCreate > 0) {
      setEditingUser(null)
      setFormData({ name: '', email: '', role: 'customer', phone: '', licenseNumber: '', isActive: true, password: '', isCompany: false, companyType: '', companyName: '' })
      setIsModalOpen(true)
    }
  }, [openCreate])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, filters])

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

    return { total, thisMonth, drivers }
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
        setSelectedUserIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(deletingUser.id)
          return newSet
        })
        fetchUsers()
      } else {
        const errorMessage = data.error || 'Erreur lors de la suppression'
        showError(errorMessage, 'Erreur')
        console.error('Erreur API:', data)
      }
    } catch (error) {
      console.error('Erreur technique:', error)
      showError('Erreur technique lors de la suppression', 'Erreur')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedUserIds) })
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(data.message || 'Utilisateurs supprimés avec succès', 'Succès')
        setSelectedUserIds(new Set())
        fetchUsers()
      } else {
        showError(data.error || 'Erreur lors de la suppression multiple', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique lors de la suppression multiple', 'Erreur')
    }
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(user => user.id)))
    }
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
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
      password: '',
      isCompany: false,
      companyType: '',
      companyName: ''
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
      password: '',
      isCompany: !!user.isCompany,
      companyType: user.companyType || '',
      companyName: user.companyName || ''
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
            Comptes &amp; accès
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Utilisateurs.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Gérez les accès et les comptes du personnel.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedUserIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', color: '#B8493C', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash2 size={15} />
              Supprimer ({selectedUserIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2"
            style={{ height: '40px', padding: '0 18px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} weight="bold" />
            Nouveau
          </button>
        </div>
      </section>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
        <input
          type="text"
          placeholder="Rechercher nom, email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ ...fieldInput, paddingLeft: '40px' }}
        />
      </div>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
        {[
          { label: 'Total', value: stats.total, icon: Users },
          { label: 'Nouveaux', value: stats.thisMonth, icon: UserPlus },
          { label: 'Chauffeurs', value: stats.drivers, icon: SteeringWheel },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} style={{ padding: '18px 20px', borderRight: i < 2 ? '1px solid #E2DACD' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Icon size={17} style={{ color: '#1F5245' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{stat.value}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{stat.label}</span>
            </div>
          )
        })}
      </section>

      {/* Main Table Card */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="flex items-center gap-2 flex-wrap" style={{ padding: '16px 20px', borderBottom: '1px solid #E2DACD' }}>
          {['all', 'admin', 'manager', 'driver', 'customer'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setFilters({ ...filters, role })}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '6px 12px', borderRadius: '3px', cursor: 'pointer',
                backgroundColor: filters.role === role ? '#1F5245' : 'transparent',
                color: filters.role === role ? '#FFFFFF' : '#6E6A63',
              }}
            >
              {role === 'all' ? 'Tout' : ROLE_META[role]?.label ?? role}
            </button>
          ))}

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{ marginLeft: 'auto', height: '32px', padding: '0 10px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '11.5px', color: '#6E6A63' }}
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                    onChange={toggleSelectAll}
                    style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                  />
                </th>
                {['Utilisateur', 'Rôle & accès', 'État', 'Activité', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i === 4 ? 'center' : 'left', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 16px', textAlign: 'center' }}>
                    <Users size={28} style={{ color: '#E2DACD', margin: '0 auto 10px' }} />
                    <p style={{ margin: 0, fontSize: '13px', color: '#9a938a', fontStyle: 'italic' }}>Aucun utilisateur ne correspond à vos critères</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleMeta = ROLE_META[user.role] ?? ROLE_META.customer
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.image ? (
                              <Image src={user.image} alt={user.name} width={36} height={36} style={{ borderRadius: '3px', objectFit: 'cover', border: '1px solid #E2DACD' }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 600, color: '#1F5245' }}>
                                {getInitials(user.name)}
                              </div>
                            )}
                            <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #FFFFFF', backgroundColor: user.isActive ? '#1F5245' : '#9a938a' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#12100E' }}>{user.name}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#6E6A63' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                              padding: '3px 9px', borderRadius: '2px', backgroundColor: `${roleMeta.color}15`, color: roleMeta.color,
                            }}
                          >
                            {roleMeta.label}
                          </span>
                          {user.isCompany && user.companyType && (
                            <span
                              className="inline-flex items-center gap-1"
                              title={user.companyName || undefined}
                              style={{
                                fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                                padding: '3px 9px', borderRadius: '2px',
                                backgroundColor: `${COMPANY_TYPE_META[user.companyType].color}15`,
                                color: COMPANY_TYPE_META[user.companyType].color,
                              }}
                            >
                              <Buildings size={10} weight="fill" />
                              {COMPANY_TYPE_META[user.companyType].label}
                            </span>
                          )}
                        </div>
                        {user.companyName && (
                          <div style={{ fontSize: '11px', fontWeight: 500, color: '#12100E', marginTop: '6px' }}>{user.companyName}</div>
                        )}
                        {user.phone && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#6E6A63', marginTop: '4px' }}>{user.phone}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{
                            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: user.isActive ? '#1F5245' : '#B4643A',
                          }}
                        >
                          <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: user.isActive ? '#1F5245' : '#B4643A' }} />
                          {user.isActive ? 'Actif' : 'En pause'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-2" style={{ color: '#6E6A63' }}>
                          <Clock size={12} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{getLastConnection(user.lastLogin)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            title="Modifier"
                            style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: 'pointer' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openResetPasswordModal(user)}
                            title="Réinitialiser MDP"
                            style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: 'pointer' }}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(user)}
                            title="Supprimer"
                            style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#B8493C', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
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
      </section>

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid #E2DACD' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#12100E' }}>{editingUser ? "Édition profil" : "Nouvel utilisateur"}</h3>
                <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>Terminal de configuration</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#6E6A63' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label style={fieldLabel}>Identité complète</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={fieldInput}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label style={fieldLabel}>Adresse email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Niveau d&apos;accès</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    style={fieldInput}
                  >
                    <option value="customer">Client</option>
                    <option value="driver">Chauffeur</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabel}>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div className="col-span-2">
                  <label style={fieldLabel}>Numéro de permis</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="Ex: SN-123456"
                    style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                {formData.role === 'customer' && (
                  <div className="col-span-2" style={{ padding: '14px', border: '1px solid #E2DACD', borderRadius: '3px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="flex items-center gap-3" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isCompany}
                        onChange={(e) => setFormData({ ...formData, isCompany: e.target.checked, companyType: e.target.checked ? formData.companyType : '' })}
                        style={{ width: '16px', height: '16px', accentColor: '#1F5245' }}
                      />
                      <span className="flex items-center gap-2" style={{ fontSize: '12.5px', fontWeight: 500, color: '#12100E' }}>
                        <Buildings size={14} />
                        Compte entreprise / hôtel / ONG
                      </span>
                    </label>

                    {formData.isCompany && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label style={fieldLabel}>Type de structure</label>
                          <select
                            value={formData.companyType}
                            onChange={(e) => setFormData({ ...formData, companyType: e.target.value as '' | 'hotel' | 'entreprise' | 'ong' })}
                            style={fieldInput}
                          >
                            <option value="">Sélectionner...</option>
                            <option value="entreprise">Entreprise</option>
                            <option value="hotel">Hôtel</option>
                            <option value="ong">ONG</option>
                          </select>
                        </div>
                        <div>
                          <label style={fieldLabel}>Nom de la structure</label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Ex: Hôtel Terrou-Bi"
                            style={fieldInput}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!editingUser && (
                  <div className="col-span-2">
                    <label style={fieldLabel}>Mot de passe initial</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={fieldInput}
                      required={!editingUser}
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3" style={{ padding: '12px 14px', border: '1px solid #E2DACD', borderRadius: '3px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#1F5245' }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#12100E' }}>Activer les privilèges de connexion</span>
              </label>

              <div className="flex gap-3" style={{ paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, height: '42px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Abandonner
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: '42px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isResetPasswordModalOpen && resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setIsResetPasswordModalOpen(false)} />
          <div className="relative w-full max-w-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid #E2DACD' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', color: '#1F5245' }}>
                <Key size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#12100E' }}>Réinitialiser le mot de passe</h3>
                <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6A63' }}>Protocole de sécurité</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#3d3a35', lineHeight: 1.5, borderLeft: '2px solid rgba(31,82,69,.3)', paddingLeft: '12px' }}>
                Réinitialisation forcée pour : <strong style={{ color: '#1F5245' }}>{resettingPasswordUser.name}</strong>. Le nouveau mot de passe doit contenir au moins 6 caractères.
              </p>

              <div>
                <label style={fieldLabel}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={fieldInput}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  style={{ flex: 1, height: '42px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: '42px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
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

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedUserIds.size}
        resourceName="utilisateurs"
      />
    </div>
  )
}

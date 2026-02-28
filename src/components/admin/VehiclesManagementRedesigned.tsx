"use client"

import { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  Plus,
  Car,
  Wrench,
  Warning as AlertTriangle,
  SquaresFour as Grid,
  List,
  DotsThreeVertical as MoreVertical
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import Image from "next/image"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import { Trash } from "@phosphor-icons/react"

interface Vehicle {
  id: number
  make: string
  model: string
  year: number
  plateNumber: string
  capacity: number
  vehicleType?: string
  photo?: string | null
  category?: string | null
  description?: string | null
  features?: string | null
  driverId?: string | null
  isActive: boolean
  createdAt: string
  driver?: {
    id: string
    name: string
    email: string
  }
}

interface Driver {
  id: string
  name: string
  email: string
  phone?: string
  isActive: boolean
}

export function VehiclesManagementRedesigned() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<number>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const [filters, setFilters] = useState({
    capacity: 'all',
    status: 'all',
    search: ''
  })

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    capacity: 4,
    vehicleType: 'sedan',
    photo: '',
    category: '',
    description: '',
    features: '',
    driverId: '',
    isActive: true
  })

  useEffect(() => {
    fetchVehicles()
    fetchDrivers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vehicles, filters])

  const toggleSelectAll = () => {
    if (selectedVehicleIds.size === filteredVehicles.length && filteredVehicles.length > 0) {
      setSelectedVehicleIds(new Set())
    } else {
      setSelectedVehicleIds(new Set(filteredVehicles.map(v => v.id)))
    }
  }

  const toggleSelectVehicle = (vehicleId: number) => {
    setSelectedVehicleIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles', { cache: 'no-store' })
      if (response.ok) {
        const result = await response.json()
        if (result?.success) {
          setVehicles(result.data ?? [])
        }
      }
    } catch (error) {
      console.error('Erreur chargement véhicules:', error)
      showError('Erreur lors du chargement des véhicules', 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=driver', { cache: 'no-store' })
      if (response.ok) {
        const result = await response.json()
        if (result?.success) {
          setDrivers(result.data ?? [])
        }
      }
    } catch (error) {
      console.error('Erreur chargement chauffeurs:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...vehicles]

    if (filters.capacity !== 'all') {
      filtered = filtered.filter(v => v.capacity === parseInt(filters.capacity))
    }

    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(v => v.isActive)
      } else if (filters.status === 'maintenance') {
        filtered = filtered.filter(v => !v.isActive)
      } else if (filters.status === 'available') {
        filtered = filtered.filter(v => v.isActive && !v.driverId)
      }
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(v =>
        v.make.toLowerCase().includes(searchTerm) ||
        v.model.toLowerCase().includes(searchTerm) ||
        v.plateNumber.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredVehicles(filtered)
  }

  const getStatsData = () => {
    const total = vehicles.length
    const inService = vehicles.filter(v => v.isActive && v.driverId).length
    const maintenance = vehicles.filter(v => !v.isActive).length
    const unassigned = vehicles.filter(v => v.isActive && !v.driverId).length

    return { total, inService, maintenance, unassigned }
  }

  const getStatusBadge = (vehicle: Vehicle) => {
    if (!vehicle.isActive) {
      return { label: 'Maintenance', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
    }
    if (vehicle.driverId) {
      return { label: 'En Service', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    }
    return { label: 'En Course', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' }
  }

  const getFuelTypeBadge = (type?: string) => {
    const configs: Record<string, { label: string; icon: string }> = {
      diesel: { label: 'Diesel', icon: '⛽' },
      essence: { label: 'Essence', icon: '⛽' },
      hybrid: { label: 'Hybride', icon: '🔋' },
      electric: { label: 'Électrique', icon: '⚡' }
    }
    return configs[type || 'diesel'] || configs.diesel
  }

  const getDriverInfo = (vehicle: Vehicle) => {
    if (!vehicle.driverId) return null
    const driver = drivers.find(d => d.id === vehicle.driverId)
    return driver
  }

  const openCreateModal = () => {
    setEditingVehicle(null)
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plateNumber: '',
      capacity: 4,
      vehicleType: 'sedan',
      photo: '',
      category: '',
      description: '',
      features: '',
      driverId: '',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      capacity: vehicle.capacity,
      vehicleType: vehicle.vehicleType || 'sedan',
      photo: vehicle.photo || '',
      category: vehicle.category || '',
      description: vehicle.description || '',
      features: vehicle.features || '',
      driverId: vehicle.driverId || '',
      isActive: vehicle.isActive
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingVehicle ? `/api/admin/vehicles/${editingVehicle.id}` : '/api/admin/vehicles'
      const method = editingVehicle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showSuccess(
          editingVehicle ? 'Véhicule modifié avec succès' : 'Véhicule créé avec succès',
          'Succès'
        )
        setIsModalOpen(false)
        fetchVehicles()
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec')
      }
    } catch (error) {
      showError('Une erreur est survenue', 'Erreur technique')
    }
  }

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${vehicle.make} ${vehicle.model} ?`)) return

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicle.id}`, { method: 'DELETE' })
      if (response.ok) {
        showSuccess('Véhicule supprimé avec succès', 'Succès')
        setSelectedVehicleIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(vehicle.id)
          return newSet
        })
        fetchVehicles()
      } else {
        showError('Erreur lors de la suppression', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/vehicles/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedVehicleIds) })
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(data.message || 'Véhicules supprimés', 'Succès')
        setSelectedVehicleIds(new Set())
        fetchVehicles()
      } else {
        showError(data.error || 'Erreur lors de la suppression', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    }
  }

  const stats = getStatsData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Flotte de Véhicules</h1>
          <p className="text-slate-400 mt-1 text-sm">Gérez l'état, l'affectation et la maintenance.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {selectedVehicleIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
            >
              <Trash className="w-5 h-5" />
              <span className="hidden sm:inline">Supprimer ({selectedVehicleIds.size})</span>
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 btn-gold"
          >
            <Plus className="w-5 h-5" />
            Nouveau véhicule
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL FLOTTE */}
        <div className="p-6 rounded-2xl border border-white/5 relative overflow-hidden group" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Flotte</p>
              <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <Car size={24} className="text-gold" weight="fill" />
            </div>
          </div>
        </div>

        {/* EN SERVICE */}
        <div className="p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden group" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-1">En Service</p>
              <h3 className="text-3xl font-bold text-emerald-400">{stats.inService}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* MAINTENANCE */}
        <div className="p-6 rounded-2xl border border-red-500/20 relative overflow-hidden group" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-red-400 text-sm font-medium mb-1">Maintenance</p>
              <h3 className="text-3xl font-bold text-red-500">{stats.maintenance}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
              <Wrench size={24} className="text-red-400" weight="fill" />
            </div>
          </div>
        </div>

        {/* NON ASSIGNÉS */}
        <div className="p-6 rounded-2xl border border-amber-500/20 relative overflow-hidden group" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-amber-400 text-sm font-medium mb-1">Non Assignés</p>
              <h3 className="text-3xl font-bold text-amber-500">{stats.unassigned}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
              <AlertTriangle size={24} className="text-amber-400" weight="fill" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 lg:p-8 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Marque, modèle ou plaque..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 min-w-max">
            <select
              value={filters.capacity}
              onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors [&>option]:bg-gray-900"
            >
              <option value="all">Toutes les capacités</option>
              <option value="2">2 places</option>
              <option value="4">4 places</option>
              <option value="5">5 places</option>
              <option value="7">7 places</option>
              <option value="9">9 places</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors [&>option]:bg-gray-900"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="available">Disponible</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Aucun véhicule trouvé
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredVehicles.map((vehicle) => {
              const statusBadge = getStatusBadge(vehicle)
              const fuelType = getFuelTypeBadge(vehicle.vehicleType)
              const driver = getDriverInfo(vehicle)

              return (
                <div
                  key={vehicle.id}
                  className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5 transition-all relative group"
                >
                  {/* Select Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedVehicleIds.has(vehicle.id)}
                      onChange={() => toggleSelectVehicle(vehicle.id)}
                      className="w-4 h-4 rounded text-gold bg-black/50 border-white/20 focus:ring-gold/50 cursor-pointer shadow-sm"
                    />
                  </div>

                  {/* Vehicle Image */}
                  <div className="relative h-40 sm:h-48 bg-black/80">
                    {vehicle.photo ? (
                      <Image
                        src={vehicle.photo}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white/20">
                          <Car className="w-16 h-16 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{vehicle.make}</p>
                          <p className="text-lg">{vehicle.model}</p>
                        </div>
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusBadge.bg} ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-4">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mb-3 font-mono">
                      {vehicle.plateNumber} • {vehicle.year}
                    </p>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 mb-4">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs">
                        {fuelType.icon} {fuelType.label}
                      </span>
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs">
                        👥 {vehicle.capacity} pers.
                      </span>
                    </div>

                    {/* Driver Info or Alert */}
                    {driver ? (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Chauffeur</p>
                          <p className="text-sm font-medium text-white truncate">{driver.name}</p>
                        </div>
                      </div>
                    ) : !vehicle.isActive ? (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-xs text-red-400 font-medium">Problème - Garage Auto</p>
                      </div>
                    ) : (
                      <button
                        className="w-full mb-3 p-3 font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
                        onClick={() => openEditModal(vehicle)}
                      >
                        + Assigner Chauffeur
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      {!vehicle.driverId && (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Non assigné</span>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <MoreVertical weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Marque</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Modèle</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Année</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Plaque</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Capacité</label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors [&>option]:bg-gray-900"
                  >
                    <option value={2}>2 places</option>
                    <option value={4}>4 places</option>
                    <option value={5}>5 places</option>
                    <option value={7}>7 places</option>
                    <option value={9}>9 places</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Type de carburant</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors [&>option]:bg-gray-900"
                  >
                    <option value="sedan">Berline (Diesel)</option>
                    <option value="suv">SUV (Essence)</option>
                    <option value="van">Van (Diesel)</option>
                    <option value="luxury">Luxe (Hybride)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Chauffeur assigné</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors [&>option]:bg-gray-900"
                >
                  <option value="">Aucun chauffeur assigné</option>
                  {drivers.filter(d => d.isActive).map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer">
                  Véhicule actif (disponible pour les courses)
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 btn-gold"
                >
                  {editingVehicle ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedVehicleIds.size}
        resourceName="véhicules"
      />
    </div>
  )
}

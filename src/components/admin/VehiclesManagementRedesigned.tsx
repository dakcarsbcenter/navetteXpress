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
      return { label: 'Maintenance', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
    }
    if (vehicle.driverId) {
      return { label: 'En Service', color: 'text-green-700', bg: 'bg-green-50 border-green-200' }
    }
    return { label: 'En Course', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' }
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
        fetchVehicles()
      } else {
        showError('Erreur lors de la suppression', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
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
    <div className="min-h-screen bg-gray-50">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flotte de Véhicules</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez l'état, l'affectation et la maintenance.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau véhicule
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">TOTAL FLOTTE</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Car className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 mb-1">EN SERVICE</div>
                <div className="text-3xl font-bold text-green-600">{stats.inService}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-700 mb-1">MAINTENANCE</div>
                <div className="text-3xl font-bold text-red-600">{stats.maintenance}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-700 mb-1">NON ASSIGNÉS</div>
                <div className="text-3xl font-bold text-yellow-600">{stats.unassigned}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Marque, modèle ou plaque..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>

          <select
            value={filters.capacity}
            onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="available">Disponible</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button className="p-2 rounded bg-gray-200">
              <Grid className="w-5 h-5" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100">
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="p-4 sm:p-6 lg:p-8">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
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
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Vehicle Image */}
                  <div className="relative h-40 sm:h-48 bg-linear-to-br from-gray-800 to-gray-900">
                    {vehicle.photo ? (
                      <Image
                        src={vehicle.photo}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Car className="w-16 h-16 mx-auto mb-2 opacity-50" />
                          <p className="text-2xl font-bold">{vehicle.make}</p>
                          <p className="text-lg">{vehicle.model}</p>
                        </div>
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                      {vehicle.plateNumber} • {vehicle.year}
                    </p>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {fuelType.icon} {fuelType.label}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        👥 {vehicle.capacity} pers.
                      </span>
                    </div>

                    {/* Driver Info or Alert */}
                    {driver ? (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                          {driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Chauffeur</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{driver.name}</p>
                        </div>
                      </div>
                    ) : !vehicle.isActive ? (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-red-700">Problème freinage - Garage Auto</p>
                      </div>
                    ) : (
                      <button
                        className="w-full mb-3 p-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
                        onClick={() => openEditModal(vehicle)}
                      >
                        + Assigner Chauffeur
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      {!vehicle.driverId && (
                        <span className="text-xs text-gray-500">Non assigné</span>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plaque</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value={2}>2 places</option>
                    <option value={4}>4 places</option>
                    <option value={5}>5 places</option>
                    <option value={7}>7 places</option>
                    <option value={9}>9 places</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de carburant</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="sedan">Berline (Diesel)</option>
                    <option value="suv">SUV (Essence)</option>
                    <option value="van">Van (Diesel)</option>
                    <option value="luxury">Luxe (Hybride)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chauffeur assigné</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Aucun chauffeur assigné</option>
                  {drivers.filter(d => d.isActive).map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Véhicule actif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {editingVehicle ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

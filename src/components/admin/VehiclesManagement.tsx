"use client"

import { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  Plus,
  Car,
  Wrench,
  Warning as AlertTriangle,
  CheckCircle,
  Trash
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import Image from "next/image"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import DeleteVehicleModal from "./DeleteVehicleModal"
import { TONE_STYLE } from "@/components/shared/StatusBadge"

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

const fieldLabel: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px' }
const fieldInput: React.CSSProperties = { width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E' }

export function VehiclesManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getStatusMeta = (vehicle: Vehicle) => {
    if (!vehicle.isActive) return { label: 'Maintenance', ...TONE_STYLE.arrete }
    if (vehicle.driverId) return { label: 'En Service', ...TONE_STYLE.valide }
    return { label: 'En Course', ...TONE_STYLE.attente }
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

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/vehicles/${deleteTarget.id}`, { method: 'DELETE' })
      if (response.ok) {
        showSuccess('Véhicule supprimé avec succès', 'Succès')
        setSelectedVehicleIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(deleteTarget.id)
          return newSet
        })
        setDeleteTarget(null)
        fetchVehicles()
      } else {
        showError('Erreur lors de la suppression', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    } finally {
      setIsDeleting(false)
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
            Parc automobile
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Flotte de véhicules.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Gérez l&apos;état, l&apos;affectation et la maintenance.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedVehicleIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', color: '#B8493C', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash size={15} />
              Supprimer ({selectedVehicleIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2"
            style={{ height: '40px', padding: '0 18px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} weight="bold" />
            Nouveau véhicule
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
        {[
          { label: 'Total flotte', value: stats.total, icon: Car, color: '#1F5245' },
          { label: 'En service', value: stats.inService, icon: CheckCircle, color: '#1F5245' },
          { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: '#B8493C' },
          { label: 'Non assignés', value: stats.unassigned, icon: AlertTriangle, color: '#B4643A' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid #E2DACD' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Icon size={17} weight="fill" style={{ color: stat.color }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{stat.value}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{stat.label}</span>
            </div>
          )
        })}
      </section>

      {/* Filters */}
      <section className="flex flex-col lg:flex-row gap-3">
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
          <input
            type="text"
            placeholder="Marque, modèle ou plaque..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ ...fieldInput, width: '100%', paddingLeft: '40px', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div className="flex gap-2">
          <select value={filters.capacity} onChange={(e) => setFilters({ ...filters, capacity: e.target.value })} style={{ ...fieldInput, width: 'auto' }}>
            <option value="all">Toutes les capacités</option>
            <option value="2">2 places</option>
            <option value="4">4 places</option>
            <option value="5">5 places</option>
            <option value="7">7 places</option>
            <option value="9">9 places</option>
          </select>

          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ ...fieldInput, width: 'auto' }}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="available">Disponible</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </section>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px dashed #E2DACD', borderRadius: '4px', color: '#9a938a', fontSize: '13px' }}>
          Aucun véhicule trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVehicles.map((vehicle) => {
            const statusMeta = getStatusMeta(vehicle)
            const fuelType = getFuelTypeBadge(vehicle.vehicleType)
            const driver = getDriverInfo(vehicle)

            return (
              <div key={vehicle.id} className="relative" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedVehicleIds.has(vehicle.id)}
                    onChange={() => toggleSelectVehicle(vehicle.id)}
                    style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                  />
                </div>

                {/* Vehicle Image */}
                <div className="relative" style={{ height: '150px', backgroundColor: '#F7F3EC' }}>
                  {vehicle.photo ? (
                    <Image
                      src={vehicle.photo}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div style={{ textAlign: 'center', color: '#C9BFA9' }}>
                        <Car size={40} style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{vehicle.make}</p>
                        <p style={{ margin: 0, fontSize: '13px' }}>{vehicle.model}</p>
                      </div>
                    </div>
                  )}
                  <span
                    className="absolute top-3 right-3"
                    style={{ padding: '3px 10px', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: statusMeta.bg, color: statusMeta.color }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {/* Vehicle Info */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 2px', fontSize: '14.5px', fontWeight: 600, color: '#12100E' }}>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6E6A63' }}>
                    {vehicle.plateNumber} · {vehicle.year}
                  </p>

                  <div className="flex items-center gap-2" style={{ marginBottom: '14px' }}>
                    <span style={{ padding: '3px 9px', backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '2px', fontSize: '11px', color: '#3d3a35' }}>
                      {fuelType.icon} {fuelType.label}
                    </span>
                    <span style={{ padding: '3px 9px', backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '2px', fontSize: '11px', color: '#3d3a35' }}>
                      {vehicle.capacity} pers.
                    </span>
                  </div>

                  {driver ? (
                    <div className="flex items-center gap-2" style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '3px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.12)', display: 'grid', placeItems: 'center', fontSize: '9.5px', fontWeight: 600, color: '#1F5245' }}>
                        {driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6A63' }}>Chauffeur</p>
                        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 500, color: '#12100E' }} className="truncate">{driver.name}</p>
                      </div>
                    </div>
                  ) : !vehicle.isActive ? (
                    <div className="flex items-center gap-2" style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: 'rgba(184,73,60,.06)', border: '1px solid rgba(184,73,60,.2)', borderRadius: '3px' }}>
                      <AlertTriangle size={14} style={{ color: '#B8493C' }} />
                      <p style={{ margin: 0, fontSize: '11.5px', fontWeight: 500, color: '#B8493C' }}>Problème - Garage Auto</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditModal(vehicle)}
                      style={{ width: '100%', marginBottom: '12px', padding: '10px', fontSize: '12px', fontWeight: 600, color: '#B4643A', backgroundColor: 'rgba(180,100,58,.08)', border: '1px solid rgba(180,100,58,.3)', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      + Assigner chauffeur
                    </button>
                  )}

                  <div className="flex items-center justify-between" style={{ paddingTop: '12px', borderTop: '1px solid #F0EAE0' }}>
                    {!vehicle.driverId && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6A63' }}>Non assigné</span>
                    )}
                    <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(vehicle)}
                        title="Modifier"
                        style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: 'pointer' }}
                      >
                        <Wrench size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(vehicle)}
                        title="Supprimer"
                        style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#B8493C', cursor: 'pointer' }}
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setIsModalOpen(false)} />
          <div className="relative dash-scroll" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#12100E' }}>
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={fieldLabel}>Marque</label>
                  <input type="text" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }} required />
                </div>

                <div>
                  <label style={fieldLabel}>Modèle</label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }} required />
                </div>

                <div>
                  <label style={fieldLabel}>Année</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }} required />
                </div>

                <div>
                  <label style={fieldLabel}>Plaque</label>
                  <input type="text" value={formData.plateNumber} onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })} style={{ ...fieldInput, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }} required />
                </div>

                <div>
                  <label style={fieldLabel}>Capacité</label>
                  <select value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} style={fieldInput}>
                    <option value={2}>2 places</option>
                    <option value={4}>4 places</option>
                    <option value={5}>5 places</option>
                    <option value={7}>7 places</option>
                    <option value={9}>9 places</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabel}>Type de carburant</label>
                  <select value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })} style={fieldInput}>
                    <option value="sedan">Berline (Diesel)</option>
                    <option value="suv">SUV (Essence)</option>
                    <option value="van">Van (Diesel)</option>
                    <option value="luxury">Luxe (Hybride)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={fieldLabel}>Chauffeur assigné</label>
                <select value={formData.driverId} onChange={(e) => setFormData({ ...formData, driverId: e.target.value })} style={fieldInput}>
                  <option value="">Aucun chauffeur assigné</option>
                  {drivers.filter(d => d.isActive).map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3" style={{ padding: '12px 14px', border: '1px solid #E2DACD', borderRadius: '3px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#1F5245' }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#12100E' }}>Véhicule actif (disponible pour les courses)</span>
              </label>

              <div className="flex gap-3" style={{ paddingTop: '12px', borderTop: '1px solid #E2DACD' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, height: '42px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: '42px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingVehicle ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteVehicleModal
        isOpen={!!deleteTarget}
        vehicle={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />

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

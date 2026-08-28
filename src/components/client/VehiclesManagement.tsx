"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ImageUploader } from "@/components/ImageUploader"
import { Car, Plus, Eye, PencilSimple, Prohibit, CheckCircle, Trash, Warning, MagnifyingGlass } from "@phosphor-icons/react"

interface Vehicle {
  id: number
  make: string
  model: string
  year: number
  plateNumber: string
  capacity: number
  type: string
  photo?: string
  category?: string
  description?: string
  features?: string
  isActive: boolean
  driverId?: number
  driverName?: string
  createdAt: string
}

interface VehiclesManagementProps {
  onClose?: () => void
}

interface UserPermissions {
  [resource: string]: string[]
}

const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }
const surfaceStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px' }
const inputStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E' }

export function VehiclesManagement({ onClose }: VehiclesManagementProps) {
  const { data: session } = useSession()
  const t = useTranslations('client.vehicles')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({})
  const [featuresList, setFeaturesList] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    loadVehicles()
    loadUserPermissions()
  }, [])

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions')
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || {})
      }
    } catch (err) {
      console.error("Erreur lors du chargement des permissions:", err)
    }
  }

  // Vérifier les permissions spécifiques
  const canCreate = userPermissions.vehicles?.includes('create') || false
  const canUpdate = userPermissions.vehicles?.includes('update') || false
  const canDelete = userPermissions.vehicles?.includes('delete') || false
  const canRead = userPermissions.vehicles?.includes('read') || canCreate || canUpdate || canDelete

  const loadVehicles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/client/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      } else {
        setError(t('loadError'))
      }
    } catch (err) {
      setError(t('connectionError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVehicle = async (id: number) => {
    try {
      const response = await fetch(`/api/client/vehicles/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeletingVehicle(null)
        loadVehicles()
        setError("")
      } else {
        const data = await response.json()
        setError(data.error || t('deleteError'))
        setDeletingVehicle(null)
      }
    } catch (err) {
      setError(t('connectionError'))
      setDeletingVehicle(null)
    }
  }

  const handleToggleStatus = async (vehicle: Vehicle) => {
    try {
      const response = await fetch(`/api/client/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vehicle.isActive })
      })

      if (response.ok) {
        loadVehicles()
      } else {
        const data = await response.json()
        setError(data.error || t('updateError'))
      }
    } catch (err) {
      setError(t('connectionError'))
    }
  }

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return

    try {
      const response = await fetch(`/api/client/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: editingVehicle.make,
          model: editingVehicle.model,
          year: editingVehicle.year,
          plateNumber: editingVehicle.plateNumber,
          capacity: editingVehicle.capacity,
          vehicleType: editingVehicle.type,
          photo: editingVehicle.photo,
          category: editingVehicle.category,
          description: editingVehicle.description,
          features: featuresList.join(','),
          isActive: editingVehicle.isActive
        })
      })

      if (response.ok) {
        setEditingVehicle(null)
        setFeaturesList([])
        loadVehicles()
        setError("")
      } else {
        const data = await response.json()
        setError(data.error || t('saveError'))
      }
    } catch (err) {
      setError(t('connectionError'))
    }
  }

  const handleCancelEdit = () => {
    setEditingVehicle(null)
    setFeaturesList([])
    setError("")
  }

  const handleImageUpload = (url: string) => {
    if (editingVehicle) {
      setEditingVehicle({ ...editingVehicle, photo: url })
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && !featuresList.includes(newFeature.trim())) {
      setFeaturesList([...featuresList, newFeature.trim()])
      setNewFeature("")
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index))
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    // Charger les features existantes
    if (vehicle.features) {
      setFeaturesList(vehicle.features.split(',').filter(f => f.trim()))
    } else {
      setFeaturesList([])
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || vehicle.type === filterType
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && vehicle.isActive) ||
      (filterStatus === "inactive" && !vehicle.isActive)

    return matchesSearch && matchesType && matchesStatus
  })

  const vehicleTypeLabels: Record<string, string> = {
    sedan: t('typeSedan'),
    suv: t('typeSuv'),
    van: t('typeVan'),
    minibus: t('typeMinibus'),
    luxury: t('typeLuxury'),
    bus: t('typeBus'),
  }

  const getVehicleTypeLabel = (type: string) => vehicleTypeLabels[type] || type

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#1F5245' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#12100E' }}>
            <Car size={24} weight="duotone" style={{ color: '#1F5245' }} />
            {t('title')}
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#6E6A63' }}>
            {vehicles.length > 1 ? t('vehicleCountPlural', { count: vehicles.length }) : t('vehicleCount', { count: vehicles.length })}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 font-semibold transition-colors inline-flex items-center gap-2"
            style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            <Plus size={18} weight="bold" />
            {t('addVehicle')}
          </button>
        )}
        {!canCreate && canRead && (
          <div className="px-6 py-3 font-medium inline-flex items-center gap-2" style={{ ...surfaceStyle, color: '#6E6A63' }}>
            <Eye size={18} />
            {t('readOnlyMode')}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.2)', color: '#B8493C', borderRadius: '3px' }}>
          {error}
        </div>
      )}

      {/* Modal d'édition unifié */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ ...cardStyle, borderRadius: '6px' }}>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#12100E' }}>
                <PencilSimple size={20} /> {t('editTitle')}
              </h3>

              <form onSubmit={handleSaveVehicle} className="space-y-6">
                {/* Informations essentielles */}
                <div className="p-4" style={surfaceStyle}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#12100E' }}>
                    {t('essentialInfo')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>{t('make')}</label>
                      <input
                        type="text"
                        value={editingVehicle.make}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>{t('model')}</label>
                      <input
                        type="text"
                        value={editingVehicle.model}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>{t('year')}</label>
                      <input
                        type="number"
                        value={editingVehicle.year}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, year: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                        required
                        min="1900"
                        max={new Date().getFullYear() + 2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>{t('type')}</label>
                      <select
                        value={editingVehicle.type}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, type: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                      >
                        <option value="sedan">{t('typeSedan')}</option>
                        <option value="suv">{t('typeSuv')}</option>
                        <option value="van">{t('typeVan')}</option>
                        <option value="minibus">{t('typeMinibus')}</option>
                        <option value="luxury">{t('typeLuxury')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>{t('capacity')}</label>
                      <select
                        value={editingVehicle.capacity}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                      >
                        <option value={2}>{t('seats', { count: 2 })}</option>
                        <option value={4}>{t('seats', { count: 4 })}</option>
                        <option value={6}>{t('seats', { count: 6 })}</option>
                        <option value={8}>{t('seats8Plus')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>{t('plateNumber')}</label>
                      <input
                        type="text"
                        value={editingVehicle.plateNumber}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, plateNumber: e.target.value.toUpperCase() })}
                        className="w-full px-2 py-1.5 text-sm outline-none font-mono"
                        style={inputStyle}
                        placeholder={t('plateNumberPlaceholder')}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <h4 className="text-sm font-medium mb-2" style={{ color: '#12100E' }}>{t('photoTitle')}</h4>
                  <ImageUploader
                    onUploadComplete={handleImageUpload}
                    currentImage={editingVehicle.photo}
                    className="mb-2"
                  />
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer" style={{ color: '#6E6A63' }}>{t('manualUrl')}</summary>
                    <input
                      type="url"
                      value={editingVehicle.photo || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, photo: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2 py-1 mt-1 text-xs"
                      style={{ ...inputStyle, borderRadius: '2px' }}
                    />
                  </details>
                </div>

                {/* Personnalisation (optionnel) */}
                <details className="p-3" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '4px' }}>
                  <summary className="text-sm font-medium cursor-pointer" style={{ color: '#1F5245' }}>
                    {t('customizationTitle')}
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>
                        {t('customCategory')}
                      </label>
                      <input
                        type="text"
                        value={editingVehicle.category || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, category: e.target.value })}
                        placeholder={t('customCategoryPlaceholder')}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6E6A63' }}>
                        {t('description')}
                      </label>
                      <textarea
                        value={editingVehicle.description || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                        placeholder={t('descriptionPlaceholder')}
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </details>

                {/* Équipements (optionnel) */}
                <details className="p-3" style={surfaceStyle}>
                  <summary className="text-sm font-medium cursor-pointer" style={{ color: '#12100E' }}>
                    {t('featuresTitle')}
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        placeholder={t('featuresPlaceholder')}
                        className="flex-1 px-2 py-1.5 text-sm outline-none"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-3 py-1.5 text-sm font-medium"
                        style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '3px' }}
                      >
                        + {t('addFeature')}
                      </button>
                    </div>

                    {featuresList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {featuresList.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs flex items-center gap-1"
                            style={{ backgroundColor: 'rgba(31,82,69,.08)', color: '#1F5245', border: '1px solid rgba(31,82,69,.2)', borderRadius: '2px' }}
                          >
                            {feature}
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index)}
                              className="text-sm font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </details>

                {/* Statut */}
                <div className="flex items-center pt-2" style={{ borderTop: '1px solid #E2DACD' }}>
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={editingVehicle.isActive}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, isActive: e.target.checked })}
                    className="h-4 w-4"
                    style={{ accentColor: '#1F5245' }}
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm" style={{ color: '#6E6A63' }}>
                    {t('activeCheckbox')}
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid #E2DACD' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2.5 font-semibold transition-colors"
                    style={{ ...surfaceStyle, color: '#12100E' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 font-semibold transition-colors"
                    style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px' }}
                  >
                    {t('update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deletingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full" style={{ ...cardStyle, borderRadius: '6px' }}>
            {/* Header avec icône d'avertissement */}
            <div className="p-4 sm:p-6" style={{ borderBottom: '1px solid rgba(184,73,60,.2)' }}>
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(184,73,60,.12)', color: '#B8493C' }}>
                  <Warning size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold" style={{ color: '#12100E' }}>
                    {t('confirmDeleteTitle')}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#6E6A63' }}>
                    {t('irreversible')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu avec les détails du véhicule */}
            <div className="p-4 sm:p-6">
              <p className="mb-4" style={{ color: '#6E6A63' }}>
                {t('confirmDeleteMessage')}
              </p>

              {/* Card du véhicule */}
              <div className="p-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px' }}>
                <div className="flex items-center gap-4">
                  {deletingVehicle.photo ? (
                    <div className="relative w-20 h-20 overflow-hidden shrink-0" style={{ borderRadius: '3px' }}>
                      <Image
                        src={deletingVehicle.photo}
                        alt={`${deletingVehicle.make} ${deletingVehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                      <Car size={32} style={{ color: '#6E6A63' }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base truncate" style={{ color: '#12100E' }}>
                      {deletingVehicle.make} {deletingVehicle.model}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: '#6E6A63' }}>
                      <span className="font-mono px-2 py-0.5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '2px' }}>
                        {deletingVehicle.plateNumber}
                      </span>
                      <span>•</span>
                      <span>{deletingVehicle.year}</span>
                      <span>•</span>
                      <span>{t('passengers', { count: deletingVehicle.capacity })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(180,100,58,.08)', border: '1px solid rgba(180,100,58,.25)', borderRadius: '3px' }}>
                <Warning size={18} weight="fill" className="shrink-0 mt-0.5" style={{ color: '#B4643A' }} />
                <p className="text-sm" style={{ color: '#3d3a35' }}>
                  {t('deleteWarning')}
                </p>
              </div>
            </div>

            {/* Footer avec boutons d'action */}
            <div className="px-4 sm:px-6 py-4 flex gap-3" style={{ backgroundColor: '#F7F3EC', borderTop: '1px solid #E2DACD' }}>
              <button
                type="button"
                onClick={() => setDeletingVehicle(null)}
                className="flex-1 px-6 py-3 font-semibold transition-all"
                style={{ backgroundColor: '#FFFFFF', color: '#12100E', border: '1px solid #E2DACD', borderRadius: '4px' }}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVehicle(deletingVehicle.id)}
                className="flex-1 px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: '#B8493C', color: '#fff', border: 'none', borderRadius: '4px' }}
              >
                <Trash size={18} /> {t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-6" style={cardStyle}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#12100E' }}>
              {t('searchLabel')}
            </label>
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 outline-none"
                style={{ ...surfaceStyle, borderRadius: '3px' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#12100E' }}>
              {t('typeFilterLabel')}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 outline-none"
              style={{ ...surfaceStyle, borderRadius: '3px', color: '#12100E' }}
            >
              <option value="all">{t('allTypes')}</option>
              <option value="sedan">{t('typeSedan')}</option>
              <option value="suv">{t('typeSuv')}</option>
              <option value="van">{t('typeVan')}</option>
              <option value="luxury">{t('typeLuxury')}</option>
              <option value="bus">{t('typeBus')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#12100E' }}>
              {t('statusLabel')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 outline-none"
              style={{ ...surfaceStyle, borderRadius: '3px', color: '#12100E' }}
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center" style={cardStyle}>
          <Car size={48} weight="light" className="mx-auto mb-4" style={{ color: '#6E6A63' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#12100E' }}>
            {t('noVehicleFound')}
          </h3>
          <p style={{ color: '#6E6A63' }}>
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? t('noVehicleMatch')
              : t('noVehicleStart')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="overflow-hidden"
              style={cardStyle}
            >
              {/* Image du véhicule */}
              {vehicle.photo ? (
                <div className="relative w-full h-48" style={{ backgroundColor: '#F7F3EC' }}>
                  <Image
                    src={vehicle.photo}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {vehicle.photo.includes('cloudinary.com') && (
                    <div
                      className="absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: '#1F5245' }}
                      title={t('cloudinaryOptimized')}
                    >
                      <span>📸</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1"
                    style={{ backgroundColor: vehicle.isActive ? '#1F5245' : '#6E6A63' }}>
                    {vehicle.isActive ? <CheckCircle size={12} weight="fill" /> : <Prohibit size={12} weight="fill" />}
                    {vehicle.isActive ? t('activeBadge') : t('inactiveBadge')}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-48 flex items-center justify-center" style={{ backgroundColor: 'rgba(31,82,69,.08)' }}>
                  <Car size={56} weight="duotone" style={{ color: '#1F5245' }} />
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: '#12100E' }}>
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm" style={{ color: '#6E6A63' }}>
                      {vehicle.year}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6E6A63' }}>{t('registration')}</span>
                    <span className="font-mono font-semibold" style={{ color: '#12100E' }}>
                      {vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6E6A63' }}>{t('typeField')}</span>
                    <span className="font-medium" style={{ color: '#12100E' }}>
                      {getVehicleTypeLabel(vehicle.type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6E6A63' }}>{t('capacityField')}</span>
                    <span className="font-medium" style={{ color: '#12100E' }}>
                      {t('passengers', { count: vehicle.capacity })}
                    </span>
                  </div>
                  {vehicle.driverName && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#6E6A63' }}>{t('driver')}</span>
                      <span className="font-medium" style={{ color: '#12100E' }}>
                        {vehicle.driverName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid #E2DACD' }}>
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => handleEditVehicle(vehicle)}
                      className="flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'rgba(31,82,69,.08)', color: '#1F5245', borderRadius: '3px' }}
                    >
                      <PencilSimple size={14} /> {t('edit')}
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(vehicle)}
                      className="flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      style={{ ...surfaceStyle, color: '#6E6A63', borderRadius: '3px' }}
                    >
                      {vehicle.isActive ? <Prohibit size={14} /> : <CheckCircle size={14} />}
                      {vehicle.isActive ? t('deactivate') : t('activate')}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeletingVehicle(vehicle)}
                      className="px-4 py-2 text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'rgba(184,73,60,.08)', color: '#B8493C', borderRadius: '3px' }}
                    >
                      <Trash size={14} />
                    </button>
                  )}
                  {!canUpdate && !canDelete && (
                    <div className="flex-1 text-center text-sm py-2 flex items-center justify-center gap-1.5" style={{ color: '#6E6A63' }}>
                      <Eye size={14} /> {t('readOnlyMode')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 text-center" style={cardStyle}>
          <div className="text-3xl font-bold" style={{ color: '#1F5245', fontFamily: 'var(--font-mono)' }}>
            {vehicles.length}
          </div>
          <div className="text-sm mt-1" style={{ color: '#6E6A63' }}>
            {t('statTotal')}
          </div>
        </div>
        <div className="p-6 text-center" style={cardStyle}>
          <div className="text-3xl font-bold" style={{ color: '#1F5245', fontFamily: 'var(--font-mono)' }}>
            {vehicles.filter(v => v.isActive).length}
          </div>
          <div className="text-sm mt-1" style={{ color: '#6E6A63' }}>
            {t('statActive')}
          </div>
        </div>
        <div className="p-6 text-center" style={cardStyle}>
          <div className="text-3xl font-bold" style={{ color: '#B8493C', fontFamily: 'var(--font-mono)' }}>
            {vehicles.filter(v => !v.isActive).length}
          </div>
          <div className="text-sm mt-1" style={{ color: '#6E6A63' }}>
            {t('statInactive')}
          </div>
        </div>
        <div className="p-6 text-center" style={cardStyle}>
          <div className="text-3xl font-bold" style={{ color: '#12100E', fontFamily: 'var(--font-mono)' }}>
            {Math.round(vehicles.reduce((acc, v) => acc + v.capacity, 0) / vehicles.length) || 0}
          </div>
          <div className="text-sm mt-1" style={{ color: '#6E6A63' }}>
            {t('statAvgCapacity')}
          </div>
        </div>
      </div>
    </div>
  )
}

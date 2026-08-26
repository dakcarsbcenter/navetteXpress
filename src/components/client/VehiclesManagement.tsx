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
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--color-client-accent)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
            <Car size={26} weight="duotone" style={{ color: 'var(--color-client-accent)' }} />
            {t('title')}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
            {vehicles.length > 1 ? t('vehicleCountPlural', { count: vehicles.length }) : t('vehicleCount', { count: vehicles.length })}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
          >
            <Plus size={18} weight="bold" />
            {t('addVehicle')}
          </button>
        )}
        {!canCreate && canRead && (
          <div className="px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2" style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-secondary)', border: '1px solid var(--color-client-border)' }}>
            <Eye size={18} />
            {t('readOnlyMode')}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Modal d'édition unifié */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                <PencilSimple size={22} /> {t('editTitle')}
              </h3>

              <form onSubmit={handleSaveVehicle} className="space-y-6">
                {/* Informations essentielles */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-client-text-primary)' }}>
                    {t('essentialInfo')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('make')}</label>
                      <input
                        type="text"
                        value={editingVehicle.make}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('model')}</label>
                      <input
                        type="text"
                        value={editingVehicle.model}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('year')}</label>
                      <input
                        type="number"
                        value={editingVehicle.year}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, year: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                        required
                        min="1900"
                        max={new Date().getFullYear() + 2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('type')}</label>
                      <select
                        value={editingVehicle.type}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, type: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                      >
                        <option value="sedan">{t('typeSedan')}</option>
                        <option value="suv">{t('typeSuv')}</option>
                        <option value="van">{t('typeVan')}</option>
                        <option value="minibus">{t('typeMinibus')}</option>
                        <option value="luxury">{t('typeLuxury')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('capacity')}</label>
                      <select
                        value={editingVehicle.capacity}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                      >
                        <option value={2}>{t('seats', { count: 2 })}</option>
                        <option value={4}>{t('seats', { count: 4 })}</option>
                        <option value={6}>{t('seats', { count: 6 })}</option>
                        <option value={8}>{t('seats8Plus')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('plateNumber')}</label>
                      <input
                        type="text"
                        value={editingVehicle.plateNumber}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, plateNumber: e.target.value.toUpperCase() })}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none font-mono"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                        placeholder={t('plateNumberPlaceholder')}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-client-text-primary)' }}>{t('photoTitle')}</h4>
                  <ImageUploader
                    onUploadComplete={handleImageUpload}
                    currentImage={editingVehicle.photo}
                    className="mb-2"
                  />
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-client-text-secondary)' }}>{t('manualUrl')}</summary>
                    <input
                      type="url"
                      value={editingVehicle.photo || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, photo: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2 py-1 mt-1 text-xs rounded"
                      style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                    />
                  </details>
                </div>

                {/* Personnalisation (optionnel) */}
                <details className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
                  <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-client-accent)' }}>
                    {t('customizationTitle')}
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>
                        {t('customCategory')}
                      </label>
                      <input
                        type="text"
                        value={editingVehicle.category || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, category: e.target.value })}
                        placeholder={t('customCategoryPlaceholder')}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>
                        {t('description')}
                      </label>
                      <textarea
                        value={editingVehicle.description || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                        placeholder={t('descriptionPlaceholder')}
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                      />
                    </div>
                  </div>
                </details>

                {/* Équipements (optionnel) */}
                <details className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                  <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-client-text-primary)' }}>
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
                        className="flex-1 px-2 py-1.5 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-3 py-1.5 rounded text-sm font-medium"
                        style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
                      >
                        + {t('addFeature')}
                      </button>
                    </div>

                    {featuresList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {featuresList.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs flex items-center gap-1"
                            style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}
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
                <div className="flex items-center pt-2" style={{ borderTop: '1px solid var(--color-client-border)' }}>
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={editingVehicle.isActive}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, isActive: e.target.checked })}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: 'var(--color-client-accent)' }}
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
                    {t('activeCheckbox')}
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-client-border)' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2.5 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-primary)', border: '1px solid var(--color-client-border)' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            {/* Header avec icône d'avertissement */}
            <div className="p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), transparent)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                  <Warning size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--color-client-text-primary)' }}>
                    {t('confirmDeleteTitle')}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
                    {t('irreversible')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu avec les détails du véhicule */}
            <div className="p-6">
              <p className="mb-4" style={{ color: 'var(--color-client-text-secondary)' }}>
                {t('confirmDeleteMessage')}
              </p>

              {/* Card du véhicule */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-client-surface)', border: '2px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-center gap-4">
                  {deletingVehicle.photo ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={deletingVehicle.photo}
                        alt={`${deletingVehicle.make} ${deletingVehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                      <Car size={32} style={{ color: 'var(--color-client-text-secondary)' }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg truncate" style={{ color: 'var(--color-client-text-primary)' }}>
                      {deletingVehicle.make} {deletingVehicle.model}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
                      <span className="font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
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

              <div className="mt-4 rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Warning size={18} weight="fill" className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                <p className="text-sm" style={{ color: '#B45309' }}>
                  {t('deleteWarning')}
                </p>
              </div>
            </div>

            {/* Footer avec boutons d'action */}
            <div className="px-6 py-4 rounded-b-2xl flex gap-3" style={{ backgroundColor: 'var(--color-client-surface)' }}>
              <button
                onClick={() => setDeletingVehicle(null)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: 'var(--color-client-card)', color: 'var(--color-client-text-primary)', border: '2px solid var(--color-client-border)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDeleteVehicle(deletingVehicle.id)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: '#EF4444', color: '#fff' }}
              >
                <Trash size={18} /> {t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-client-text-primary)' }}>
              {t('searchLabel')}
            </label>
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-client-text-secondary)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 rounded-lg outline-none"
                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-client-text-primary)' }}>
              {t('typeFilterLabel')}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg outline-none"
              style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
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
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-client-text-primary)' }}>
              {t('statusLabel')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg outline-none"
              style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
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
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <Car size={48} weight="light" className="mx-auto mb-4" style={{ color: 'var(--color-client-text-secondary)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-client-text-primary)' }}>
            {t('noVehicleFound')}
          </h3>
          <p style={{ color: 'var(--color-client-text-secondary)' }}>
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
              className="rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
              style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}
            >
              {/* Image du véhicule */}
              {vehicle.photo ? (
                <div className="relative w-full h-48" style={{ backgroundColor: 'var(--color-client-surface)' }}>
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
                      style={{ backgroundColor: 'var(--color-client-accent)' }}
                      title={t('cloudinaryOptimized')}
                    >
                      <span>📸</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1"
                    style={{ backgroundColor: vehicle.isActive ? 'var(--color-client-accent)' : '#6B7280' }}>
                    {vehicle.isActive ? <CheckCircle size={12} weight="fill" /> : <Prohibit size={12} weight="fill" />}
                    {vehicle.isActive ? t('activeBadge') : t('inactiveBadge')}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-48 flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-accent-bg)' }}>
                  <Car size={56} weight="duotone" style={{ color: 'var(--color-client-accent)' }} />
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-client-text-primary)' }}>
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
                      {vehicle.year}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('registration')}</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--color-client-text-primary)' }}>
                      {vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('typeField')}</span>
                    <span className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>
                      {getVehicleTypeLabel(vehicle.type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('capacityField')}</span>
                    <span className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>
                      {t('passengers', { count: vehicle.capacity })}
                    </span>
                  </div>
                  {vehicle.driverName && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('driver')}</span>
                      <span className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>
                        {vehicle.driverName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid var(--color-client-border)' }}>
                  {canUpdate && (
                    <button
                      onClick={() => handleEditVehicle(vehicle)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}
                    >
                      <PencilSimple size={14} /> {t('edit')}
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      onClick={() => handleToggleStatus(vehicle)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-secondary)' }}
                    >
                      {vehicle.isActive ? <Prohibit size={14} /> : <CheckCircle size={14} />}
                      {vehicle.isActive ? t('deactivate') : t('activate')}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeletingVehicle(vehicle)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                    >
                      <Trash size={14} />
                    </button>
                  )}
                  {!canUpdate && !canDelete && (
                    <div className="flex-1 text-center text-sm py-2 flex items-center justify-center gap-1.5" style={{ color: 'var(--color-client-text-secondary)' }}>
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
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>
            {vehicles.length}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
            {t('statTotal')}
          </div>
        </div>
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>
            {vehicles.filter(v => v.isActive).length}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
            {t('statActive')}
          </div>
        </div>
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="text-3xl font-bold" style={{ color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
            {vehicles.filter(v => !v.isActive).length}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
            {t('statInactive')}
          </div>
        </div>
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-client-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(vehicles.reduce((acc, v) => acc + v.capacity, 0) / vehicles.length) || 0}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
            {t('statAvgCapacity')}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { ImageUploader } from "@/components/ImageUploader"

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
        setError("Erreur lors du chargement des véhicules")
      }
    } catch (err) {
      setError("Erreur de connexion")
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
        setError(data.error || "Erreur lors de la suppression")
        setDeletingVehicle(null)
      }
    } catch (err) {
      setError("Erreur de connexion")
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
        setError(data.error || "Erreur lors de la mise à jour")
      }
    } catch (err) {
      setError("Erreur de connexion")
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
        setError(data.error || "Erreur lors de la sauvegarde")
      }
    } catch (err) {
      setError("Erreur de connexion")
    }
  }

  const handleCancelEdit = () => {
    setEditingVehicle(null)
    setFeaturesList([])
    setError("")
  }

  const handleImageUpload = (url: string) => {
    if (editingVehicle) {
      setEditingVehicle({...editingVehicle, photo: url})
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

  const getVehicleTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sedan: 'Berline',
      suv: 'SUV',
      van: 'Van',
      luxury: 'Luxe',
      bus: 'Bus'
    }
    return types[type] || type
  }

  const getVehicleTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      sedan: '🚗',
      suv: '🚙',
      van: '🚐',
      luxury: '🚘',
      bus: '🚌'
    }
    return icons[type] || '🚗'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-3xl">🚗</span>
            Gestion de la flotte
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} au total
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Ajouter un véhicule
          </button>
        )}
        {!canCreate && canRead && (
          <div className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2">
            <span className="text-xl">👁️</span>
            Mode lecture seule
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Modal d'édition unifié */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                ✏️ Modifier le véhicule
              </h3>
              
              <form onSubmit={handleSaveVehicle} className="space-y-6">
                {/* 📋 Informations essentielles */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    📋 Informations essentielles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Marque *</label>
                      <input
                        type="text"
                        value={editingVehicle.make}
                        onChange={(e) => setEditingVehicle({...editingVehicle, make: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modèle *</label>
                      <input
                        type="text"
                        value={editingVehicle.model}
                        onChange={(e) => setEditingVehicle({...editingVehicle, model: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Année *</label>
                      <input
                        type="number"
                        value={editingVehicle.year}
                        onChange={(e) => setEditingVehicle({...editingVehicle, year: parseInt(e.target.value)})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                        min="1900"
                        max={new Date().getFullYear() + 2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">🏷️ Type *</label>
                      <select
                        value={editingVehicle.type}
                        onChange={(e) => setEditingVehicle({...editingVehicle, type: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="sedan">Berline</option>
                        <option value="suv">SUV</option>
                        <option value="van">Van</option>
                        <option value="minibus">Minibus</option>
                        <option value="luxury">Luxe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">👥 Capacité *</label>
                      <select
                        value={editingVehicle.capacity}
                        onChange={(e) => setEditingVehicle({...editingVehicle, capacity: parseInt(e.target.value)})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={2}>2 places</option>
                        <option value={4}>4 places</option>
                        <option value={6}>6 places</option>
                        <option value={8}>8+ places</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plaque d'immatriculation *</label>
                      <input
                        type="text"
                        value={editingVehicle.plateNumber}
                        onChange={(e) => setEditingVehicle({...editingVehicle, plateNumber: e.target.value.toUpperCase()})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                        placeholder="AB-123-CD"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 📸 Photo */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">📸 Photo du véhicule *</h4>
                  <ImageUploader 
                    onUploadComplete={handleImageUpload}
                    currentImage={editingVehicle.photo}
                    className="mb-2"
                  />
                  <details className="mt-1">
                    <summary className="text-xs text-slate-500 cursor-pointer">URL manuelle</summary>
                    <input
                      type="url"
                      value={editingVehicle.photo || ''}
                      onChange={(e) => setEditingVehicle({...editingVehicle, photo: e.target.value})}
                      placeholder="https://..."
                      className="w-full px-2 py-1 mt-1 text-xs border rounded dark:bg-gray-700 dark:text-white"
                    />
                  </details>
                </div>

                {/* 🎨 Personnalisation (optionnel) */}
                <details className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <summary className="text-sm font-medium text-blue-700 dark:text-blue-300 cursor-pointer">
                    🎨 Personnalisation page Flotte (optionnel)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Catégorie personnalisée 🏷️
                      </label>
                      <input
                        type="text"
                        value={editingVehicle.category || ''}
                        onChange={(e) => setEditingVehicle({...editingVehicle, category: e.target.value})}
                        placeholder="Ex: Berline Executive, SUV Premium..."
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Description 📝
                      </label>
                      <textarea
                        value={editingVehicle.description || ''}
                        onChange={(e) => setEditingVehicle({...editingVehicle, description: e.target.value})}
                        placeholder="Description pour la page publique..."
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </details>

                {/* ⚙️ Équipements (optionnel) */}
                <details className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <summary className="text-sm font-medium text-green-700 dark:text-green-300 cursor-pointer">
                    ⚙️ Équipements et services (optionnel)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        placeholder="Ex: Wi-Fi, Climatisation..."
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                      >
                        + Ajouter
                      </button>
                    </div>
                    
                    {featuresList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {featuresList.map((feature, index) => (
                          <span
                            key={index}
                            className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs flex items-center gap-1"
                          >
                            {feature}
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index)}
                              className="text-green-600 dark:text-green-300 hover:text-green-800 text-sm font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </details>

                {/* ✅ Statut */}
                <div className="flex items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={editingVehicle.isActive}
                    onChange={(e) => setEditingVehicle({...editingVehicle, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Véhicule actif (visible sur la page Flotte)
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    ❌ Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    💾 Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deletingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
            {/* Header avec icône d'avertissement */}
            <div className="bg-linear-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-t-2xl border-b border-red-100 dark:border-red-800">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Confirmer la suppression
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Cette action est irréversible
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu avec les détails du véhicule */}
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Êtes-vous sûr de vouloir supprimer ce véhicule ?
              </p>
              
              {/* Card du véhicule */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
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
                    <div className="w-20 h-20 bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-3xl">{getVehicleTypeIcon(deletingVehicle.type)}</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                      {deletingVehicle.make} {deletingVehicle.model}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {deletingVehicle.plateNumber}
                      </span>
                      <span>•</span>
                      <span>{deletingVehicle.year}</span>
                      <span>•</span>
                      <span>{deletingVehicle.capacity} places</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Attention :</strong> Toutes les données associées à ce véhicule seront définitivement perdues.
                </p>
              </div>
            </div>

            {/* Footer avec boutons d'action */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setDeletingVehicle(null)}
                className="flex-1 px-6 py-3 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all duration-200 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 shadow-sm hover:shadow"
              >
                ❌ Annuler
              </button>
              <button
                onClick={() => handleDeleteVehicle(deletingVehicle.id)}
                className="flex-1 px-6 py-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                🗑️ Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              🔍 Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Marque, modèle, immatriculation..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              🚙 Type de véhicule
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">Tous les types</option>
              <option value="sedan">Berline</option>
              <option value="suv">SUV</option>
              <option value="van">Van</option>
              <option value="luxury">Luxe</option>
              <option value="bus">Bus</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              📊 Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Aucun véhicule trouvé
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? "Aucun véhicule ne correspond à vos critères de recherche"
              : "Commencez par ajouter votre premier véhicule"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image du véhicule */}
              {vehicle.photo && (
                <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-700">
                  <Image
                    src={vehicle.photo}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Badge Cloudinary */}
                  {vehicle.photo.includes('cloudinary.com') && (
                    <div 
                      className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      title="Image optimisée par Cloudinary"
                    >
                      <span>📸</span>
                    </div>
                  )}
                  {/* Badge Statut */}
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium ${
                    vehicle.isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {vehicle.isActive ? '✅ Actif' : '🚫 Inactif'}
                  </div>
                </div>
              )}
              
              {/* Placeholder si pas d'image */}
              {!vehicle.photo && (
                <div className="relative w-full h-48 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">{getVehicleTypeIcon(vehicle.type)}</span>
                </div>
              )}
              
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {vehicle.year}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Immatriculation</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Type</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {getVehicleTypeLabel(vehicle.type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Capacité</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.capacity} passagers
                    </span>
                  </div>
                  {vehicle.driverName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Chauffeur</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {vehicle.driverName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {canUpdate && (
                    <button
                      onClick={() => handleEditVehicle(vehicle)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Modifier
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      onClick={() => handleToggleStatus(vehicle)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {vehicle.isActive ? '🚫 Désactiver' : '✅ Activer'}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeletingVehicle(vehicle)}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                  {!canUpdate && !canDelete && (
                    <div className="flex-1 text-center text-sm text-slate-500 dark:text-slate-400 py-2">
                      👁️ Mode lecture seule
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {vehicles.length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total véhicules
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {vehicles.filter(v => v.isActive).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Actifs
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {vehicles.filter(v => !v.isActive).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Inactifs
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(vehicles.reduce((acc, v) => acc + v.capacity, 0) / vehicles.length) || 0}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Capacité moy.
          </div>
        </div>
      </div>
    </div>
  )
}


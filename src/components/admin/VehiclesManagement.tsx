"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { FilterBar } from "@/components/ui/FilterBar"
import { useNotification } from "@/hooks/useNotification"
import { ImageUploader } from "@/components/ImageUploader"
import { usePermissions } from "@/hooks/usePermissions"

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
}

interface Driver {
  id: string
  name: string
  email: string
  phone?: string
  isActive: boolean
}

export function VehiclesManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  const { canDelete } = usePermissions()
  const [filters, setFilters] = useState({
    capacity: '',
    status: '',
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
  
  // État pour gérer les features comme tableau
  const [featuresList, setFeaturesList] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchVehicles()
    fetchDrivers()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, filters])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles')
      if (response.ok) {
        const result = await response.json()
        if (result?.success) {
          setVehicles(result.data ?? [])
        } else {
          console.error('Erreur lors du chargement des véhicules:', result?.error)
          setVehicles([])
        }
      } else {
        console.error('Erreur HTTP:', response.status)
        setVehicles([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      setVehicles([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=driver')
      if (response.ok) {
        const result = await response.json()
        if (result?.success) {
          console.log('🚗 Chauffeurs chargés:', result.data?.length || 0)
          setDrivers(result.data ?? [])
        } else {
          console.error('❌ Erreur lors du chargement des chauffeurs:', result?.error)
          setDrivers([])
        }
      } else {
        console.error('❌ Réponse HTTP:', response.status)
        setDrivers([])
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des chauffeurs:', error)
      setDrivers([])
    }
  }

  const applyFilters = () => {
    let filtered = [...vehicles]

    // Filtre par capacité
    if (filters.capacity) {
      filtered = filtered.filter(vehicle => vehicle.capacity === parseInt(filters.capacity))
    }

    // Filtre par statut
    if (filters.status) {
      if (filters.status === 'active') {
        filtered = filtered.filter(vehicle => vehicle.isActive)
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(vehicle => !vehicle.isActive)
      }
    }

    // Filtre par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(vehicle => 
        vehicle.make.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        vehicle.plateNumber.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredVehicles(filtered)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      capacity: '',
      status: '',
      search: ''
    })
  }

  const getFilterCounts = () => {
    const capacityCounts = {
      2: vehicles.filter(v => v.capacity === 2).length,
      4: vehicles.filter(v => v.capacity === 4).length,
      6: vehicles.filter(v => v.capacity === 6).length,
      8: vehicles.filter(v => v.capacity === 8).length
    }
    
    const statusCounts = {
      active: vehicles.filter(v => v.isActive).length,
      inactive: vehicles.filter(v => !v.isActive).length
    }

    return { capacityCounts, statusCounts }
  }

  // Fonction pour gérer l'upload d'image Cloudinary
  const handleImageUpload = (url: string) => {
    console.log('✅ Image uploadée vers Cloudinary:', url);
    setFormData(prev => ({ ...prev, photo: url }));
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation de l'image obligatoire
    if (!formData.photo || !formData.photo.trim()) {
      showError('Veuillez uploader une photo du véhicule', 'Photo obligatoire')
      return
    }
    
    try {
      // Convertir featuresList en JSON string
      const dataToSend = {
        ...formData,
        features: JSON.stringify(featuresList),
      }
      
      const response = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (response.ok) {
        await fetchVehicles()
        setIsModalOpen(false)
        resetForm()
        showSuccess('Véhicule créé avec succès', 'Création réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la création')
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      showError('Une erreur est survenue lors de la création du véhicule', 'Erreur technique')
    }
  }

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return
    
    // Validation de l'image obligatoire
    if (!formData.photo || !formData.photo.trim()) {
      showError('Veuillez uploader une photo du véhicule', 'Photo obligatoire')
      return
    }
    
    try {
      // Convertir featuresList en JSON string
      const dataToSend = {
        ...formData,
        features: JSON.stringify(featuresList),
      }
      
      const response = await fetch(`/api/admin/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (response.ok) {
        await fetchVehicles()
        setIsModalOpen(false)
        setEditingVehicle(null)
        resetForm()
        showSuccess('Véhicule mis à jour avec succès', 'Mise à jour réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError('Une erreur est survenue lors de la mise à jour du véhicule', 'Erreur technique')
    }
  }

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return
    
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchVehicles()
        showSuccess('Véhicule supprimé avec succès', 'Suppression réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError('Une erreur est survenue lors de la suppression du véhicule', 'Erreur technique')
    }
  }

  const resetForm = () => {
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
    setFeaturesList([])
    setNewFeature('')
  }
  
  // Gérer l'ajout d'une feature
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeaturesList([...featuresList, newFeature.trim()])
      setNewFeature('')
    }
  }
  
  // Supprimer une feature
  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index))
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    
    // Parser les features si elles existent
    let parsedFeatures: string[] = []
    if (vehicle.features) {
      try {
        parsedFeatures = JSON.parse(vehicle.features)
      } catch {
        parsedFeatures = []
      }
    }
    
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
    setFeaturesList(parsedFeatures)
    fetchDrivers() // Recharger les chauffeurs à l'ouverture du modal
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingVehicle(null)
    resetForm()
    fetchDrivers() // Charger les chauffeurs à l'ouverture du modal
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des véhicules
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nouveau véhicule
        </button>
      </div>

      {/* Barre de filtres */}
      <FilterBar
        filters={{
          capacity: {
            label: 'Capacité',
            options: [
              { value: '', label: 'Toutes les capacités' },
              { value: '2', label: '🚗 2 places', count: getFilterCounts().capacityCounts[2] },
              { value: '4', label: '🚙 4 places', count: getFilterCounts().capacityCounts[4] },
              { value: '6', label: '🚐 6 places', count: getFilterCounts().capacityCounts[6] },
              { value: '8', label: '🚌 8+ places', count: getFilterCounts().capacityCounts[8] }
            ],
            value: filters.capacity,
            onChange: (value) => handleFilterChange('capacity', value)
          },
          status: {
            label: 'Statut',
            options: [
              { value: '', label: 'Tous les statuts' },
              { value: 'active', label: '✅ Actif', count: getFilterCounts().statusCounts.active },
              { value: 'inactive', label: '❌ Inactif', count: getFilterCounts().statusCounts.inactive }
            ],
            value: filters.status,
            onChange: (value) => handleFilterChange('status', value)
          },
          search: {
            label: 'Recherche',
            type: 'search',
            placeholder: 'Marque, modèle, plaque...',
            value: filters.search,
            onChange: (value) => handleFilterChange('search', value)
          }
        }}
        onClearAll={clearAllFilters}
        activeFiltersCount={Object.values(filters).filter(v => v !== '').length}
      />

      {/* Tableau des véhicules */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plaque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Capacité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-10 w-10">
                      {vehicle.photo ? (
                        <div className="relative h-10 w-10 rounded overflow-hidden">
                          <Image
                            fill
                            className="object-cover"
                            src={vehicle.photo}
                            alt={`Photo de ${vehicle.make} ${vehicle.model}`}
                            sizes="40px"
                          />
                        </div>
                      ) : null}
                      <div className={`h-10 w-10 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium ${vehicle.photo ? 'hidden' : ''}`}>
                        🚗
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {vehicle.make} {vehicle.model}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.plateNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.capacity} places
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      vehicle.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    }`}>
                      {vehicle.isActive ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const action = e.target.value
                          if (action === 'edit') {
                            openEditModal(vehicle)
                          } else if (action === 'delete') {
                            handleDeleteVehicle(vehicle.id)
                          }
                          e.target.value = ''
                        }}
                        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-300"
                      >
                        <option value="">Actions...</option>
                        <option value="edit">Modifier</option>
                        {canDelete('vehicles') && (
                          <option value="delete" className="text-red-600">Supprimer</option>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h3>
            
            <form onSubmit={editingVehicle ? handleUpdateVehicle : handleCreateVehicle} className="space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* 📋 Informations de base */}
              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">📋 Informations essentielles</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Marque *</label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({...formData, make: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Mercedes"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modèle *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Classe S"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Année *</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      min="2000"
                      max="2030"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type *</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="sedan">Berline</option>
                      <option value="luxury">Luxe</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                      <option value="bus">Bus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacité *</label>
                    <select
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={2}>2 places</option>
                      <option value={4}>4 places</option>
                      <option value={6}>6 places</option>
                      <option value={8}>8+ places</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">👨‍💼 Chauffeur</label>
                    <select
                      value={formData.driverId}
                      onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Aucun</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plaque d'immatriculation *</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="AB-123-CD"
                    required
                  />
                </div>
              </div>

              {/* 📸 Photo */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">📸 Photo du véhicule *</h4>
                <ImageUploader 
                  onUploadComplete={handleImageUpload}
                  currentImage={formData.photo}
                  className="mb-2"
                />
                <details className="mt-1">
                  <summary className="text-xs text-slate-500 cursor-pointer">URL manuelle</summary>
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) => setFormData({...formData, photo: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-2 py-1 mt-1 text-xs border rounded dark:bg-gray-700 dark:text-white"
                  />
                </details>
              </div>

              {/* 🎨 Informations optionnelles (pliable) */}
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
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Ex: Berline Executive, SUV Premium..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Description 📝
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Description pour la page publique..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </details>

              {/* ⚙️ Équipements (dans section optionnelle) */}
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
              
              <div className="flex items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Véhicule actif (visible sur la page Flotte)
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  {editingVehicle ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centre de notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
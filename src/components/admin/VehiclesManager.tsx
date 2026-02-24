"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SelectVehicle, SelectDriver, InsertVehicle } from '@/schema';
import { ImageUploader } from '@/components/ImageUploader';
import DeleteVehicleModal from '@/components/admin/DeleteVehicleModal';

interface VehicleWithDriver {
  vehicle: SelectVehicle;
  driver: SelectDriver | null;
}

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [drivers, setDrivers] = useState<SelectDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<SelectVehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; vehicle: SelectVehicle | null }>({ open: false, vehicle: null });

  // Formulaire état
  const [formData, setFormData] = useState<Partial<InsertVehicle>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    capacity: 4,
    photo: '',
    category: '',
    description: '',
    features: '',
    vehicleType: 'sedan',
    driverId: null,
    isActive: true,
  });
  
  // État pour gérer les features comme tableau temporaire
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  // Fonction pour gérer l'upload d'image Cloudinary
  const handleImageUpload = (url: string) => {
    console.log('✅ Image uploadée vers Cloudinary:', url);
    setFormData(prev => ({ ...prev, photo: url }));
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles');
      const result = await response.json();
      
      if (result.success) {
        setVehicles(result.data);
      } else {
        console.error('Erreur lors du chargement des véhicules:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      const result = await response.json();
      
      if (result.success) {
        setDrivers(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de l'image
    if (!formData.photo) {
      alert('⚠️ Veuillez uploader une photo du véhicule');
      return;
    }
    
    try {
      // Convertir featuresList en JSON string
      const dataToSend = {
        ...formData,
        features: JSON.stringify(featuresList),
      };
      
      const url = editingVehicle 
        ? `/api/admin/vehicles/${editingVehicle.id}`
        : '/api/admin/vehicles';
      
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchVehicles();
        resetForm();
        const isCloudinary = formData.photo.includes('cloudinary.com');
        const message = editingVehicle 
          ? `✅ Véhicule modifié avec succès! ${isCloudinary ? '📸 Image optimisée par Cloudinary' : ''}`
          : `✅ Véhicule créé avec succès! ${isCloudinary ? '📸 Image optimisée par Cloudinary' : ''}`;
        alert(message);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/vehicles/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchVehicles();
        // suppression réussie
      } else {
        console.error('Erreur: ', result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setDeleteConfirm({ open: false, vehicle: null });
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plateNumber: '',
      capacity: 4,
      photo: '',
      category: '',
      description: '',
      features: '',
      vehicleType: 'sedan',
      driverId: null,
      isActive: true,
    });
    setFeaturesList([]);
    setNewFeature('');
    setEditingVehicle(null);
    setShowAddForm(false);
  };

  const startEdit = (vehicle: SelectVehicle) => {
    // Parser les features si elles existent
    let parsedFeatures: string[] = [];
    if (vehicle.features) {
      try {
        parsedFeatures = JSON.parse(vehicle.features);
      } catch {
        parsedFeatures = [];
      }
    }
    
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category || '',
      description: vehicle.description || '',
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      capacity: vehicle.capacity,
      photo: vehicle.photo || '',
      vehicleType: vehicle.vehicleType,
      driverId: vehicle.driverId,
      isActive: vehicle.isActive,
    });
    setFeaturesList(parsedFeatures);
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };
  
  // Gérer l'ajout d'une feature
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeaturesList([...featuresList, newFeature.trim()]);
      setNewFeature('');
    }
  };
  
  // Supprimer une feature
  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  const filteredVehicles = vehicles.filter(item => {
    if (!item || !item.vehicle) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.vehicle.make?.toLowerCase().includes(searchLower) ||
      item.vehicle.model?.toLowerCase().includes(searchLower) ||
      item.vehicle.plateNumber?.toLowerCase().includes(searchLower) ||
      item.driver?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Gestion des Véhicules
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Nouveau Véhicule
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher par marque, modèle, plaque ou chauffeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{vehicles.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter(v => v?.vehicle?.isActive).length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(vehicles.reduce((acc, v) => acc + (v?.vehicle?.capacity || 0), 0) / vehicles.length) || 0}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Places moy.</div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {editingVehicle ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Marque
                </label>
                <input
                  type="text"
                  value={formData.make || ''}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Modèle
                </label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Année
                </label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plaque d&apos;immatriculation
                </label>
                <input
                  type="text"
                  value={formData.plateNumber || ''}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Capacité (passagers)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  📸 Photo du véhicule *
                </label>
                <ImageUploader 
                  onUploadComplete={handleImageUpload}
                  currentImage={formData.photo}
                  className="mb-4"
                />
                
                {/* Option URL manuelle */}
                <details className="mt-2">
                  <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                    ⚙️ Saisir une URL manuellement (optionnel)
                  </summary>
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <input
                      type="url"
                      value={formData.photo || ''}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      placeholder="https://exemple.com/photo-vehicule.jpg"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      ⚠️ Utilisez de préférence l'upload Cloudinary ci-dessus
                    </p>
                  </div>
                </details>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  ✓ Upload automatique vers Cloudinary avec optimisation et CDN
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type de véhicule
                </label>
                <select
                  value={formData.vehicleType || 'sedan'}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as 'sedan' | 'luxury' | 'suv' | 'van' | 'bus' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                >
                  <option value="sedan">Berline</option>
                  <option value="luxury">Berline de Luxe</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie personnalisée (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Berline Executive"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description pour la page Flotte
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du véhicule pour la page publique"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Équipements (affichés sur la page Flotte)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      placeholder="Ex: Wi-Fi gratuit, Climatisation, etc."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      + Ajouter
                    </button>
                  </div>
                  
                  {featuresList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {featuresList.map((feature, index) => (
                        <div
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Chauffeur assigné (optionnel)
                </label>
                <select
                  value={formData.driverId || ''}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value ? e.target.value : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Aucun chauffeur assigné</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActiveVehicle"
                checked={formData.isActive || false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActiveVehicle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Véhicule disponible
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingVehicle ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des véhicules */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Véhicules ({filteredVehicles.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Véhicule</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Plaque</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Chauffeur</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Capacité</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Statut</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((item) => (
                <tr key={item.vehicle.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {item.vehicle.photo && (
                        <div className="relative w-12 h-8 rounded overflow-hidden group">
                          <Image
                            src={item.vehicle.photo}
                            alt={`${item.vehicle.make} ${item.vehicle.model}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                            sizes="48px"
                          />
                          {item.vehicle.photo.includes('cloudinary.com') && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" 
                                 title="Image optimisée par Cloudinary">
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {item.vehicle.make} {item.vehicle.model}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {item.vehicle.year}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {item.vehicle.plateNumber}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="text-sm">
                      <div className="text-slate-900 dark:text-white">
                        {item.driver?.name || 'Non assigné'}
                      </div>
                      {item.driver && (
                        <div className="text-slate-500 dark:text-slate-400">
                          {item.driver.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-900 dark:text-white">
                      {item.vehicle.capacity} places
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.vehicle.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    }`}>
                      {item.vehicle.isActive ? 'Disponible' : 'Indisponible'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item.vehicle)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, vehicle: item.vehicle })}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Aucun véhicule trouvé
            </div>
          )}
        </div>
      </div>
    </div>

    <DeleteVehicleModal
      isOpen={deleteConfirm.open}
      vehicle={deleteConfirm.vehicle as any}
      onCancel={() => setDeleteConfirm({ open: false, vehicle: null })}
      onConfirm={() => handleDelete(deleteConfirm.vehicle!.id)}
    />
  </>
  );
}









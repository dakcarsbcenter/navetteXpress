'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Page d'ajout de véhicule avec upload d'image Cloudinary
 * Accès: /admin/vehicles/add
 */
export default function AddVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    photo: '', // URL Cloudinary
    capacity: 4,
    vehicleType: 'sedan',
    description: '',
    features: [] as string[],
    driverId: '',
  });

  const [drivers, setDrivers] = useState<{id: string; name: string; email: string}[]>([]);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=driver');
      if (response.ok) {
        const result = await response.json();
        if (result?.success) {
          console.log('🚗 Chauffeurs chargés dans page ajout:', result.data?.length || 0);
          setDrivers(result.data ?? []);
        } else {
          console.error('❌ Erreur chargement chauffeurs:', result?.error);
        }
      } else {
        console.error('❌ Réponse HTTP:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des chauffeurs:', error);
    }
  };

  const handleImageUpload = (url: string) => {
    console.log('✅ Image uploadée:', url);
    setVehicleData(prev => ({ ...prev, photo: url }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setVehicleData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setVehicleData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!vehicleData.photo) {
      setError('⚠️ Veuillez uploader une photo du véhicule');
      return;
    }

    if (!vehicleData.make || !vehicleData.model) {
      setError('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Préparer les données
      const dataToSend = {
        ...vehicleData,
        features: JSON.stringify(vehicleData.features),
      };

      // Envoyer à l'API
      const response = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du véhicule');
      }

      // Succès !
      alert('✅ Véhicule ajouté avec succès !');
      router.push('/admin/vehicles');
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du véhicule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/vehicles"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🚗 Ajouter un Véhicule
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Ajoutez un nouveau véhicule à votre flotte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Photo du véhicule */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              📸 Photo du véhicule
            </h2>
            <ImageUploader 
              onUploadComplete={handleImageUpload}
              currentImage={vehicleData.photo}
            />
          </div>

          {/* Informations du véhicule */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              📋 Informations
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Marque */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Marque *
                </label>
                <input
                  type="text"
                  value={vehicleData.make}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                  placeholder="Mercedes, BMW, Audi..."
                  required
                />
              </div>

              {/* Modèle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Modèle *
                </label>
                <input
                  type="text"
                  value={vehicleData.model}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                  placeholder="Classe S, Série 7, A8..."
                  required
                />
              </div>

              {/* Année */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Année *
                </label>
                <input
                  type="number"
                  value={vehicleData.year}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                  min="2015"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>

              {/* Type de véhicule */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type de véhicule *
                </label>
                <select
                  value={vehicleData.vehicleType}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                  required
                >
                  <option value="sedan">Berline</option>
                  <option value="luxury">Berline de Luxe</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                </select>
              </div>

              {/* Capacité */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre de passagers *
                </label>
                <input
                  type="number"
                  value={vehicleData.capacity}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                  min="1"
                  max="50"
                  required
                />
              </div>

              {/* Chauffeur assigné */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  👨‍💼 Chauffeur assigné (optionnel)
                </label>
                <select
                  value={vehicleData.driverId}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, driverId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                >
                  <option value="">Aucun chauffeur assigné</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.email}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Assignez ce véhicule à un chauffeur spécifique pour une gestion optimisée
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={vehicleData.description}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors"
                  rows={4}
                  placeholder="Décrivez les caractéristiques du véhicule..."
                />
              </div>
            </div>
          </div>

          {/* Équipements */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              ⭐ Équipements
            </h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="WiFi, Climatisation, Sièges cuir..."
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium
                  transition-colors"
              >
                Ajouter
              </button>
            </div>

            {vehicleData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vehicleData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 
                      text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm"
                  >
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !vehicleData.photo}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 
                text-white px-6 py-3 rounded-xl font-semibold text-lg
                transition-colors duration-200 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter le véhicule
                </>
              )}
            </button>
            <Link
              href="/admin/vehicles"
              className="px-6 py-3 rounded-xl font-semibold text-lg border-2 border-slate-300 dark:border-slate-600
                text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800
                transition-colors duration-200 flex items-center justify-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}




'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Page pour remplacer les images cassées par des placeholders Unsplash
 */
export default function FixBrokenImagesPage() {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<number>>(new Set());

  // Images de secours par type de véhicule
  const fallbackImages: Record<string, string> = {
    'sedan': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop',
    'luxury': 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&h=600&fit=crop',
    'suv': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop',
    'van': 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800&h=600&fit=crop',
    'bus': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleVehicle = (id: number) => {
    const newSet = new Set(selectedVehicles);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedVehicles(newSet);
  };

  const selectAll = () => {
    setSelectedVehicles(new Set(vehicles.map(v => v.id)));
  };

  const deselectAll = () => {
    setSelectedVehicles(new Set());
  };

  const fixSelectedImages = async () => {
    if (selectedVehicles.size === 0) {
      alert('Sélectionnez au moins un véhicule');
      return;
    }

    setLoading(true);
    let fixed = 0;

    for (const vehicleId of selectedVehicles) {
      try {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) continue;

        // Choisir l'image de secours selon le type
        const fallbackUrl = fallbackImages[vehicle.vehicleType] || fallbackImages['sedan'];

        // Mettre à jour
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...vehicle,
            photo: fallbackUrl,
            features: typeof vehicle.features === 'string' ? vehicle.features : JSON.stringify(vehicle.features),
          }),
        });

        if (response.ok) {
          fixed++;
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }

    setLoading(false);
    alert(`✅ ${fixed} image(s) remplacée(s) par des placeholders`);
    loadVehicles();
    setSelectedVehicles(new Set());
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link 
            href="/admin/vehicles"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🔧 Réparer les images cassées
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Remplacez les images qui ne fonctionnent plus par des placeholders professionnels
          </p>
        </div>

        {/* Info */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            💡 Pourquoi certaines images échouent ?
          </h2>
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li>• Les images externes peuvent être supprimées ou déplacées</li>
            <li>• Certains sites bloquent les téléchargements automatiques</li>
            <li>• Les URLs peuvent être invalides ou expirées</li>
          </ul>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-4">
            <strong>Solution :</strong> Remplacez-les par des images de haute qualité depuis Unsplash
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={loadVehicles}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 
                text-white rounded-lg font-medium transition-colors"
            >
              📋 Charger les véhicules
            </button>

            {vehicles.length > 0 && (
              <>
                <button
                  onClick={selectAll}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                    hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                    hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Tout désélectionner
                </button>
                <button
                  onClick={fixSelectedImages}
                  disabled={loading || selectedVehicles.size === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 
                    text-white rounded-lg font-medium transition-colors ml-auto"
                >
                  ✨ Réparer {selectedVehicles.size > 0 && `(${selectedVehicles.size})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Liste des véhicules */}
        {vehicles.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Véhicules ({vehicles.length})
            </h2>
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedVehicles.has(vehicle.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => toggleVehicle(vehicle.id)}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.has(vehicle.id)}
                      onChange={() => toggleVehicle(vehicle.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {vehicle.photo || 'Pas de photo'}
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">
                      {vehicle.vehicleType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




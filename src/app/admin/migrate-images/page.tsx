'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Page pour migrer les images externes vers Cloudinary
 * Utile pour éviter les erreurs de domaines non configurés
 */
export default function MigrateImagesPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, migrated: 0, errors: 0 });

  // Charger les véhicules avec images externes
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      
      if (data.success) {
        // Filtrer les véhicules avec images externes (non Cloudinary)
        const externalImages = data.data.filter((v: any) => 
          v.photo && !v.photo.includes('res.cloudinary.com')
        );
        
        setVehicles(externalImages);
        setStats({ total: externalImages.length, migrated: 0, errors: 0 });
        addProgress(`✅ ${externalImages.length} véhicule(s) avec images externes trouvés`);
      }
    } catch (error) {
      addProgress(`❌ Erreur lors du chargement: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Migrer une image vers Cloudinary via l'API
  const migrateImage = async (imageUrl: string): Promise<string | null> => {
    try {
      // Appeler l'API qui gère le téléchargement et l'upload
      const response = await fetch('/api/migrate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        // Gestion améliorée des erreurs API
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Si ce n'est pas du JSON, récupérer le texte
          const errorText = await response.text();
          if (errorText.includes('<!DOCTYPE')) {
            errorMessage = 'Erreur serveur - Page HTML reçue au lieu de JSON';
          } else {
            errorMessage = errorText.length > 100 
              ? errorText.substring(0, 100) + '...' 
              : errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Migration échouée');
      }
      
      return data.newUrl;
      
    } catch (error) {
      console.error('Erreur migration:', error);
      throw error;
    }
  };

  // Migrer tous les véhicules
  const migrateAll = async () => {
    setLoading(true);
    let migrated = 0;
    let errors = 0;

    for (const vehicle of vehicles) {
      try {
        addProgress(`🔄 Migration de ${vehicle.make} ${vehicle.model}...`);
        
        // Migrer l'image via l'API
        const newUrl = await migrateImage(vehicle.photo);
        
        // Mettre à jour dans la DB
        const updateResponse = await fetch(`/api/vehicles/${vehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...vehicle,
            photo: newUrl,
            features: typeof vehicle.features === 'string' ? vehicle.features : JSON.stringify(vehicle.features),
          }),
        });

        if (updateResponse.ok) {
          const responseData = await updateResponse.json();
          if (responseData.success) {
            addProgress(`✅ ${vehicle.make} ${vehicle.model} migré avec succès`);
            addProgress(`   📸 Nouvelle URL: ${newUrl ? newUrl.substring(0, 60) + '...' : 'URL non disponible'}`);
            migrated++;
          } else {
            throw new Error(`API Error: ${responseData.error || 'Unknown'}`);
          }
        } else {
          // Essayer de parser en JSON, sinon afficher le texte brut
          let errorMessage = `HTTP ${updateResponse.status}`;
          try {
            const errorData = await updateResponse.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // Si ce n'est pas du JSON, récupérer le texte brut
            const errorText = await updateResponse.text();
            errorMessage = errorText.length > 100 
              ? errorText.substring(0, 100) + '...' 
              : errorText;
          }
          throw new Error(`Erreur mise à jour DB: ${errorMessage}`);
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addProgress(`❌ ${vehicle.make} ${vehicle.model}: ${errorMsg}`);
        errors++;
      }

      setStats(prev => ({ ...prev, migrated, errors }));
      
      // Petit délai pour ne pas surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
    addProgress(`\n🎉 Migration terminée ! ${migrated} réussi(es), ${errors} erreur(s)`);
    
    if (migrated > 0) {
      addProgress(`\n✨ Vous pouvez maintenant rafraîchir la page flotte !`);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/vehicles"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🔄 Migrer les images vers Cloudinary
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Transférez automatiquement toutes vos images externes vers Cloudinary
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pourquoi migrer vers Cloudinary ?
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span><strong>Plus d'erreurs</strong> : Plus besoin de configurer les domaines dans next.config.ts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span><strong>Performance</strong> : CDN mondial ultra-rapide</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span><strong>Optimisation</strong> : WebP/AVIF automatique</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span><strong>Fiabilité</strong> : Vos images ne disparaîtront plus</span>
            </li>
          </ul>
        </div>

        {/* Stats */}
        {vehicles.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {stats.total}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                À migrer
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats.migrated}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Migrés
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {stats.errors}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Erreurs
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Actions
          </h2>
          <div className="flex gap-4">
            <button
              onClick={loadVehicles}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 
                text-white rounded-lg font-medium transition-colors
                disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              1. Analyser les véhicules
            </button>

            {vehicles.length > 0 && (
              <button
                onClick={migrateAll}
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 
                  text-white rounded-lg font-medium transition-colors
                  disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Migration en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    2. Migrer tout vers Cloudinary
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Liste des véhicules */}
        {vehicles.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Véhicules à migrer ({vehicles.length})
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {vehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {vehicle.photo}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Console de progression */}
        {progress.length > 0 && (
          <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Console</h2>
              <button
                onClick={() => setProgress([])}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Effacer
              </button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {progress.map((line, index) => (
                <div 
                  key={index}
                  className={`${
                    line.includes('✅') ? 'text-green-400' :
                    line.includes('❌') ? 'text-red-400' :
                    line.includes('🔄') ? 'text-blue-400' :
                    line.includes('🎉') ? 'text-yellow-400' :
                    'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



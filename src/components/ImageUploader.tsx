'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string | null;
  className?: string;
}

/**
 * Composant pour uploader des images vers Cloudinary
 * Simple, efficace, avec preview en temps réel
 */
export function ImageUploader({ 
  onUploadComplete, 
  currentImage, 
  className = '' 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('❌ Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('❌ Fichier trop volumineux. Maximum 10MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(10);
      
      // Créer un preview local immédiat
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setProgress(30);

      // Vérifier la configuration Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Configuration Cloudinary manquante. Vérifiez vos variables d\'environnement.');
      }

      // Préparer les données
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'navette-xpress/vehicles');
      
      setProgress(50);

      // Upload vers Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur Cloudinary:', errorData);
        throw new Error(errorData.error?.message || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      setProgress(100);
      
      // URL de l'image uploadée
      const imageUrl = data.secure_url;
      
      // Nettoyer le preview local
      URL.revokeObjectURL(previewUrl);
      
      // Notifier le parent
      onUploadComplete(imageUrl);
      
      console.log('✅ Image uploadée:', imageUrl);
      
    } catch (err) {
      console.error('Erreur upload:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : '❌ Erreur lors de l\'upload. Veuillez réessayer.'
      );
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label et input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Photo du véhicule
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            file:cursor-pointer file:transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            dark:file:bg-blue-900/50 dark:file:text-blue-300
            dark:hover:file:bg-blue-900/70"
        />
      </div>

      {/* Barre de progression */}
      {uploading && progress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Upload en cours...
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Preview de l'image */}
      {preview && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl">
                <svg 
                  className="animate-spin h-10 w-10 text-blue-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informations */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>✓ Formats acceptés : JPG, PNG, WebP</p>
        <p>✓ Taille max : 10MB</p>
        {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
          <p className="text-orange-600 dark:text-orange-400 font-medium">
            ⚠️ Configuration Cloudinary manquante ! Ajoutez vos variables d'environnement.
          </p>
        )}
      </div>
    </div>
  );
}



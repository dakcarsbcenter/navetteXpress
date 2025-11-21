'use client';

import { useState } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import Link from 'next/link';

/**
 * Page de test pour vérifier que l'upload Cloudinary fonctionne
 * Accès: http://localhost:3000/test-upload
 */
export default function TestUploadPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploadHistory, setUploadHistory] = useState<string[]>([]);

  const handleUploadComplete = (url: string) => {
    console.log('✅ Upload réussi !', url);
    setUploadedUrl(url);
    setUploadHistory(prev => [url, ...prev]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🧪 Test Upload Cloudinary
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Testez l'upload d'images vers Cloudinary
          </p>
        </div>

        {/* Status de configuration */}
        <div className="mb-8 p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            📋 Configuration
          </h2>
          <div className="space-y-2 text-sm">
            <ConfigStatus 
              label="Cloud Name"
              value={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
            />
            <ConfigStatus 
              label="Upload Preset"
              value={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            />
            <ConfigStatus 
              label="API Key"
              value={process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY}
            />
          </div>
        </div>

        {/* Upload Component */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Uploader une image
          </h2>
          <ImageUploader 
            onUploadComplete={handleUploadComplete}
            currentImage={uploadedUrl}
          />
        </div>

        {/* Résultat de l'upload */}
        {uploadedUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Upload réussi !
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Votre image est maintenant hébergée sur Cloudinary
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">URL de l'image :</p>
                  <code className="text-xs text-slate-700 dark:text-slate-300 break-all block">
                    {uploadedUrl}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    📋 Copier l'URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historique des uploads */}
        {uploadHistory.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              📚 Historique ({uploadHistory.length})
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadHistory.map((url, index) => (
                <div 
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
                      {url}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!uploadedUrl && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💡 Instructions
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Vérifiez que la configuration ci-dessus affiche ✅ partout</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Cliquez sur "Choisir un fichier" et sélectionnez une image</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>L'upload démarre automatiquement vers Cloudinary</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>L'URL de l'image s'affichera une fois l'upload terminé</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigStatus({ label, value }: { label: string; value?: string }) {
  const isConfigured = !!value;
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
      <span className="text-slate-700 dark:text-slate-300 font-medium">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {value.substring(0, 20)}...
            </span>
            <span className="text-green-600 dark:text-green-400 font-semibold">✅</span>
          </>
        ) : (
          <span className="text-red-600 dark:text-red-400 font-semibold">❌</span>
        )}
      </div>
    </div>
  );
}





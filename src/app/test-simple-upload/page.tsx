'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function SimpleUploadTestPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadDetails, setUploadDetails] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      console.log('🚀 Début de l\'upload:', {
        name: file.name,
        type: file.type,
        size: file.size
      })

      // Préparation du FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload vers l'API simple (sans authentification)
      const response = await fetch('/api/simple-upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('📝 Réponse:', result)

      if (result.success) {
        setUploadedImage(result.data.imageUrl)
        setUploadDetails(result.data)
        setSuccess(`Upload réussi! Image: ${result.data.imageUrl}`)
      } else {
        setError(result.message || 'Erreur lors de l\'upload')
      }

    } catch (error) {
      console.error('❌ Erreur upload:', error)
      setError(`Erreur réseau: ${error}`)
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const testConfig = async () => {
    try {
      const response = await fetch('/api/test-cloudinary')
      const result = await response.json()
      console.log('🔧 Test config:', result)
      
      if (result.success) {
        setSuccess(`Configuration OK: ${JSON.stringify(result.config)}`)
      } else {
        setError(`Erreur config: ${result.message}`)
      }
    } catch (error) {
      setError(`Erreur test config: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-2xl mx-auto p-8">
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
          <h1 className="text-2xl font-bold mb-2">🧪 Test Upload Simple (Sans Auth)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test de base pour vérifier si Cloudinary fonctionne correctement
          </p>
        </div>
        
        {/* Messages d'erreur/succès */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ {success}</p>
          </div>
        )}

        {/* Boutons de test */}
        <div className="mb-8 space-y-4">
          <button
            onClick={testConfig}
            className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔧 Tester Configuration Cloudinary
          </button>
          
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className={`w-full p-3 rounded-lg transition-colors ${
              uploading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Upload en cours...
              </div>
            ) : (
              '📤 Sélectionner et Uploader une Image'
            )}
          </button>
        </div>

        {/* Image uploadée */}
        {uploadedImage && (
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4">📸 Image Uploadée</h2>
            <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
              <Image
                src={uploadedImage}
                alt="Image uploadée"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <p className="text-sm text-gray-600 break-all">
              <strong>URL:</strong> {uploadedImage}
            </p>
          </div>
        )}

        {/* Détails de l'upload */}
        {uploadDetails && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Détails de l&apos;Upload</h3>
            <div className="text-sm space-y-1">
              <p><strong>Public ID:</strong> {uploadDetails.publicId}</p>
              <p><strong>Dimensions:</strong> {uploadDetails.width} x {uploadDetails.height}</p>
              <p><strong>Format:</strong> {uploadDetails.format}</p>
              <p><strong>Taille:</strong> {Math.round(uploadDetails.bytes / 1024)} KB</p>
            </div>
          </div>
        )}

        {/* Input file caché */}
        <input
          id="file-upload"
          name="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Info de debug */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
          <div className="text-sm space-y-1">
            <p><strong>Cloud Name:</strong> {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'Non défini'}</p>
            <p><strong>Upload Preset:</strong> {process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Non défini'}</p>
            <p><strong>API URL:</strong> /api/simple-upload</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">📋 Instructions</h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Testez d&apos;abord la configuration avec le bouton violet</li>
            <li>2. Sélectionnez une image (JPG, PNG, WebP, max 5MB)</li>
            <li>3. L&apos;upload se fait automatiquement vers Cloudinary</li>
            <li>4. Vérifiez les logs dans la console du navigateur ET le terminal</li>
            <li>5. Si ça marche ici, le problème est dans l&apos;authentification</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

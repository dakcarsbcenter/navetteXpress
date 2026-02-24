'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'

interface UniversalProfilePhotoUploadProps {
  // Pour les admins : spécifiez userId pour modifier la photo d'un autre utilisateur
  userId?: string
  currentImage?: string | null
  onImageUpdate: (imageUrl: string | null) => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

const UniversalProfilePhotoUpload: React.FC<UniversalProfilePhotoUploadProps> = ({
  userId, // Optionnel - seulement pour les admins
  currentImage,
  onImageUpdate,
  onError,
  onSuccess
}) => {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

      // Validation côté client
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        onError('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.')
        return
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        onError('Fichier trop volumineux. Taille maximale: 5MB.')
        return
      }

      // Préparation du FormData
      const formData = new FormData()
      formData.append('file', file)
      
      // Seulement ajouter userId si fourni (pour les admins)
      if (userId) {
        formData.append('userId', userId)
      }

      console.log('📤 Upload vers API admin/users/profile-photo', {
        hasUserId: !!userId,
        userId: userId || 'auto (utilisateur actuel)'
      })

      // Upload vers l'API admin mise à jour
      const response = await fetch('/api/admin/users/profile-photo', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('📝 Réponse API:', result)

      if (result.success) {
        onImageUpdate(result.data.imageUrl)
        onSuccess('Photo de profil mise à jour avec succès')
      } else {
        onError(result.message || 'Erreur lors de l\'upload')
      }

    } catch (error) {
      console.error('❌ Erreur upload:', error)
      onError('Erreur lors de l\'upload de la photo')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      // Construction de l'URL avec userId si fourni
      let url = '/api/admin/users/profile-photo'
      if (userId) {
        url += `?userId=${userId}`
      }

      console.log('🗑️ Delete via API admin/users/profile-photo', {
        hasUserId: !!userId,
        userId: userId || 'auto (utilisateur actuel)',
        url
      })

      const response = await fetch(url, {
        method: 'DELETE'
      })

      const result = await response.json()
      console.log('📝 Réponse API Delete:', result)

      if (result.success) {
        onImageUpdate(null)
        onSuccess('Photo de profil supprimée avec succès')
      } else {
        onError(result.message || 'Erreur lors de la suppression')
      }

    } catch (error) {
      console.error('❌ Erreur suppression:', error)
      onError('Erreur lors de la suppression de la photo')
    } finally {
      setDeleting(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Photo actuelle */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
        {currentImage ? (
          <Image
            src={currentImage}
            alt="Photo de profil"
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <button
          onClick={triggerFileInput}
          disabled={uploading || deleting}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            uploading || deleting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Upload...
            </div>
          ) : (
            currentImage ? 'Changer' : 'Ajouter'
          )}
        </button>

        {currentImage && (
          <button
            onClick={handleDelete}
            disabled={uploading || deleting}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              uploading || deleting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {deleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Suppression...
              </div>
            ) : (
              'Supprimer'
            )}
          </button>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center max-w-48">
        JPG, PNG ou WebP. Taille maximale: 5MB.
      </p>
      
      {/* Info de debug */}
      {userId && (
        <p className="text-xs text-blue-600 text-center">
          Mode Admin: modification de l&apos;utilisateur {userId}
        </p>
      )}
    </div>
  )
}

export default UniversalProfilePhotoUpload

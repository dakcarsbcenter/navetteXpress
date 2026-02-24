"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"

interface DriverProfileProps {
  onBack: () => void
}

interface DriverData {
  id: string
  name: string
  email: string
  phone?: string
  licenseNumber?: string
  image?: string
  isActive: boolean
  createdAt: string
}

export function DriverProfile({ onBack }: DriverProfileProps) {
  const { data: session } = useSession()
  const [driverData, setDriverData] = useState<DriverData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchDriverData()
    }
  }, [session])

  const fetchDriverData = async () => {
    try {
      const response = await fetch('/api/driver/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDriverData(data.data)
          setEditFormData({
            name: data.data.name || '',
            phone: data.data.phone || '',
            licenseNumber: data.data.licenseNumber || ''
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDriverData({ ...driverData!, ...editFormData })
          setIsEditing(false)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-lg text-gray-600">Chargement de votre profil...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header avec bouton retour */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au tableau de bord
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos informations personnelles et professionnelles
            </p>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isEditing 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isEditing ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale - Informations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Informations personnelles
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom complet
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {driverData?.name || 'Non renseigné'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {driverData?.email || 'Non renseigné'}
                  </p>
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full mt-1">
                    ✓ Vérifié
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: +33 6 12 34 56 78"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {driverData?.phone || 'Non renseigné'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Numéro de permis
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.licenseNumber}
                      onChange={(e) => setEditFormData({...editFormData, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 123456789012"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {driverData?.licenseNumber || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations du compte */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Informations du compte
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rôle
                  </label>
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm rounded-full font-medium">
                    🚗 Chauffeur
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 text-sm rounded-full font-medium ${
                    driverData?.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {driverData?.isActive ? '✅ Actif' : '❌ Inactif'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Membre depuis
                </label>
                <p className="text-gray-900 dark:text-white">
                  {driverData?.createdAt ? 
                    new Date(driverData.createdAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 
                    "Information non disponible"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale - Photo de profil */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">📸</span>
                Photo de profil
              </h3>
            </div>
            
            <div className="p-6">
              <UniversalProfilePhotoUpload
                currentImage={driverData?.image || session?.user?.image || undefined}
                onImageUpdate={(imageUrl) => {
                  // Mettre à jour les données locales
                  if (driverData) {
                    setDriverData({...driverData, image: imageUrl || undefined})
                  }
                }}
                onSuccess={(message) => {
                  console.log('✅ Photo mise à jour:', message)
                  // Recharger les données du profil pour mettre à jour l'image
                  fetchDriverData()
                }}
                onError={(error) => {
                  console.error('❌ Erreur upload:', error)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

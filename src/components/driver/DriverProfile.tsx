"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"
import {
  User,
  CaretLeft,
  PencilSimple,
  FloppyDisk,
  X,
  Envelope,
  Phone,
  CreditCard,
  ShieldCheck,
  Calendar,
  Lock,
  Camera
} from "@phosphor-icons/react"

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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-blue-400 font-mono text-xs animate-pulse">CHARGEMENT DU PROFIL...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-[var(--color-driver-card)] border border-[var(--color-driver-border)] text-[var(--color-text-secondary)] hover:text-white"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Mon Profil Chauffeur</h1>
            <p className="text-sm font-mono text-[var(--color-text-muted)]">Poste de contrôle • Identité Vérifiée</p>
          </div>
        </div>

        <button
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all shadow-xl ${isEditing
            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/10'
            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/10'
            }`}
        >
          {isEditing ? <><FloppyDisk size={18} weight="fill" /> Sauvegarder</> : <><PencilSimple size={18} weight="bold" /> Modifier Infos</>}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* COLONNE GAUCHE - PHOTO & QUICK INFO */}
        <div className="space-y-6">
          <div className="bg-[var(--color-driver-card)] border border-[var(--color-driver-border)] rounded-3xl p-8 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="relative inline-block mb-6">
              <UniversalProfilePhotoUpload
                currentImage={driverData?.image || session?.user?.image || undefined}
                onImageUpdate={(imageUrl) => {
                  if (driverData) setDriverData({ ...driverData, image: imageUrl || undefined })
                }}
                onSuccess={() => fetchDriverData()}
                onError={(err) => console.error(err)}
              />
              <div className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-lg text-white border-2 border-[var(--color-driver-bg)]">
                <Camera size={14} weight="fill" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">{driverData?.name}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
              <ShieldCheck size={12} weight="fill" /> Chauffeur Certifié
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold uppercase tracking-tighter">Statut Compte</span>
                <span className="text-emerald-500 font-bold">ACTIF</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold uppercase tracking-tighter">Depuis le</span>
                <span className="text-white font-mono">
                  {driverData?.createdAt ? new Date(driverData.createdAt).toLocaleDateString('fr-FR') : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-driver-card)] border border-[var(--color-driver-border)] rounded-3xl p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Lock size={14} weight="bold" className="text-blue-500" /> Sécurité
            </h3>
            <button className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all text-left">
              Réinitialiser le mot de passe
            </button>
          </div>
        </div>

        {/* COLONNE DROITE - FORMULAIRE & DETAILS */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-[var(--color-driver-card)] border border-[var(--color-driver-border)] rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 bg-white/5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <User size={18} weight="bold" className="text-blue-500" />
                <h3 className="font-bold text-white text-lg">Informations État-Civil</h3>
              </div>
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} weight="bold" />
                </button>
              )}
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1.5 px-1">
                  <User size={10} weight="bold" /> Nom Complet
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white font-medium">
                    {driverData?.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1.5 px-1">
                  <Envelope size={10} weight="bold" /> Adresse Email
                </label>
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 font-mono text-sm flex items-center justify-between">
                  {driverData?.email}
                  <ShieldCheck size={14} weight="fill" className="text-emerald-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1.5 px-1">
                  <Phone size={10} weight="bold" /> Téléphone Mobile
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white font-mono">
                    {driverData?.phone || 'Non renseigné'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1.5 px-1">
                  <CreditCard size={10} weight="bold" /> N° Permis de Conduire
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.licenseNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, licenseNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white font-mono">
                    {driverData?.licenseNumber || 'Non renseigné'}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="bg-[var(--color-driver-card)] border border-[var(--color-driver-border)] rounded-3xl p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Calendar size={24} weight="light" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold tracking-tight">Vérification de Conformité</h4>
              <p className="text-xs text-gray-500 mt-1">
                Vos documents sont à jour. Prochaine vérification prévue dans 6 mois.
              </p>
            </div>
            <div className="shrink-0 text-emerald-500 font-bold text-xs uppercase tracking-widest">
              OK
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  X,
  User,
  Envelope,
  Phone,
  MapPin,
  Buildings,
  IdentificationCard,
  AddressBook,
  CheckCircle,
  DeviceMobile,
  Camera,
  FloppyDisk,
  Warning
} from "@phosphor-icons/react"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData: UserProfile | null
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  isCompany?: boolean
  companyName?: string
  ninea?: string
  raisonSociale?: string
  companyAddress?: string
  companyPhone?: string
  bp?: string
  image?: string
}

export function EditProfileModal({ isOpen, onClose, onSuccess, initialData }: EditProfileModalProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    isCompany: false,
    companyName: "",
    ninea: "",
    raisonSociale: "",
    companyAddress: "",
    companyPhone: "",
    bp: "",
    image: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        isCompany: !!initialData.isCompany,
        companyName: initialData.companyName || "",
        ninea: initialData.ninea || "",
        raisonSociale: initialData.raisonSociale || "",
        companyAddress: initialData.companyAddress || "",
        companyPhone: initialData.companyPhone || "",
        bp: initialData.bp || "",
        image: initialData.image || ""
      })
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || "Erreur lors de la mise à jour")
      }
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-[#0F172A] border border-white/10 shadow-2xl flex flex-col animate-scaleIn">

        {/* Header Section */}
        <div className="p-8 pb-4 shrink-0 border-b border-white/5 flex items-center justify-between bg-linear-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <User size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">Modifier mon profil</h3>
              <p className="text-sm text-white/40 mt-1">Gérez vos informations personnelles et professionnelles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">

          {/* Section: Identité de base */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-400/80 mb-2">
              <IdentificationCard size={20} weight="bold" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em]">Identité & Contact</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Nom Complet</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="Votre nom..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Adresse Email</label>
                <div className="relative">
                  <Envelope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="votre.email@exemple.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Téléphone Personnel</label>
                <div className="relative">
                  <DeviceMobile size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="+221 77 000 00 00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Adresse Résidentielle</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="Dakar, Sénégal..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Photo de profil */}
          <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 text-center md:text-left">Photo de profil</p>
                <UniversalProfilePhotoUpload
                  currentImage={formData.image}
                  onImageUpdate={(url) => setFormData({ ...formData, image: url })}
                  onSuccess={() => { }}
                  onError={(err) => setError(err)}
                />
              </div>
              <div className="text-center md:text-left">
                <h5 className="text-sm font-bold text-white">Une image vaut mille mots</h5>
                <p className="text-xs text-white/40 mt-1 max-w-sm leading-relaxed">
                  Utilisez une photo professionnelle pour être plus facilement identifié par vos chauffeurs.
                  Formats JPEG ou PNG supportés.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Entreprise Toggle */}
          <section className="space-y-8">
            <div className="flex items-center justify-between p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Buildings size={20} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Profil Entreprise</h4>
                  <p className="text-xs text-white/40 mt-0.5">Activer pour ajouter des informations de facturation pro</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isCompany: !formData.isCompany })}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${formData.isCompany ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${formData.isCompany ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {formData.isCompany && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="E Corp..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">NINEA</label>
                  <input
                    type="text"
                    value={formData.ninea}
                    onChange={e => setFormData({ ...formData, ninea: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="XX-XXXXX-X..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Raison Sociale</label>
                  <input
                    type="text"
                    value={formData.raisonSociale}
                    onChange={e => setFormData({ ...formData, raisonSociale: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="SARL, SA..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Boîte Postale (BP)</label>
                  <input
                    type="text"
                    value={formData.bp}
                    onChange={e => setFormData({ ...formData, bp: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="BP 00000..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Adresse de l'entreprise</label>
                  <input
                    type="text"
                    value={formData.companyAddress}
                    onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="Siège social..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Téléphone de l'entreprise</label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={e => setFormData({ ...formData, companyPhone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="+221 33 000 00 00"
                  />
                </div>
              </div>
            )}
          </section>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <Warning size={20} weight="fill" />
              {error}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-8 shrink-0 bg-white/[0.02] border-t border-white/5 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[1.5] px-6 py-4 rounded-2xl bg-emerald-500 text-[#0F172A] font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FloppyDisk size={20} weight="bold" />
                Mettre à jour mon profil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

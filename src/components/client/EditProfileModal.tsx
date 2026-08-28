"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import {
  X,
  User,
  Envelope,
  Phone,
  MapPin,
  Buildings,
  IdentificationCard,
  DeviceMobile,
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
  companyType?: 'hotel' | 'entreprise' | 'ong' | null
  companyName?: string
  ninea?: string
  raisonSociale?: string
  companyAddress?: string
  companyPhone?: string
  bp?: string
  image?: string
}

const surfaceStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px' }
const inputStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', color: '#12100E' }

export function EditProfileModal({ isOpen, onClose, onSuccess, initialData }: EditProfileModalProps) {
  const { data: session } = useSession()
  const t = useTranslations('client.editProfile')
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    isCompany: false,
    companyType: "" as "" | "hotel" | "entreprise" | "ong",
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
        companyType: initialData.companyType || "",
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
        setError(data.error || t('updateError'))
      }
    } catch (err) {
      setError(t('genericError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const establishmentTypes = [
    { value: 'hotel', label: t('typeHotel') },
    { value: 'entreprise', label: t('typeEnterprise') },
    { value: 'ong', label: t('typeNgo') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-[95vw] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '6px' }}>

        {/* En-tête */}
        <div className="p-4 sm:p-6 shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid #E2DACD' }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center" style={{ backgroundColor: '#F7F3EC', color: '#1F5245', border: '1px solid #E2DACD', borderRadius: '3px' }}>
              <User size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-tight" style={{ color: '#12100E' }}>{t('title')}</h3>
              <p className="text-sm mt-1" style={{ color: '#6E6A63' }}>{t('subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full transition-all"
            style={{ color: '#6E6A63' }}
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

          {/* Section: Identité de base */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1" style={{ color: '#1F5245' }}>
              <IdentificationCard size={18} weight="bold" />
              <h4 className="text-xs font-bold uppercase tracking-[0.18em]">{t('identityContact')}</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('fullName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 outline-none transition-all"
                    style={inputStyle}
                    placeholder={t('fullNamePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('email')}</label>
                <div className="relative">
                  <Envelope size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 outline-none transition-all"
                    style={inputStyle}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('phone')}</label>
                <div className="relative">
                  <DeviceMobile size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 outline-none transition-all"
                    style={inputStyle}
                    placeholder={t('phonePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('address')}</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 outline-none transition-all"
                    style={inputStyle}
                    placeholder={t('addressPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Photo de profil */}
          <section className="p-5" style={surfaceStyle}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-center md:text-left" style={{ color: '#6E6A63' }}>{t('photoTitle')}</p>
                <UniversalProfilePhotoUpload
                  currentImage={formData.image}
                  onImageUpdate={(url) => setFormData({ ...formData, image: url ?? "" })}
                  onSuccess={() => { }}
                  onError={(err) => setError(err)}
                />
              </div>
              <div className="text-center md:text-left">
                <h5 className="text-sm font-semibold" style={{ color: '#12100E' }}>{t('photoHeadline')}</h5>
                <p className="text-xs mt-1 max-w-sm leading-relaxed" style={{ color: '#6E6A63' }}>
                  {t('photoDescription')}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Entreprise */}
          <section className="space-y-6">
            <div className="flex items-center justify-between p-5" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '4px' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', color: '#1F5245' }}>
                  <Buildings size={18} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: '#12100E' }}>{t('companyToggleTitle')}</h4>
                  <p className="text-xs mt-0.5" style={{ color: '#6E6A63' }}>{t('companyToggleDescription')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isCompany: !formData.isCompany })}
                className="relative w-14 h-8 rounded-full transition-all duration-300 shrink-0"
                style={{ backgroundColor: formData.isCompany ? '#1F5245' : '#E2DACD' }}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${formData.isCompany ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {formData.isCompany && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('establishmentType')}</label>
                  <div className="flex flex-wrap gap-2">
                    {establishmentTypes.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, companyType: opt.value as typeof formData.companyType })}
                        className="px-4 py-2.5 text-sm font-medium transition-colors"
                        style={formData.companyType === opt.value
                          ? { backgroundColor: '#1F5245', border: '1px solid #1F5245', color: '#fff', borderRadius: '4px' }
                          : { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '4px' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('companyName')}</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 outline-none transition-all"
                      style={inputStyle}
                      placeholder={t('companyNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('ninea')}</label>
                    <input
                      type="text"
                      value={formData.ninea}
                      onChange={e => setFormData({ ...formData, ninea: e.target.value })}
                      className="w-full px-4 py-3 outline-none transition-all"
                      style={inputStyle}
                      placeholder={t('nineaPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('raisonSociale')}</label>
                    <input
                      type="text"
                      value={formData.raisonSociale}
                      onChange={e => setFormData({ ...formData, raisonSociale: e.target.value })}
                      className="w-full px-4 py-3 outline-none transition-all"
                      style={inputStyle}
                      placeholder={t('raisonSocialePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('bp')}</label>
                    <input
                      type="text"
                      value={formData.bp}
                      onChange={e => setFormData({ ...formData, bp: e.target.value })}
                      className="w-full px-4 py-3 outline-none transition-all"
                      style={inputStyle}
                      placeholder={t('bpPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('companyAddress')}</label>
                    <input
                      type="text"
                      value={formData.companyAddress}
                      onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full px-4 py-3 outline-none transition-all"
                      style={inputStyle}
                      placeholder={t('companyAddressPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('companyPhone')}</label>
                    <input
                      type="tel"
                      value={formData.companyPhone}
                      onChange={e => setFormData({ ...formData, companyPhone: e.target.value })}
                      className="w-full px-4 py-3 outline-none transition-all"
                      style={inputStyle}
                      placeholder={t('companyPhonePlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {error && (
            <div className="p-4 text-sm flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#B8493C', borderRadius: '4px' }}>
              <Warning size={20} weight="fill" />
              {error}
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="p-4 sm:p-6 shrink-0 flex gap-3" style={{ backgroundColor: '#F7F3EC', borderTop: '1px solid #E2DACD' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 sm:px-6 py-3 font-semibold transition-all min-h-[44px]"
            style={{ border: '1px solid #E2DACD', color: '#12100E', borderRadius: '4px' }}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[1.5] px-4 sm:px-6 py-3 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FloppyDisk size={18} weight="bold" />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

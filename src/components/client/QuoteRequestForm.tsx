'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationCenter } from '@/components/ui/NotificationCenter'

const availableServices = [
  { id: 'transport', name: 'Transport standard', icon: '🚗', description: 'Service de transport classique' },
  { id: 'tour', name: 'Tour & Excursion', icon: '🎯', description: 'Visites guidées et excursions' },
  { id: 'airport', name: 'Transfert aéroport', icon: '✈️', description: 'Navette vers/depuis l\'aéroport' },
  { id: 'vip', name: 'Transport VIP', icon: '👑', description: 'Service premium avec véhicule de luxe' },
  { id: 'rental', name: 'Location avec chauffeur', icon: '🤵', description: 'Location longue durée avec chauffeur' },
  { id: 'event', name: 'Transport événementiel', icon: '🎉', description: 'Transport pour événements spéciaux' }
]

export function QuoteRequestForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  const user = session?.user as unknown as { id?: string; name?: string; email?: string; phone?: string } | undefined
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfPeople: '',
    services: [] as string[],
    duration: '',
    startDate: '',
    departure: '',
    destination: '',
    cabinBaggage: '',
    checkedBaggage: '',
    paymentMode: '',
    description: ''
  })

  // Pré-remplir les champs avec les informations de l'utilisateur connecté
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phone || prev.customerPhone
      }))
    }
  }, [user])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: checked 
        ? [...prev.services, serviceId]
        : prev.services.filter(s => s !== serviceId)
    }))
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      numberOfPeople: '',
      services: [],
      duration: '',
      startDate: '',
      departure: '',
      destination: '',
      cabinBaggage: '',
      checkedBaggage: '',
      paymentMode: '',
      description: ''
    })
  }

  const handleCancel = () => {
    router.push('/client/dashboard?tab=quotes')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!formData.customerName || !formData.customerEmail || 
        !formData.numberOfPeople || formData.services.length === 0 ||
        !formData.duration || !formData.departure || !formData.destination) {
      showError('Veuillez remplir tous les champs obligatoires', 'Formulaire incomplet')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Si l'utilisateur est connecté et a modifié son téléphone, le mettre à jour
      if (user && formData.customerPhone && formData.customerPhone !== user.phone) {
        console.log('📞 Mise à jour du téléphone utilisateur:', formData.customerPhone)
        try {
          const updateResponse = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formData.customerPhone })
          })
          
          if (updateResponse.ok) {
            console.log('✅ Téléphone mis à jour avec succès')
          } else {
            console.warn('⚠️ Impossible de mettre à jour le téléphone')
          }
        } catch (updateError) {
          console.warn('⚠️ Erreur lors de la mise à jour du téléphone:', updateError)
          // On continue même si la mise à jour échoue
        }
      }
      
      const quoteData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || null,
        service: formData.services.join(', '),
        preferredDate: formData.startDate || null,
        message: `Demande de devis pour ${formData.numberOfPeople} personne(s).
Services: ${formData.services.join(', ')}
Durée: ${formData.duration} jour(s)
Départ: ${formData.departure}
Destination: ${formData.destination}
Bagages cabine: ${formData.cabinBaggage || 0}
Bagages soute: ${formData.checkedBaggage || 0}
Mode de paiement souhaité: ${formData.paymentMode || 'Non spécifié'}

Description: ${formData.description}`,
        status: 'pending'
      }

      console.log('📤 Envoi de la demande de devis:', quoteData)

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })

      console.log('📨 Réponse API status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Demande de devis envoyée avec succès:', result)
        
        showSuccess('Votre demande de devis a été envoyée avec succès ! Nous vous répondrons dans les plus brefs délais.', 'Demande envoyée')
        resetForm()
        
        // Rediriger vers la page "Mes devis" après 1.5 secondes
        setTimeout(() => {
          router.push('/client/dashboard?tab=quotes')
        }, 1500)
      } else {
        const errorData = await response.text()
        console.error('❌ Erreur API response:', errorData)
        throw new Error('Erreur lors de l\'envoi de la demande')
      }
    } catch (error) {
      console.error('❌ Erreur envoi demande de devis:', error)
      showError('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.', 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Demander un devis
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Remplissez ce formulaire pour obtenir un devis personnalisé adapté à vos besoins
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section Informations personnelles */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Vos informations
              </h2>
              
              {user && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Vos informations sont automatiquement pré-remplies depuis votre compte</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => handleFormChange('customerName', e.target.value)}
                    readOnly={!!user}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white ${
                      user ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                    }`}
                    placeholder="Votre nom et prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                    readOnly={!!user}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white ${
                      user ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                    }`}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Téléphone *
                    {user && user.phone && formData.customerPhone !== user.phone && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-normal">
                        (modifié)
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre de personnes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.numberOfPeople}
                    onChange={(e) => handleFormChange('numberOfPeople', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Nombre de voyageurs"
                  />
                </div>
              </div>
            </div>

            {/* Section Services */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Services souhaités *
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableServices.map((service) => (
                  <label key={service.id} className="flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.id)}
                        onChange={(e) => handleServiceChange(service.id, e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-2xl">{service.icon}</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {service.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-8">
                      {service.description}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {/* Section Planning */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Planning et durée *
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Durée du voyage (en jours) *
                  </label>
                  <select
                    required
                    value={formData.duration}
                    onChange={(e) => handleFormChange('duration', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Sélectionner la durée</option>
                    <option value="1">1 jour</option>
                    <option value="2">2 jours</option>
                    <option value="3">3 jours</option>
                    <option value="4">4 jours</option>
                    <option value="5">5 jours</option>
                    <option value="7">1 semaine</option>
                    <option value="14">2 semaines</option>
                    <option value="21">3 semaines</option>
                    <option value="30">1 mois</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date de début souhaitée
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section Itinéraire */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Itinéraire *
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Lieu de départ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.departure}
                    onChange={(e) => handleFormChange('departure', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Adresse ou ville de départ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => handleFormChange('destination', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Adresse ou ville de destination"
                  />
                </div>
              </div>
            </div>

            {/* Section Bagages et paiement */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Informations complémentaires
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre de valises
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.cabinBaggage}
                        onChange={(e) => handleFormChange('cabinBaggage', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Cabine"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Bagages cabine</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.checkedBaggage}
                        onChange={(e) => handleFormChange('checkedBaggage', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Soute"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Bagages soute</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mode de paiement préféré
                  </label>
                  <select 
                    value={formData.paymentMode}
                    onChange={(e) => handleFormChange('paymentMode', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                    <option value="transfer">Virement bancaire</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="check">Chèque</option>
                    <option value="deferred">Paiement différé</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description et demandes spécifiques
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                placeholder="Décrivez vos besoins spécifiques, préférences, ou toute information importante pour votre demande de devis..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
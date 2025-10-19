"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { BookNowIcon } from "@/components/icons/custom-icons";
import { serviceTypes, additionalServices, getServiceById } from "@/lib/services";
import Link from "next/link";

interface FormData {
  serviceType: string;
  customServiceType: string;
  date: string;
  time: string;
  pickupAddress: string;
  destinationAddress: string;
  passengers: number;
  luggage: number;
  duration: number;
  additionalServices: string[];
  specialRequests: string;
  contactPhone: string;
  contactEmail: string;
  // Champs pour les utilisateurs non connectés
  clientName: string;
  clientEmail: string;
}

// Composant interne qui utilise useSearchParams
function ReservationForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignedIn = !!session;
  const isLoaded = status !== "loading";
  const user = session?.user as unknown as { id?: string; name?: string; email?: string; role?: string } | undefined;
  
  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    serviceType: "",
    customServiceType: "",
    date: "",
    time: "",
    pickupAddress: "",
    destinationAddress: "",
    passengers: 1,
    luggage: 1,
    duration: 2,
    additionalServices: [],
    specialRequests: "",
    contactPhone: "",
    contactEmail: user?.email || "",
    clientName: "",
    clientEmail: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Gérer la pré-sélection du service depuis l'URL
  useEffect(() => {
    const serviceParam = searchParams?.get('service');
    if (serviceParam && getServiceById(serviceParam)) {
      setFormData(prev => ({
        ...prev,
        serviceType: serviceParam
      }));
    }
  }, [searchParams]);

  // Mettre à jour automatiquement l'email de contact quand l'utilisateur est chargé
  useEffect(() => {
    if (user?.email && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: user.email || ''
      }));
    }
  }, [user?.email, formData.contactEmail]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      // Si on change le type de service, réinitialiser le service personnalisé
      if (field === 'serviceType' && value !== 'autres') {
        return { ...prev, [field]: value as string, customServiceType: '' };
      }
      return { ...prev, [field]: value as string | number | boolean | string[] };
    });
  };

  const handleAdditionalServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceId)
        ? prev.additionalServices.filter(id => id !== serviceId)
        : [...prev.additionalServices, serviceId]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: formData.serviceType,
          customServiceType: formData.customServiceType,
          date: formData.date,
          time: formData.time,
          pickupAddress: formData.pickupAddress,
          destinationAddress: formData.destinationAddress,
          passengers: formData.passengers,
          luggage: formData.luggage,
          duration: formData.duration,
          additionalServices: formData.additionalServices,
          specialRequests: formData.specialRequests,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          userId: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitting(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.error || 'Erreur lors de la création de la réservation');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setIsSubmitting(false);
      // Afficher une erreur à l'utilisateur
      alert('Erreur lors de la création de la réservation. Veuillez réessayer.');
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (!isLoaded) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">Chargement...</div>
    </div>;
  }

  return (
    <div className="font-sans min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation variant="solid" />

      <div className="max-w-4xl mx-auto px-8 py-12 mt-20">
        {/* Message pour les utilisateurs non connectés */}
        {!isSignedIn && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  🚀 Réservation rapide disponible
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Connectez-vous pour un processus de réservation plus rapide avec vos informations pré-remplies.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/auth/signin"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Se Connecter
                </Link>
                <Link
                  href="/auth/signup"
                  className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar - 3 Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= step 
                    ? 'bg-gradient-to-r from-[#FF7E38] to-[#E6682F] text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`h-1 w-32 mx-4 ${
                    currentStep > step ? 'bg-gradient-to-r from-[#FF7E38] to-[#E6682F]' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-xl font-semibold text-slate-900 dark:text-white">
              {currentStep === 1 && "Type de Service"}
              {currentStep === 2 && "Détails du Trajet"}  
              {currentStep === 3 && "Confirmation"}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Étape {currentStep} sur 3
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          {/* Étape 1: Type de service et véhicule */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Choisissez votre service
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {serviceTypes.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleInputChange('serviceType', service.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.serviceType === service.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{service.icon}</span>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{service.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Champ de saisie personnalisé pour "Autres" */}
              {formData.serviceType === "autres" && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Décrivez votre service souhaité *
                  </label>
                  <input
                    type="text"
                    value={formData.customServiceType}
                    onChange={(e) => handleInputChange('customServiceType', e.target.value)}
                    placeholder="Ex: Transport pour tournage, livraison urgente, etc."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF7E38] focus:border-[#FF7E38]"
                  />
                </div>
              )}

            </div>
          )}

          {/* Étape 2: Détails du trajet + Services additionnels */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Détails de votre trajet
              </h2>
              
              {/* Informations client pour les utilisateurs non connectés */}
              {!isSignedIn && (
                <div className="bg-[#FFB885]/10 dark:bg-[#FF7E38]/10 p-6 rounded-xl border border-[#FFB885]/30 dark:border-[#FF7E38]/30">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Vos informations
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="Votre nom et prénom"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        placeholder="votre.email@exemple.com"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date de réservation
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Heure de départ
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Adresse de départ
                  </label>
                  <input
                    type="text"
                    value={formData.pickupAddress}
                    onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                    placeholder="Saisissez l'adresse de départ"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Adresse de destination
                  </label>
                  <input
                    type="text"
                    value={formData.destinationAddress}
                    onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                    placeholder="Saisissez l'adresse de destination"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre de passagers
                  </label>
                  <select
                    value={formData.passengers}
                    onChange={(e) => handleInputChange('passengers', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} passager{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre de valise(s)
                  </label>
                  <select
                    value={formData.luggage}
                    onChange={(e) => handleInputChange('luggage', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value={1}>1 valise</option>
                    <option value={2}>2 valises</option>
                    <option value={3}>3 valises</option>
                    <option value={4}>4 valises</option>
                    <option value={5}>5 valises</option>
                    <option value={6}>6 valises</option>
                    <option value={7}>7 valises</option>
                    <option value={8}>8 valises</option>
                    <option value={9}>9 valises</option>
                    <option value={10}>+10 valises</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Durée estimée (heures)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="77 650 01 02"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Services additionnels intégrés */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Services additionnels (optionnel)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {additionalServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleAdditionalServiceToggle(service.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.additionalServices.includes(service.id)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-white">{service.name}</span>
                        <div className="flex items-center gap-2">
                          {formData.additionalServices.includes(service.id) && (
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Demandes spéciales (optionnel)
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  placeholder="Décrivez vos demandes particulières..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Confirmation de votre réservation
              </h2>
              
              <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Récapitulatif</h3>
                
                <div className="space-y-3 text-sm">
                  {/* Informations client */}
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Client:</span>
                    <span className="text-slate-900 dark:text-white">
                      {isSignedIn ? user?.name : formData.clientName}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Email:</span>
                    <span className="text-slate-900 dark:text-white">
                      {isSignedIn ? user?.email : formData.clientEmail}
                    </span>
                  </div>
                  
                  <div className="border-b pb-3 mb-3"></div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Service:</span>
                    <span className="text-slate-900 dark:text-white">
                      {formData.serviceType === "other" 
                        ? formData.customServiceType 
                        : serviceTypes.find(s => s.id === formData.serviceType)?.name
                      }
                    </span>
                  </div>
                  
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Date & Heure:</span>
                    <span className="text-slate-900 dark:text-white">
                      {formData.date} à {formData.time}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Trajet:</span>
                    <span className="text-slate-900 dark:text-white text-right">
                      {formData.pickupAddress} → {formData.destinationAddress}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Passagers:</span>
                    <span className="text-slate-900 dark:text-white">{formData.passengers}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Valise(s):</span>
                    <span className="text-slate-900 dark:text-white">
                      {formData.luggage === 10 ? '+10' : formData.luggage}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Durée:</span>
                    <span className="text-slate-900 dark:text-white">{formData.duration}h</span>
                  </div>
                  
                  {formData.additionalServices.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Services additionnels:</span>
                      <span className="text-slate-900 dark:text-white">
                        {formData.additionalServices.length} service(s)
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Téléphone:</span>
                      <span className="text-slate-900 dark:text-white">{formData.contactPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Email:</span>
                      <span className="text-slate-900 dark:text-white">{formData.contactEmail}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t mt-4 pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      💰 Prix personnalisé
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Le tarif sera défini par notre équipe selon vos besoins spécifiques
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Votre réservation sera confirmée sous 30 minutes. 
                  Vous recevrez un SMS avec les détails de votre chauffeur.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <div className="flex gap-4">
              {currentStep === 1 && (
                <button
                  onClick={() => router.push('/client/dashboard?tab=bookings')}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Annuler
                </button>
              )}
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Précédent
              </button>
            </div>

            <div className="flex gap-4">
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && (!formData.serviceType || (formData.serviceType === "other" && !formData.customServiceType))) ||
                    (currentStep === 2 && (
                      !formData.date || 
                      !formData.time || 
                      !formData.pickupAddress || 
                      !formData.destinationAddress || 
                      !formData.contactPhone ||
                      (!isSignedIn && (!formData.clientName || !formData.clientEmail))
                    ))
                  }
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 hover:scale-105 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  Suivant
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 hover:scale-105 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <BookNowIcon size={16} color="white" />
                      Confirmer la Réservation
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal de confirmation de succès */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Réservation effectuée !"
        message="Votre réservation a été soumise avec succès. Notre équipe vous contactera dans les plus brefs délais pour confirmer les détails de votre service."
        type="success"
        confirmText="Parfait !"
        onConfirm={() => {
          setShowSuccessModal(false);
          
          // Rediriger les clients connectés vers leur tableau de bord
          if (isSignedIn && user?.role === 'customer') {
            router.push('/client/dashboard?tab=bookings');
          } else {
            // Pour les utilisateurs non connectés, réinitialiser le formulaire
            setCurrentStep(1);
            setFormData({
              serviceType: "",
              customServiceType: "",
              date: "",
              time: "",
              pickupAddress: "",
              destinationAddress: "",
              passengers: 1,
              luggage: 1,
              duration: 2,
              additionalServices: [],
              specialRequests: "",
              contactPhone: "",
              contactEmail: user?.email || "",
              clientName: "",
              clientEmail: ""
            });
          }
        }}
      />
    </div>
  );
}

// Composant principal avec Suspense boundary
export default function ReservationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    }>
      <ReservationForm />
    </Suspense>
  );
}

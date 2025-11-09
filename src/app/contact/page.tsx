"use client";

import { Navigation } from "@/components/navigation";
import InteractiveMap from "@/components/ui/InteractiveMap";
import { 
  BookNowIcon, 
  PhoneIcon, 
  EmailIcon, 
  LocationIcon, 
  ClockIcon 
} from "@/components/icons/custom-icons";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          service: formData.service,
          preferredDate: formData.date,
          message: formData.message
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          date: '',
          message: ''
        });
      } else {
        throw new Error(result.error || 'Erreur lors de l&apos;envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur lors de l&apos;envoi:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Function to get icon component for each contact method
  const getContactIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <PhoneIcon size={32} color="primary" />;
      case 'email':
        return <EmailIcon size={32} color="secondary" />;
      case 'location':
        return <LocationIcon size={32} color="primary" />;
      case 'hours':
        return <ClockIcon size={32} color="neutral" />;
      default:
        return <PhoneIcon size={32} color="primary" />;
    }
  };

  const contactInfo = [
    {
      type: "phone",
      title: "Téléphone",
      details: ["+221 78 131 91 91", "Service disponible 24h/24"],
      link: "tel:+221781319191"
    },
    {
      type: "email",
      title: "Email",
      details: ["contact@navettexpress.com", "Réponse sous 2h en journée"],
      link: "mailto:contact@navettexpress.com"
    },
    {
      type: "location",
      title: "Adresse",
      details: ["Avenue Léopold Sédar Senghor", "Plateau, Dakar, Sénégal"],
      link: "https://maps.google.com"
    },
    {
      type: "hours",
      title: "Horaires",
      details: ["Bureau: Lun-Ven 8h-20h", "Service: 24h/24, 7j/7"],
      link: null
    }
  ];

  const services = [
    "Transfert Aéroport AIBD Dakar",
    "Transfert Aéroport Thies",
    "Transfert Aéroport Mbour",
    "Chauffeur Privé Dakar",
    "Transport Privé Sénégal",
    "Service VIP",
    "Autre / Devis personnalisé"
  ];

  return (
    <div className="min-h-screen">
      <Navigation variant="solid" />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 mt-16 sm:mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
            Contactez-Nous
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Notre équipe est à votre disposition pour répondre à toutes vos questions 
            et vous accompagner dans vos projets de transport premium.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          
          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Demande de Devis
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Remplissez ce formulaire et nous vous recontacterons dans les plus brefs délais 
                avec une proposition personnalisée.
              </p>
            </div>

            {submitStatus === 'success' && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <span className="text-lg sm:text-xl">✅</span>
                  <span className="font-semibold text-sm sm:text-base">Message envoyé avec succès !</span>
                </div>
                <p className="text-green-700 dark:text-green-300 mt-1 text-xs sm:text-sm">
                  Nous vous recontacterons dans les 2 heures ouvrées.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <span className="text-lg sm:text-xl">❌</span>
                  <span className="font-semibold text-sm sm:text-base">Erreur lors de l&apos;envoi</span>
                </div>
                <p className="text-red-700 dark:text-red-300 mt-1 text-xs sm:text-sm">
                  Veuillez réessayer ou nous appeler directement.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Votre nom et prénom"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Service souhaité *
                  </label>
                  <select
                    id="service"
                    name="service"
                    required
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Sélectionnez un service</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  Date souhaitée
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Décrivez votre besoin en détail (lieux de prise en charge et destination, nombre de passagers, équipements spéciaux, etc.)"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    📧 Envoyer la Demande
                  </>
                )}
              </button>

              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                * Champs obligatoires. Vos données sont sécurisées et ne seront jamais partagées.
              </p>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Contact Cards */}
            <div className="grid gap-4 sm:gap-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-xl flex-shrink-0">
                      {getContactIcon(info.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                        {info.title}
                      </h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-1 break-words">
                          {detail}
                        </p>
                      ))}
                      {info.link && (
                        <a
                          href={info.link}
                          className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1.5 sm:mt-2 inline-block"
                        >
                          {info.title === "Téléphone" ? "Appeler maintenant" : 
                           info.title === "Email" ? "Envoyer un email" :
                           "Voir sur la carte"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Suivez-Nous
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6">
                Restez connecté avec nous sur les réseaux sociaux pour les dernières actualités et offres spéciales.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {/* Facebook */}
                <a href="#" className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-300 group flex-shrink-0">
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="#" className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300 group flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300 group flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-300 group flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-2xl sm:text-3xl flex-shrink-0">🚨</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-200 mb-1.5 sm:mb-2">
                    Urgence 24h/24
                  </h3>
                  <p className="text-sm sm:text-base text-red-800 dark:text-red-300 mb-2 sm:mb-3">
                    En cas d&apos;urgence ou pour une réservation de dernière minute
                  </p>
                  <a
                    href="tel:+221781319191"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors inline-flex items-center gap-2"
                  >
                    📞 Appeler l&apos;urgence
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Notre Localisation
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3 sm:mb-4">
                Trouvez-nous facilement au Plateau, Dakar. Cliquez sur le marqueur pour plus d&apos;informations.
              </p>
              <InteractiveMap
                center={[14.74342, -17.472408]} // Cité Magistrats, Foire,Dakar
                zoom={15}
                height="300px"
                showMarker={true}
                markerTitle="NavetteXpress"
                markerDescription="Avenue Léopold Sédar Senghor, Plateau, Dakar, Sénégal"
                className="border border-slate-200 dark:border-slate-600"
              />
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  <span>Avenue Léopold Sédar Senghor, Plateau</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>🏙️</span>
                  <span>Dakar, Sénégal</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 leading-tight">
            Rejoignez nos clients satisfaits
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-blue-100 leading-relaxed">
            Découvrez pourquoi plus de 1000 clients nous font confiance pour leurs transferts aéroport au Sénégal
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-2xl mx-auto">
            <a
              href="/reservation"
              className="w-full sm:w-auto bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
            >
              Réserver Maintenant
            </a>
            <a
              href="tel:+221781319191"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-colors text-center"
            >
              📞 +221 78 131 91 91
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

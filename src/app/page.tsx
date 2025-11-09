import { Navigation } from "@/components/navigation";
import { SignedIn, SignedOut } from "@/components/auth/auth-components";
import Link from "next/link";
import { Calendar, Users, Phone, ChevronDown, Clock, CheckCircle, Shield } from "lucide-react";
import { BookNowIcon, PrivateDriverIcon } from "@/components/icons/custom-icons";

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      <Navigation variant="transparent" />

      {/* Hero Section - Nouvelle Palette */}
      <section className="relative flex items-center justify-center bg-gradient-to-br from-[#1E293B] via-[#0F5B8A] to-[#334155] dark:from-[#0F172A] dark:via-[#083A5C] dark:to-[#1E293B] pt-32 sm:pt-40 md:pt-44 px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        {/* Subtle background pattern avec accent orange */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF7E38' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Main headline - cleaner typography */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight px-2">
                Transfert Aéroport AIBD Dakar
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-4xl text-[#FFB885] mt-1.5 sm:mt-2">
                  Chauffeur Privé 24h/24
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-[#B8D5E8] max-w-3xl mx-auto leading-relaxed px-4">
                Service de transfert aéroport AIBD, Thies, Mbour. Chauffeurs professionnels, véhicules modernes, 
                réservation instantanée. Votre transport privé de confiance au Sénégal.
              </p>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-slate-400 px-4 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">Transfert AIBD 24h/24</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">Chauffeurs pros</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">Prix compétitifs</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">Réservation instant.</span>
              </div>
            </div>
            
            {/* Primary CTA - More prominent */}
            <div className="pt-3 sm:pt-4 md:pt-5 px-4">
              <SignedOut>
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-center max-w-2xl mx-auto">
                  <Link href="/reservation" className="w-full sm:flex-1">
                    <button className="w-full bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 group">
                      <BookNowIcon size={20} color="white" className="group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span>Réserver Maintenant</span>
                    </button>
                  </Link>
                  <Link href="/devenir-partenaire" className="w-full sm:flex-1">
                    <div className="w-full border border-white/30 text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer group">
                      <PrivateDriverIcon size={18} color="white" className="group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span>Devenir Partenaire</span>
                    </div>
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                <Link href="/reservation" className="inline-block w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-8 sm:px-12 py-3 sm:py-3.5 rounded-xl font-semibold text-lg sm:text-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 mx-auto group">
                    <BookNowIcon size={20} color="white" className="group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span>Réserver Maintenant</span>
                  </button>
                </Link>
              </SignedIn>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto pt-4 sm:pt-5 md:pt-6 px-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">1000+</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Transferts AIBD</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">24/7</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Disponible</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">4.9/5</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Simplified */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFBFC] dark:bg-[#1E293B]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B] dark:text-white mb-3 sm:mb-4 px-2">
              Nos Services Premium
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] dark:text-[#B8D5E8] max-w-2xl mx-auto px-4">
              Transferts aéroport, chauffeur privé et mise à disposition. Services professionnels 24h/24 pour tous vos déplacements
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-slate-50 dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✈️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Transfert Aéroport AIBD Dakar
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3 sm:mb-4">
                Service de transfert vers et depuis l&apos;aéroport AIBD de Dakar. Chauffeurs professionnels, véhicules modernes, prix compétitifs.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
                <li>• Suivi des vols en temps réel</li>
                <li>• Accueil personnalisé avec panneau</li>
                <li>• Véhicules modernes climatisés</li>
                <li>• Service 24h/24, 7j/7</li>
                <li>• Prix compétitifs au Sénégal</li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🚙</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Chauffeur Privé Dakar
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3 sm:mb-4">
                Service de chauffeur privé pour tous vos déplacements dans Dakar et ses environs. Confort et sécurité garantis.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
                <li>• Véhicules modernes</li>
                <li>• Chauffeurs professionnels certifiés</li>
                <li>• Service 24h/24, 7j/7</li>
                <li>• Réservation instantanée</li>
                <li>• Prix compétitifs</li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200 md:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🕐</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Mise à Disposition
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3 sm:mb-4">
                Véhicule et chauffeur à votre disposition pour une durée déterminée avec flexibilité maximale.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
                <li>• Chauffeur dédié exclusivement</li>
                <li>• Planification flexible en temps réel</li>
                <li>• Aucun frais de détour</li>
                <li>• Temps d&apos;attente inclus</li>
                <li>• Service multi-destinations</li>
              </ul>
            </div>
          </div>
          
          {/* CTA to Fleet */}
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Link
              href="/flotte"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors duration-200 text-sm sm:text-base"
            >
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              Découvrir Notre Flotte
            </Link>
          </div>
        </div>
      </section>

      {/* How to Book Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2">
              Comment Réserver ?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
              Processus simple et rapide en 3 étapes - Réservation possible jusqu'à un mois à l'avance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Planifiez votre voyage
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Réservez facilement jusqu'à un mois avant votre voyage
              </p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Confirmation
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Recevez une confirmation avec les détails de votre chauffeur
              </p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Voyagez sereinement
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Votre chauffeur vous attend à l&apos;aéroport avec un panneau
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-8 sm:mt-10 md:mt-12 px-4">
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              Réserver Maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Simplified with Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2">
              Pourquoi Nous Choisir ?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
              Plus de 10 ans d&apos;expérience au service de l&apos;excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">✈️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Transfert AIBD 24h/24
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Service disponible en permanence pour tous vos vols
              </p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚗</div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Véhicules modernes
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Flotte moderne et climatisée pour votre confort
              </p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">👨‍✈️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Chauffeurs Professionnels
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Chauffeurs expérimentés et certifiés
              </p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💰</div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Prix Compétitifs
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Tarifs attractifs au Sénégal
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📱</div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Réservation Instantanée
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Réservez en quelques clics
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Devenir Partenaire Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
              Vous êtes chauffeur expérimenté ?
            </h2>
            <p className="text-base sm:text-lg text-green-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Rejoignez notre équipe de chauffeurs partenaires et bénéficiez de revenus attractifs 
              avec des horaires flexibles. Nous recherchons des professionnels passionnés !
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
              <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💰</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Gains attractifs</h3>
                <p className="text-green-100 text-xs sm:text-sm">Revenus attractifs avec bonus</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⏰</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Horaires flexibles</h3>
                <p className="text-green-100 text-xs sm:text-sm">Choisissez vos créneaux</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚗</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Votre véhicule</h3>
                <p className="text-green-100 text-xs sm:text-sm">Utilisez votre propre voiture</p>
              </div>
            </div>
            
            <Link href="/devenir-partenaire">
              <button className="w-full sm:w-auto bg-white text-green-600 hover:bg-green-50 px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-semibold text-lg sm:text-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 mx-auto">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                Postuler Maintenant
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section - Simplified */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 mb-8 sm:mb-12 md:mb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
            Prêt à Réserver ?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-4">
            Découvrez l&apos;excellence de nos services de transport de luxe
          </p>
          
          <div className="flex flex-col sm:flex-row lg:flex-row gap-3 sm:gap-4 justify-center items-stretch mb-8 sm:mb-10 md:mb-12 px-4">
            <SignedOut>
              <Link href="/reservation" className="w-full sm:flex-1 lg:flex-none lg:w-auto">
                <button className="w-full bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 group">
                  <BookNowIcon size={20} color="white" className="group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span>Réserver Maintenant</span>
                </button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/reservation" className="w-full sm:flex-1 lg:flex-none lg:w-auto">
                <button className="w-full bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 group">
                  <BookNowIcon size={20} color="white" className="group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span>Réserver Maintenant</span>
                </button>
              </Link>
            </SignedIn>
            <a
              href="tel:+221781319191"
              className="w-full sm:flex-1 lg:flex-none lg:w-auto border border-white/30 text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-colors duration-200 flex items-center justify-center gap-2 sm:gap-3"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Appeler</span>
            </a>
            <Link 
              href="/devenir-partenaire"
              className="w-full sm:flex-1 lg:flex-none lg:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Devenir Partenaire</span>
              <span className="sm:hidden">Partenaire</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10">
            <div className="text-center px-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Disponible 24h/24</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Service continu</p>
            </div>
            <div className="text-center px-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Réservation Instantanée</h3>
              <p className="text-slate-400 text-xs sm:text-sm">En quelques clics</p>
            </div>
            <div className="text-center px-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Assurance</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Sécurité garantie</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="sm:col-span-2 md:col-span-2">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  Navette Xpress
                </span>
              </div>
              <p className="text-slate-400 mb-4 sm:mb-6 max-w-md leading-relaxed text-sm sm:text-base">
                Service premium de transport de luxe avec chauffeurs professionnels. 
                Votre confort et votre sécurité sont notre priorité.
              </p>
              <div className="flex gap-3 sm:gap-4">
                {/* Facebook */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Contact</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="text-base sm:text-lg flex-shrink-0">📞</span>
                  <a href="tel:+221781319191" className="text-slate-400 hover:text-white transition-colors duration-300 break-all">
                    +221 78 131 91 91
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base sm:text-lg flex-shrink-0">✉️</span>
                  <a href="mailto:contact@navettexpress.com" className="text-slate-400 hover:text-white transition-colors duration-300 break-all">
                    contact@navettexpress.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base sm:text-lg flex-shrink-0">�</span>
                  <span className="text-slate-400">Dakar, Sénégal</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Services</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/services" className="text-slate-400 hover:text-white transition-colors duration-300">Transferts Aéroport</a></li>
                <li><a href="/services" className="text-slate-400 hover:text-white transition-colors duration-300">Événements Spéciaux</a></li>
                <li><a href="/services" className="text-slate-400 hover:text-white transition-colors duration-300">Voyages d&apos;Affaires</a></li>
                <li><a href="/flotte" className="text-slate-400 hover:text-white transition-colors duration-300">Notre Flotte</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-6 sm:pt-8 text-center">
            <p className="text-slate-500 text-xs sm:text-sm">
              &copy; 2024 Navette Xpress Services. Tous droits réservés. 
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

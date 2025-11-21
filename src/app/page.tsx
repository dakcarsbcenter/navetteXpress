import { Navigation } from "@/components/navigation";
import { SignedIn, SignedOut } from "@/components/auth/auth-components";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, Phone, ChevronDown, Clock, CheckCircle, Shield } from "lucide-react";
import { BookNowIcon, PrivateDriverIcon } from "@/components/icons/custom-icons";

// Fonction pour récupérer les véhicules depuis l'API
async function getVehicles() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/vehicles`, {
      next: { revalidate: 3600 }, // Cache pendant 1 heure
    });
    
    if (!res.ok) {
      console.error('Erreur lors de la récupération des véhicules');
      return [];
    }
    
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

// Fonction helper pour mapper le type de véhicule vers une catégorie
function getVehicleCategory(vehicleType: string, customCategory?: string | null) {
  if (customCategory) return customCategory;
  
  const categoryMap: Record<string, string> = {
    'sedan': 'Berline Affaires',
    'luxury': 'Berline de Luxe',
    'suv': 'SUV VIP',
    'van': 'Van Premium',
    'bus': 'Bus',
  };
  
  return categoryMap[vehicleType] || 'Véhicule';
}

export default async function Home() {
  // Récupérer les véhicules et prendre seulement les 3 premiers
  const dbVehicles = await getVehicles();
  const featuredVehicles = dbVehicles.slice(0, 3).map((vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    category: string | null;
    capacity: number;
    photo: string | null;
    description: string | null;
  }) => ({
    id: vehicle.id,
    name: `${vehicle.make} ${vehicle.model}`,
    category: getVehicleCategory(vehicle.vehicleType, vehicle.category),
    capacity: vehicle.capacity,
    image: vehicle.photo || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center',
    description: vehicle.description || `${vehicle.make} ${vehicle.model} ${vehicle.year} - Véhicule moderne et confortable.`,
  }));
  
  return (
    <div className="font-sans min-h-screen">
      <Navigation variant="transparent" />

      {/* Hero Section - Nouvelle Palette Bordeaux */}
      <section className="relative flex items-center justify-center bg-linear-to-br from-slate-800 via-slate-700 to-slate-600 dark:from-[#1A1A1A] dark:via-[#2A2A2A] dark:to-[#1A1A1A] pt-32 sm:pt-40 md:pt-44 px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        {/* Subtle background pattern avec accent Or Vieilli */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23E5C16C' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Main headline - cleaner typography */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight px-2">
                Voyagez en toute <span className="text-[#E5C16C]">Sérénité et Confort</span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-4xl text-white/90 mt-1.5 sm:mt-2">
                  Votre Chauffeur Privé à Dakar
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed px-4">
                Transfert aéroport AIBD, chauffeur privé à Dakar et mise à disposition. 
                Service premium 24/7 avec des chauffeurs professionnels certifiés.
              </p>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-slate-400 px-4 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full shrink-0"></div>
                <span className="whitespace-nowrap">Transfert AIBD 24h/24</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full shrink-0"></div>
                <span className="whitespace-nowrap">Chauffeurs pros</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full shrink-0"></div>
                <span className="whitespace-nowrap">Prix compétitifs</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full shrink-0"></div>
                <span className="whitespace-nowrap">Réservation instant.</span>
              </div>
            </div>
            
            {/* Primary CTA - More prominent */}
            <div className="pt-3 sm:pt-4 md:pt-5 px-4">
              <SignedOut>
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-center max-w-2xl mx-auto">
                  <Link href="/reservation" className="w-full sm:flex-1">
                    <button className="w-full bg-[#A73B3C] hover:bg-[#8B3032] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 group">
                      <BookNowIcon size={20} color="white" className="group-hover:scale-110 transition-transform shrink-0" />
                      <span>Calculer mon Prix</span>
                    </button>
                  </Link>
                  <Link href="/quote-request" className="w-full sm:flex-1">
                    <div className="w-full bg-[#E5C16C] hover:bg-[#D4B060] text-[#1A1A1A] px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 sm:gap-3 cursor-pointer group">
                      <span>Demander un Devis</span>
                    </div>
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                <Link href="/reservation" className="inline-block w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-[#A73B3C] hover:bg-[#8B3032] text-white px-8 sm:px-12 py-3 sm:py-3.5 rounded-xl font-semibold text-lg sm:text-xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 mx-auto group">
                    <BookNowIcon size={20} color="white" className="group-hover:scale-110 transition-transform shrink-0" />
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

      {/* How to Book Section - 3 Steps */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] dark:bg-[#F5F5F5]/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3 sm:mb-4">
              Réserver votre trajet en 3 étapes simples
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Processus simple et rapide - Confirmation immédiate par email et SMS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-8 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-[#A73B3C] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Planifiez & Devis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Entrez votre destination et obtenez un prix instantané via le widget de réservation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-8 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-[#A73B3C] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Confirmation Sécurisée
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recevez votre confirmation par email/SMS avec les détails de votre chauffeur et véhicule.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-8 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-[#A73B3C] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Voyagez Sereinement
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Votre chauffeur vous attend, votre confort et votre sécurité sont notre priorité absolue.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-10 sm:mt-12">
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 bg-[#A73B3C] hover:bg-[#8B3032] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Calendar className="w-5 h-5" />
              Réserver Maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section - Simplified */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3 sm:mb-4 px-2">
              Pourquoi Choisir Navette Xpress ?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Service premium de transport avec chauffeurs professionnels. Votre confort et sécurité sont notre priorité.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Suivi des Vols */}
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-[#A73B3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Suivi des Vols en Temps Réel
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Votre chauffeur ajuste son heure d&apos;arrivée en fonction du statut de votre vol. Pas de frais d&apos;attente imprévus.
              </p>
            </div>

            {/* Card 2: Accueil Personnalisé */}
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-[#A73B3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="17" y1="11" x2="23" y2="11"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Accueil Personnalisé AIBD
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Votre chauffeur vous attend à la sortie avec une pancarte à votre nom pour une prise en charge immédiate.
              </p>
            </div>

            {/* Card 3: Prix Fixes */}
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-[#A73B3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v7.586a2 2 0 0 0 .586 1.414l8.414 8.414a2 2 0 0 0 2.828 0l5.414-5.414a2 2 0 0 0 0-2.828L14.414 2.586A2 2 0 0 0 13 2z"/>
                  <path d="M7 8h.01"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Prix Fixes et Compétitifs
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Le prix est confirmé à la réservation. Aucun compteur, aucune mauvaise surprise, même en cas de trafic.
              </p>
            </div>

            {/* Card 4: Véhicules de Luxe */}
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-[#A73B3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 19H7a4 4 0 0 1-4-4V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4z"/>
                  <circle cx="7" cy="16" r="2"/>
                  <circle cx="17" cy="16" r="2"/>
                  <path d="M10 5v4h4V5"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                Véhicules de Luxe Climatisés
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Voyagez dans notre flotte moderne, entretenue selon les plus hauts standards de confort et de sécurité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3 sm:mb-4">
              Découvrez Notre Flotte de Véhicules
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Nous vous garantissons un voyage en toute élégance et sécurité. Nos véhicules sont récents et équipés du WiFi et de la climatisation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredVehicles.length > 0 ? (
              featuredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative h-48 bg-[#1A1A1A] dark:bg-[#0A0A0A]">
                    <Image
                      src={vehicle.image}
                      alt={vehicle.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#A73B3C] uppercase tracking-wide">
                        {vehicle.category}
                      </span>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">{vehicle.capacity}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {vehicle.description}
                    </p>
                    <Link
                      href="/flotte"
                      className="inline-block text-[#A73B3C] hover:text-[#8B3032] font-semibold text-sm transition-colors"
                    >
                      En savoir plus →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback si aucun véhicule n'est disponible
              <>
                <div className="bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="bg-[#1A1A1A] dark:bg-[#0A0A0A] h-48 flex items-center justify-center">
                    <h3 className="text-3xl font-bold text-white">Berline Affaires</h3>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                      Berline Affaires
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Idéale pour les transferts rapides et confortables. Capacité : 3 passagers, 2 bagages.
                    </p>
                    <Link
                      href="/flotte"
                      className="inline-block text-[#A73B3C] hover:text-[#8B3032] font-semibold text-sm"
                    >
                      En savoir plus →
                    </Link>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="bg-[#1A1A1A] dark:bg-[#0A0A0A] h-48 flex items-center justify-center">
                    <h3 className="text-3xl font-bold text-white">Van Premium</h3>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                      Van Premium
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Parfait pour les familles ou les petits groupes. Capacité : 7 passagers, 6 bagages.
                    </p>
                    <Link
                      href="/flotte"
                      className="inline-block text-[#A73B3C] hover:text-[#8B3032] font-semibold text-sm"
                    >
                      En savoir plus →
                    </Link>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#252525] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="bg-[#1A1A1A] dark:bg-[#0A0A0A] h-48 flex items-center justify-center">
                    <h3 className="text-3xl font-bold text-white">SUV VIP</h3>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                      SUV VIP
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Le choix du luxe et de l&apos;espace. Capacité : 4 passagers, 3 bagages.
                    </p>
                    <Link
                      href="/flotte"
                      className="inline-block text-[#A73B3C] hover:text-[#8B3032] font-semibold text-sm"
                    >
                      En savoir plus →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CTA Button */}
          <div className="text-center mt-10 sm:mt-12">
            <Link
              href="/flotte"
              className="inline-flex items-center gap-2 bg-[#A73B3C] hover:bg-[#8B3032] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Voir Toute la Flotte
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Prêt à Voyager */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#A73B3C]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Prêt à Voyager avec Excellence ?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-8 sm:mb-10 max-w-3xl mx-auto">
            Réservez votre transfert AIBD ou votre chauffeur privé en quelques clics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/reservation">
              <button className="w-full sm:w-auto bg-[#E5C16C] hover:bg-[#D4B060] text-[#1A1A1A] px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                Réserver Maintenant
              </button>
            </Link>
            <a href="tel:+221781319191">
              <button className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200">
                Appeler (221 78 131 91 91)
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Devenir Partenaire Section */}
      <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-[#A73B3C]">
        <div className="max-w-6xl mx-auto text-center">
          {/* Ligne de séparation décorative */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="w-32 sm:w-40 h-0.5 bg-white/30"></div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Vous êtes chauffeur professionnel ?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-8 sm:mb-10 max-w-3xl mx-auto">
            Rejoignez notre équipe de partenaires et bénéficiez de revenus attractifs et d&apos;horaires flexibles.
          </p>
          
          <Link href="/devenir-partenaire">
            <button className="bg-white text-[#A73B3C] hover:bg-[#FAFAFA] px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Devenir Partenaire
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A] text-gray-400">
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
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#252525] hover:bg-[#E5C16C] rounded-lg flex items-center justify-center transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-[#1A1A1A]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#252525] hover:bg-[#E5C16C] rounded-lg flex items-center justify-center transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-[#1A1A1A]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#252525] hover:bg-[#E5C16C] rounded-lg flex items-center justify-center transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-[#1A1A1A]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#252525] hover:bg-[#E5C16C] rounded-lg flex items-center justify-center transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-[#1A1A1A]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Contact</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="text-base sm:text-lg shrink-0">📞</span>
                  <a href="tel:+221781319191" className="text-slate-400 hover:text-white transition-colors duration-300 break-all">
                    +221 78 131 91 91
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base sm:text-lg shrink-0">✉️</span>
                  <a href="mailto:contact@navettexpress.com" className="text-slate-400 hover:text-white transition-colors duration-300 break-all">
                    contact@navettexpress.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base sm:text-lg shrink-0">�</span>
                  <span className="text-slate-400">Dakar, Sénégal</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Services</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/services" className="text-gray-400 hover:text-[#E5C16C] transition-colors duration-300">Transferts Aéroport</a></li>
                <li><a href="/services" className="text-gray-400 hover:text-[#E5C16C] transition-colors duration-300">Événements Spéciaux</a></li>
                <li><a href="/services" className="text-gray-400 hover:text-[#E5C16C] transition-colors duration-300">Voyages d&apos;Affaires</a></li>
                <li><a href="/flotte" className="text-gray-400 hover:text-[#E5C16C] transition-colors duration-300">Notre Flotte</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#252525] pt-6 sm:pt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              &copy; 2024 Navette Xpress Services. Tous droits réservés. 
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}



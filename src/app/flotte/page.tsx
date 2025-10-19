import { Navigation } from "@/components/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Users } from "lucide-react";
import { LuxuryCarIcon, VanIcon, BookNowIcon } from "@/components/icons/custom-icons";

// Helper function to get vehicle icon based on category
function getVehicleIcon(category: string, size: number = 24) {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('van') || categoryLower.includes('minibus') || categoryLower.includes('9')) {
    return <VanIcon size={size} color="primary" />;
  } else if (categoryLower.includes('luxe') || categoryLower.includes('premium') || categoryLower.includes('executive')) {
    return <LuxuryCarIcon size={size} color="primary" />;
  } else {
    return <LuxuryCarIcon size={size} color="secondary" />; // Default luxury car
  }
}

// Fonction pour récupérer les véhicules depuis l'API
async function getVehicles() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/vehicles`, {
      next: { revalidate: 3600 }, // Cache pendant 1 heure pour le build statique
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
    'sedan': 'Berline',
    'luxury': 'Berline de Luxe',
    'suv': 'SUV',
    'van': 'Van',
    'bus': 'Bus',
  };
  
  return categoryMap[vehicleType] || 'Véhicule';
}

// Fonction helper pour parser les features
function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  
  try {
    return JSON.parse(features);
  } catch {
    return [];
  }
}

export default async function FlottePage() {
  // Récupérer les véhicules depuis la base de données
  const dbVehicles = await getVehicles();
  
  // Mapper les véhicules de la BD vers le format attendu
  const vehicles = dbVehicles.map((vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    category: string | null;
    capacity: number;
    features: string | null;
    photo: string | null;
    description: string | null;
  }) => ({
    id: vehicle.id,
    name: `${vehicle.make} ${vehicle.model}`,
    category: getVehicleCategory(vehicle.vehicleType, vehicle.category),
    capacity: `${vehicle.capacity} ${vehicle.capacity === 1 ? 'passager' : 'passagers'}`,
    features: parseFeatures(vehicle.features),
    image: vehicle.photo || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center',
    description: vehicle.description || `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
  }));
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navigation variant="solid" />

      {/* Hero Section - Focus on Benefits */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Flotte Premium
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-8">
            Des véhicules de luxe soigneusement sélectionnés pour votre confort et sécurité
          </p>
          
          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Véhicules Récents</h3>
              <p className="text-sm text-slate-300">Tous nos véhicules sont récents et parfaitement entretenus</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sécurité Maximale</h3>
              <p className="text-sm text-slate-300">Assurance complète et chauffeurs certifiés</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Service 24h/24</h3>
              <p className="text-sm text-slate-300">Disponible en permanence pour tous vos besoins</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Grid - Simplified with Benefits Focus */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Nos Véhicules
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Chaque véhicule est sélectionné pour offrir confort, sécurité et élégance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle: { id: number; name: string; category: string; capacity: string; features: string[]; image: string; description: string }) => (
              <div 
                key={vehicle.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                {/* Vehicle Header */}
                <div className="bg-slate-50 dark:bg-slate-700 p-6 text-center">
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                    <Image 
                      src={vehicle.image} 
                      alt={vehicle.name}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                                    <div className="inline-block bg-[#FFB885]/20 dark:bg-[#FF7E38]/20 text-[#FF7E38] dark:text-[#FFB885] px-3 py-1 rounded-full text-sm font-medium">
                    Disponible
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#FFB885]/10 rounded-lg">
                      {getVehicleIcon(vehicle.category, 20)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {vehicle.name}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                    {vehicle.description}
                  </p>
                  
                  <div className="flex items-center text-slate-500 dark:text-slate-400 mb-4 text-sm">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="font-medium">{vehicle.capacity}</span>
                  </div>

                  {/* Key Features - Only 3 most important */}
                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Équipements inclus :</h4>
                      <ul className="space-y-2">
                        {vehicle.features.slice(0, 3).map((feature: string, featureIndex: number) => (
                          <li key={featureIndex} className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                              <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <Link
                      href="/reservation"
                      className="w-full bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <BookNowIcon size={16} color="white" />
                      Réserver
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included Services - Simplified */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Services Inclus
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Chaque réservation inclut automatiquement nos services premium
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-700 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Chauffeurs Professionnels
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Expérimentés et en tenue pour tous vos déplacements
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-700 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Assurance Premium
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Couverture complète pour votre sécurité
              </p>
            </div>
            

            <div className="bg-white dark:bg-slate-700 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 text-center">
              <div className="w-12 h-12 bg-[#FFB885]/20 dark:bg-[#FF7E38]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#FF7E38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Service Conciergerie
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Assistance personnalisée 24h/24
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Simplified */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à Réserver ?
          </h2>
          <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto">
            Découvrez l&apos;excellence de nos services de transport de luxe
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/reservation"
              className="bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Réserver Maintenant
            </Link>
            <a
              href="tel:+33123456789"
              className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Appeler
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Réservation Instantanée</h3>
              <p className="text-slate-400 text-sm">En quelques clics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sécurité Garantie</h3>
              <p className="text-slate-400 text-sm">Assurance complète</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Service Premium</h3>
              <p className="text-slate-400 text-sm">Excellence garantie</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-bold text-white">
                  Navette Xpress
                </span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                Service premium de transport de luxe avec chauffeurs professionnels. 
                Votre confort et votre sécurité sont notre priorité.
              </p>
              <div className="flex gap-4">
                {/* Facebook */}
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-3">
                <li><a href="/services" className="text-slate-400 hover:text-white transition-colors duration-300">Transferts Aéroport</a></li>
                <li><a href="/services" className="text-slate-400 hover:text-white transition-colors duration-300">Événements Spéciaux</a></li>
                <li><a href="/services" className="text-slate-400 hover:text-white transition-colors duration-300">Voyages d&apos;Affaires</a></li>
                <li><a href="/flotte" className="text-slate-400 hover:text-white transition-colors duration-300">Notre Flotte</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <a href="tel:+33123456789" className="text-slate-400 hover:text-white transition-colors duration-300">
                    +33 1 23 45 67 89
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">✉️</span>
                  <a href="mailto:contact@premiumchauffeur.fr" className="text-slate-400 hover:text-white transition-colors duration-300">
                    contact@premiumchauffeur.fr
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-slate-400">Dakar, Sénégal</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-500">
              &copy; 2024 Navette Xpress Services. Tous droits réservés. 
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { Button } from '../ui/Button';
import { ServiceCard } from '../ui/ServiceCard';
import { VehicleCard } from '../ui/VehicleCard';
import { TestimonialCard } from '../ui/TestimonialCard';
import { StatsCard } from '../ui/StatsCard';

const HomePageMockup: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                Transfert Aéroport AIBD Dakar
                <span className="block text-3xl sm:text-4xl lg:text-5xl text-blue-300 mt-2">
                  Chauffeur Privé 24h/24
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Service de transfert aéroport AIBD, Thies, Mbour. Chauffeurs professionnels, véhicules de luxe, 
                réservation instantanée. Votre transport privé de confiance au Sénégal.
              </p>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Transfert AIBD 24h/24</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Chauffeurs professionnels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Prix compétitifs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Réservation instantanée</span>
              </div>
            </div>
            
            {/* Primary CTA */}
            <div className="pt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                <Button 
                  variant="primary" 
                  size="xl"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Réserver Maintenant
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-white/30 text-white hover:bg-white/10"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                >
                  Devenir Partenaire
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1000+</div>
                <div className="text-sm text-slate-400">Transferts AIBD</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-400">Disponible</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-sm text-slate-400">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Nos Services Premium
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Transferts aéroport, chauffeur privé et mise à disposition. Services professionnels 24h/24 pour tous vos déplacements
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              title="Transfert Aéroport AIBD Dakar"
              description="Service de transfert vers et depuis l&apos;aéroport AIBD de Dakar. Chauffeurs professionnels, véhicules de luxe, prix compétitifs."
              icon="✈️"
              features={[
                "Suivi des vols en temps réel",
                "Accueil personnalisé avec panneau",
                "Véhicules de luxe climatisés",
                "Service 24h/24, 7j/7",
                "Prix compétitifs au Sénégal"
              ]}
              price="25 000 FCFA"
              priceNote="par trajet"
              isPopular={true}
              onBook={() => console.log('Réserver transfert AIBD')}
            />

            <ServiceCard
              title="Chauffeur Privé Dakar"
              description="Service de chauffeur privé pour tous vos déplacements dans Dakar et ses environs. Confort et sécurité garantis."
              icon="🚙"
              features={[
                "Véhicules de luxe modernes",
                "Chauffeurs professionnels certifiés",
                "Service 24h/24, 7j/7",
                "Réservation instantanée",
                "Prix compétitifs"
              ]}
              price="20 000 FCFA"
              priceNote="par heure"
              onBook={() => console.log('Réserver chauffeur privé')}
            />

            <ServiceCard
              title="Mise à Disposition"
              description="Véhicule et chauffeur à votre disposition pour une durée déterminée avec flexibilité maximale."
              icon="🕐"
              features={[
                "Chauffeur dédié exclusivement",
                "Planification flexible en temps réel",
                "Aucun frais de détour",
                "Temps d'attente inclus",
                "Service multi-destinations"
              ]}
              price="30 000 FCFA"
              priceNote="par demi-journée"
              onBook={() => console.log('Réserver mise à disposition')}
            />
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Notre Flotte de Luxe
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Véhicules modernes et confortables pour tous vos déplacements
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <VehicleCard
              name="Mercedes Classe E"
              type="Berline de Luxe"
              capacity={4}
              features={[
                "Climatisation automatique",
                "WiFi gratuit",
                "Eau minérale",
                "Chauffeur professionnel",
                "Sièges en cuir"
              ]}
              price="35 000 FCFA"
              isLuxury={true}
              rating={4.9}
              onSelect={() => console.log('Sélectionner Mercedes')}
            />

            <VehicleCard
              name="Toyota Camry"
              type="Berline Confort"
              capacity={4}
              features={[
                "Climatisation",
                "Eau minérale",
                "Chauffeur professionnel",
                "Sièges confortables"
              ]}
              price="25 000 FCFA"
              rating={4.7}
              onSelect={() => console.log('Sélectionner Toyota')}
            />

            <VehicleCard
              name="BMW Série 5"
              type="Berline Premium"
              capacity={4}
              features={[
                "Climatisation automatique",
                "WiFi gratuit",
                "Eau minérale",
                "Chauffeur professionnel",
                "Sièges en cuir",
                "Système audio premium"
              ]}
              price="40 000 FCFA"
              isLuxury={true}
              rating={4.9}
              onSelect={() => console.log('Sélectionner BMW')}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Témoignages Clients
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Découvrez ce que nos clients disent de nos services
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              name="Marie Diop"
              role="Voyageuse d'affaires"
              content="Service exceptionnel ! Mon chauffeur était ponctuel et très professionnel. Je recommande vivement NavetteXpress pour tous vos déplacements à Dakar."
              rating={5}
              service="Transfert Aéroport"
              date="Il y a 2 jours"
              isVerified={true}
            />

            <TestimonialCard
              name="Amadou Ba"
              role="Directeur d'entreprise"
              content="Excellent service de chauffeur privé. Véhicule impeccable et chauffeur très courtois. Parfait pour mes rendez-vous d'affaires."
              rating={5}
              service="Chauffeur Privé"
              date="Il y a 1 semaine"
              isVerified={true}
            />

            <TestimonialCard
              name="Fatou Sall"
              role="Touriste"
              content="Très bon accueil à l'aéroport avec panneau personnalisé. Le chauffeur nous a fait découvrir Dakar. Service de qualité !"
              rating={4}
              service="Transfert Aéroport"
              date="Il y a 3 jours"
              isVerified={false}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Nos Performances
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Des chiffres qui parlent d&apos;eux-mêmes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatsCard
              title="Transferts Réalisés"
              value="1,247"
              description="Ce mois"
              icon="✈️"
              trend={{ value: 12, isPositive: true }}
              color="blue"
            />

            <StatsCard
              title="Satisfaction Client"
              value="4.9/5"
              description="Note moyenne"
              icon="⭐"
              trend={{ value: 5, isPositive: true }}
              color="green"
            />

            <StatsCard
              title="Chauffeurs Actifs"
              value="45"
              description="Professionnels"
              icon="👨‍✈️"
              trend={{ value: 8, isPositive: true }}
              color="orange"
            />

            <StatsCard
              title="Véhicules en Flotte"
              value="32"
              description="Tous modèles"
              icon="🚗"
              trend={{ value: 3, isPositive: true }}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à Réserver ?
          </h2>
          <p className="text-lg text-orange-100 mb-12 max-w-2xl mx-auto">
            Découvrez l&apos;excellence de nos services de transport de luxe
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="luxury" 
              size="xl"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              Réserver Maintenant
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="border-white text-white hover:bg-white hover:text-orange-600"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            >
              Appeler
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePageMockup;


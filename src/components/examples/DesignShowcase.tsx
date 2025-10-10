import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ServiceCard } from '../ui/ServiceCard';
import { VehicleCard } from '../ui/VehicleCard';
import { TestimonialCard } from '../ui/TestimonialCard';
import { StatsCard } from '../ui/StatsCard';

const DesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            NavetteXpress
            <span className="block text-3xl text-gradient bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Design System Showcase
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Charte graphique complète pour le service de transport de luxe au Sénégal
          </p>
        </div>

        {/* Couleurs */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Palette de Couleurs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Primaires</h3>
              <div className="space-y-2">
                <div className="w-full h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  Bleu Principal
                </div>
                <div className="w-full h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  Orange Accent
                </div>
                <div className="w-full h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  Vert Sénégal
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">États</h3>
              <div className="space-y-2">
                <div className="w-full h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  Succès
                </div>
                <div className="w-full h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  Erreur
                </div>
                <div className="w-full h-12 bg-yellow-500 rounded-lg flex items-center text-white font-semibold">
                  Avertissement
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Neutres</h3>
              <div className="space-y-2">
                <div className="w-full h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-semibold">
                  Slate 900
                </div>
                <div className="w-full h-12 bg-slate-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  Slate 600
                </div>
                <div className="w-full h-12 bg-slate-300 rounded-lg flex items-center justify-center text-slate-900 font-semibold">
                  Slate 300
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Gradients</h3>
              <div className="space-y-2">
                <div className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  Bleu-Purple
                </div>
                <div className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  Orange-Rouge
                </div>
                <div className="w-full h-12 bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg flex items-center justify-center text-white font-semibold">
                  Luxe
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Boutons */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Composants Boutons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Variantes</h3>
              <div className="space-y-3">
                <Button variant="primary" size="md">
                  Bouton Principal
                </Button>
                <Button variant="secondary" size="md">
                  Bouton Secondaire
                </Button>
                <Button variant="luxury" size="md">
                  Bouton Luxe
                </Button>
                <Button variant="outline" size="md">
                  Bouton Outline
                </Button>
                <Button variant="ghost" size="md">
                  Bouton Ghost
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Tailles</h3>
              <div className="space-y-3">
                <Button variant="primary" size="sm">
                  Petit
                </Button>
                <Button variant="primary" size="md">
                  Moyen
                </Button>
                <Button variant="primary" size="lg">
                  Grand
                </Button>
                <Button variant="primary" size="xl">
                  Très Grand
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Avec Icônes</h3>
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  size="md"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Réserver
                </Button>
                <Button 
                  variant="secondary" 
                  size="md"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                  iconPosition="right"
                >
                  Appeler
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">États</h3>
              <div className="space-y-3">
                <Button variant="primary" size="md" loading>
                  Chargement
                </Button>
                <Button variant="primary" size="md" disabled>
                  Désactivé
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Composants Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard
              title="Transfert Aéroport AIBD"
              description="Service de transfert vers et depuis l'aéroport AIBD de Dakar"
              icon="✈️"
              features={[
                "Suivi des vols en temps réel",
                "Accueil personnalisé avec panneau",
                "Véhicules de luxe climatisés",
                "Service 24h/24, 7j/7"
              ]}
              price="25 000 FCFA"
              priceNote="par trajet"
              isPopular={true}
              onBook={() => console.log('Réserver')}
            />
            
            <VehicleCard
              name="Mercedes Classe E"
              type="Berline de Luxe"
              capacity={4}
              features={[
                "Climatisation",
                "WiFi gratuit",
                "Eau minérale",
                "Chauffeur professionnel"
              ]}
              price="35 000 FCFA"
              isLuxury={true}
              rating={4.9}
              onSelect={() => console.log('Sélectionner')}
            />
            
            <TestimonialCard
              name="Marie Diop"
              role="Voyageuse d'affaires"
              content="Service exceptionnel ! Mon chauffeur était ponctuel et très professionnel. Je recommande vivement NavetteXpress pour tous vos déplacements à Dakar."
              rating={5}
              service="Transfert Aéroport"
              date="Il y a 2 jours"
              isVerified={true}
            />
          </div>
        </section>

        {/* Badges et Stats */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Badges et Statistiques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Par défaut</Badge>
                <Badge variant="success">Succès</Badge>
                <Badge variant="warning">Avertissement</Badge>
                <Badge variant="error">Erreur</Badge>
                <Badge variant="info">Information</Badge>
                <Badge variant="luxury">Luxe</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Statistiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Transferts"
                  value="1,247"
                  description="Ce mois"
                  icon="✈️"
                  trend={{ value: 12, isPositive: true }}
                  color="blue"
                />
                <StatsCard
                  title="Satisfaction"
                  value="4.9/5"
                  description="Note moyenne"
                  icon="⭐"
                  trend={{ value: 5, isPositive: true }}
                  color="green"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Typographie
          </h2>
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Titre Hero - 5xl
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisé pour les titres principaux des sections hero
              </p>
            </div>
            
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Titre de Section - 4xl
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisé pour les titres de sections importantes
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Titre de Card - 2xl
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisé pour les titres de cartes et composants
              </p>
            </div>
            
            <div>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Texte de corps - lg. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p className="text-base text-slate-600 dark:text-slate-400">
                Texte de corps - base. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </div>
        </section>

        {/* Gradients et Effets */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Gradients et Effets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl">
                Gradient Bleu-Purple
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisé pour les éléments premium et les accents
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <div className="w-full h-32 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl">
                Gradient Orange-Rouge
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisé pour les call-to-action et les éléments importants
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <div className="w-full h-32 bg-gradient-to-r from-slate-900 to-slate-700 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl">
                Gradient Luxe
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisé pour les éléments de luxe et premium
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignShowcase;

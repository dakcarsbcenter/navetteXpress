import React from 'react';
import { 
  LuxuryCarIcon, 
  VanIcon, 
  AirportIcon, 
  PrivateDriverIcon, 
  RealTimeTrackingIcon, 
  SafetyFirstIcon,
  LuggageServiceIcon,
  BookNowIcon,
  LiveStatusIcon,
  TerrangaIcon 
} from '@/components/icons/custom-icons';

export default function IconographyPage() {
  const iconSections = [
    {
      title: "🚗 Transport & Véhicules",
      description: "Icônes premium pour la flotte NavetteXpress",
      icons: [
        { name: "Voiture de Luxe", component: <LuxuryCarIcon size={48} color="primary" /> },
        { name: "Van 9 Places", component: <VanIcon size={48} color="primary" /> },
        { name: "Transfert Aéroport", component: <AirportIcon size={48} color="secondary" /> }
      ]
    },
    {
      title: "👨‍✈️ Services Premium",
      description: "Icônes métier pour l'expérience client",
      icons: [
        { name: "Chauffeur Privé", component: <PrivateDriverIcon size={48} color="primary" /> },
        { name: "Suivi Temps Réel", component: <RealTimeTrackingIcon size={48} color="secondary" /> },
        { name: "Sécurité Premium", component: <SafetyFirstIcon size={48} color="primary" /> },
        { name: "Service Bagages", component: <LuggageServiceIcon size={48} color="neutral" /> }
      ]
    },
    {
      title: "📱 Interface Moderne",
      description: "Éléments UI/UX avec micro-interactions",
      icons: [
        { name: "Bouton Réservation", component: <BookNowIcon size={48} color="primary" /> },
        { name: "Statut En Ligne", component: <LiveStatusIcon status="online" size={16} /> },
        { name: "Statut Occupé", component: <LiveStatusIcon status="busy" size={16} /> },
        { name: "Statut Hors Ligne", component: <LiveStatusIcon status="offline" size={16} /> }
      ]
    },
    {
      title: "🇸🇳 Identité Culturelle",
      description: "Touches sénégalaises authentiques",
      icons: [
        { name: "Teranga (Hospitalité)", component: <TerrangaIcon size={48} color="primary" /> }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#1E293B] mb-4">
            Iconographie Moderne NavetteXpress
          </h1>
          <p className="text-lg text-[#64748B] max-w-3xl mx-auto mb-8">
            Collection d'icônes custom premium, conçues spécifiquement pour l'identité visuelle moderne de NavetteXpress. 
            Minimalistes, élégantes et parfaitement adaptées au secteur du transport haut de gamme.
          </p>
          
          {/* Statistiques */}
          <div className="grid md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-2xl font-bold text-[#FF7E38]">10+</div>
              <div className="text-sm text-[#64748B]">Icônes Custom</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-2xl font-bold text-[#0F5B8A]">SVG</div>
              <div className="text-sm text-[#64748B]">Format Vectoriel</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-2xl font-bold text-[#10B981]">100%</div>
              <div className="text-sm text-[#64748B]">Responsive</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-2xl font-bold text-[#1E293B]">AA</div>
              <div className="text-sm text-[#64748B]">Accessibilité</div>
            </div>
          </div>
        </div>

        {/* Sections d'icônes */}
        {iconSections.map((section, index) => (
          <div key={index} className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1E293B] mb-4">
                {section.title}
              </h2>
              <p className="text-[#64748B]">
                {section.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.icons.map((icon, iconIndex) => (
                <div 
                  key={iconIndex}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-[#FF7E38]/30 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-[#FFB885]/10 rounded-lg group-hover:bg-[#FFB885]/20 transition-colors duration-200">
                      {icon.component}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1E293B] mb-1">
                        {icon.name}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Avantages de la nouvelle iconographie */}
        <div className="bg-white rounded-xl p-8 shadow-lg border mt-16">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8 text-center">
            🎯 Avantages de la Nouvelle Iconographie
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FFB885]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <SafetyFirstIcon size={24} color="primary" />
              </div>
              <h3 className="text-lg font-semibold text-[#FF7E38] mb-3">Identité Premium</h3>
              <p className="text-[#64748B] text-sm">
                Icônes custom qui renforcent l'image haut de gamme et la différenciation concurrentielle
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#B8D5E8]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <RealTimeTrackingIcon size={24} color="secondary" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F5B8A] mb-3">UX Optimisée</h3>
              <p className="text-[#64748B] text-sm">
                Reconnaissance immédiate des fonctionnalités, navigation intuitive et engagement accru
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#E2E8F0] rounded-lg flex items-center justify-center mx-auto mb-4">
                <TerrangaIcon size={24} color="neutral" />
              </div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-3">Culture Sénégalaise</h3>
              <p className="text-[#64748B] text-sm">
                Intégration subtile de l'identité locale pour créer une connexion émotionnelle authentique
              </p>
            </div>
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F5B8A] rounded-xl p-8 text-white mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">
            📖 Guide d'Implémentation
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#FFB885] mb-4">Phase 1: Icônes Critiques</h3>
              <ul className="space-y-2 text-sm text-[#B8D5E8]">
                <li>• Remplacer les icônes de véhicules dans la flotte</li>
                <li>• Mettre à jour les boutons CTA avec BookNowIcon</li>
                <li>• Implémenter les indicateurs de statut live</li>
                <li>• Ajouter l'icône chauffeur privé dans les services</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#FFB885] mb-4">Phase 2: Interface Complète</h3>
              <ul className="space-y-2 text-sm text-[#B8D5E8]">
                <li>• Intégrer toutes les icônes de service</li>
                <li>• Ajouter les micro-interactions</li>
                <li>• Implémenter les icônes culturelles</li>
                <li>• Tests utilisateur et optimisations</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <h4 className="font-semibold mb-3 text-[#FFB885]">💡 Exemple d'Utilisation :</h4>
            <code className="text-sm text-[#B8D5E8] block">
              {`import { LuxuryCarIcon } from '@/components/icons/custom-icons';
              
<LuxuryCarIcon size={32} color="primary" className="mr-3" />`}
            </code>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
            <BookNowIcon size={24} color="white" />
            Implémenter la Nouvelle Iconographie
          </div>
        </div>

      </div>
    </div>
  );
}
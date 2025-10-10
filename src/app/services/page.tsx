import { Navigation } from "@/components/navigation";
import { 
  AirportIcon, 
  LuxuryCarIcon, 
  PrivateDriverIcon, 
  SafetyFirstIcon,
  BookNowIcon
} from "@/components/icons/custom-icons";
import Link from "next/link";

export default function ServicesPage() {
  // Function to get icon component for each service
  const getServiceIcon = (serviceId: number) => {
    switch (serviceId) {
      case 1:
        return <AirportIcon size={48} color="primary" />;
      case 2:
        return <LuxuryCarIcon size={48} color="secondary" />;
      case 3:
        return <PrivateDriverIcon size={48} color="primary" />;
      case 4:
        return <SafetyFirstIcon size={48} color="secondary" />;
      case 5:
        return <LuxuryCarIcon size={48} color="primary" />;
      case 6:
        return <PrivateDriverIcon size={48} color="neutral" />;
      default:
        return <AirportIcon size={48} color="primary" />;
    }
  };

  const services = [
    {
      id: 1,
      title: "Transfert Aéroport AIBD Dakar",
      description: "Service de transfert vers et depuis l&apos;aéroport AIBD de Dakar. Chauffeurs professionnels, véhicules de luxe, prix compétitifs.",
      features: [
        "Suivi des vols en temps réel",
        "Accueil personnalisé avec panneau",
        "Véhicules de luxe climatisés",
        "Service 24h/24, 7j/7",
        "Prix compétitifs au Sénégal"
      ]
    },
    {
      id: 2,
      title: "Transfert Aéroport Thies & Mbour",
      description: "Service de transfert vers les aéroports de Thies et Mbour. Déplacements confortables et sécurisés au Sénégal.",
      features: [
        "Véhicules modernes et climatisés",
        "Chauffeurs expérimentés",
        "Réservation facile et rapide",
        "Tarifs attractifs",
        "Service 24h/24"
      ]
    },
    {
      id: 3,
      title: "Chauffeur Privé Dakar",
      description: "Service de chauffeur privé pour tous vos déplacements dans Dakar et ses environs. Confort et sécurité garantis.",
      features: [
        "Véhicules de luxe modernes",
        "Chauffeurs professionnels certifiés",
        "Service 24h/24, 7j/7",
        "Réservation instantanée",
        "Prix compétitifs"
      ]
    },
    {
      id: 4,
      title: "Tours & Excursions",
      description: "Découvrez Dakar et ses environs avec nos guides-chauffeurs expérimentés pour une expérience unique.",
      features: [
        "Guides-chauffeurs multilingues",
        "Itinéraires personnalisables",
        "Arrêts photos inclus",
        "Commentaires historiques",
        "Entrées monuments sur demande"
      ]
    },
    {
      id: 5,
      title: "Services VIP",
      description: "Service ultra-premium avec véhicules d&apos;exception et prestations sur-mesure pour une clientèle exigeante.",
      features: [
        "Véhicules de collection",
        "Butler personnel disponible",
        "Service conciergerie inclus",
        "Sécurité renforcée possible",
        "Prestations 100% personnalisables"
      ]
    },
    {
      id: 6,
      title: "Mise à Disposition",
      description: "Véhicule et chauffeur à votre disposition pour une durée déterminée avec flexibilité maximale.",
      features: [
        "Chauffeur dédié exclusivement",
        "Planification flexible en temps réel",
        "Aucun frais de détour",
        "Temps d&apos;attente inclus",
        "Service multi-destinations"
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation variant="solid" />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white py-20 px-8 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Services de Transfert Aéroport Sénégal
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Transferts AIBD Dakar, Thies, Mbour. Chauffeurs privés professionnels 24h/24 pour tous vos déplacements aéroportuaires au Sénégal. 
            Service de qualité, prix compétitifs, réservation instantanée.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {services.map((service) => (
              <div 
                key={service.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      {getServiceIcon(service.id)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {service.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mt-2">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                      Prestations incluses :
                    </h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>


                  {/* CTA */}
                  <div className="flex gap-3">
                    <Link
                      href="/reservation"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-6 py-3 rounded-lg font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <BookNowIcon size={16} color="white" />
                      Réserver ce service
                    </Link>
                    <Link
                      href="/contact"
                      className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Devis
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-8 bg-slate-900 dark:bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d&apos;un Service Personnalisé ?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Nos équipes sont à votre disposition pour créer une solution sur-mesure 
            adaptée à vos besoins spécifiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <BookNowIcon size={20} color="white" />
              Nous Contacter
            </Link>
            <a
              href="tel:+33123456789"
              className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              📞 01 23 45 67 89
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

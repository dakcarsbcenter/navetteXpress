import { Navigation } from "@/components/navigation";
import { 
  AirportIcon, 
  LuxuryCarIcon, 
  PrivateDriverIcon, 
  SafetyFirstIcon,
  BookNowIcon
} from "@/components/icons/custom-icons";
import { serviceTypes } from "@/lib/services";
import Link from "next/link";

export default function ServicesPage() {
  // Function to get icon component for each service
  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case "transfert-aibd-dakar":
        return <AirportIcon size={40} color="primary" />;
      case "transfert-Dakar-AIBD":
        return <LuxuryCarIcon size={40} color="secondary" />;
      case "chauffeur-prive-dakar":
        return <PrivateDriverIcon size={40} color="primary" />;
      case "tours-excursions":
        return <SafetyFirstIcon size={40} color="secondary" />;
      case "services-vip":
        return <LuxuryCarIcon size={40} color="primary" />;
      case "mise-a-disposition":
        return <PrivateDriverIcon size={40} color="neutral" />;
      default:
        return <AirportIcon size={40} color="primary" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation variant="solid" />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white pt-18 pb-12 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
            Services de Transfert Aéroport Sénégal
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-slate-300 max-w-4xl mx-auto leading-relaxed px-2">
            Transferts AIBD-Dakar, Dakar-AIBD, Dakar-Mbour. Petite Côte, Chauffeurs privés professionnels 24h/24. 
            Service de qualité, prix compétitifs, réservation instantanée.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {serviceTypes.map((service) => (
              <div 
                key={service.id}
                className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-4 sm:p-6 md:p-8">
                  {/* Header */}
                  <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg sm:rounded-xl flex-shrink-0">
                      {getServiceIcon(service.id)}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">
                        {service.name}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 sm:mt-2">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4 sm:mb-6 text-center">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
                      Prestations incluses :
                    </h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-left inline-block">
                      {service.features?.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                          <span className="text-xs sm:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                    <Link
                      href={`/reservation?service=${service.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <BookNowIcon size={16} color="white" />
                      Réserver ce service
                    </Link>
                    <Link
                      href="/contact"
                      className="px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center text-sm sm:text-base"
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
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-slate-900 dark:bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">Besoin d&apos;un Service Personnalisé ?</h2>
          <p className="text-slate-300 mb-6 sm:mb-8 text-base sm:text-lg px-2">
            Nos équipes sont à votre disposition pour créer une solution sur-mesure 
            adaptée à vos besoins spécifiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/contact"
              className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <BookNowIcon size={20} color="white" />
              Nous Contacter
            </Link>
            <a
              href="tel:+221781319191"
              className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors"
            >
              📞 +221 78 131 91 91
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

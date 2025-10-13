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
        return <AirportIcon size={48} color="primary" />;
      case "transfert-thies-mbour":
        return <LuxuryCarIcon size={48} color="secondary" />;
      case "chauffeur-prive-dakar":
        return <PrivateDriverIcon size={48} color="primary" />;
      case "tours-excursions":
        return <SafetyFirstIcon size={48} color="secondary" />;
      case "services-vip":
        return <LuxuryCarIcon size={48} color="primary" />;
      case "mise-a-disposition":
        return <PrivateDriverIcon size={48} color="neutral" />;
      default:
        return <AirportIcon size={48} color="primary" />;
    }
  };

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
            {serviceTypes.map((service) => (
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
                        {service.name}
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
                      {service.features?.map((feature, index) => (
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
                      href={`/reservation?service=${service.id}`}
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

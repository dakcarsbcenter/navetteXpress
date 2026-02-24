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
      <section className="relative bg-[#1A1A1A] text-white pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 px-4 sm:px-6 md:px-8">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23E5C16C' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight">
            <span className="text-[#E5C16C]">Trois Services</span>, Une Qualité
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-white/90 max-w-4xl mx-auto leading-relaxed">
            Découvrez l&apos;offre qui correspond le mieux à vos exigences de déplacement au Sénégal.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-[#FAFAFA] dark:bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {serviceTypes.map((service) => (
              <div 
                key={service.id}
                className="bg-white dark:bg-[#252525] rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden border-t-4 border-[#A73B3C]"
              >
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="flex flex-col items-start mb-6">
                    <div className="text-[#A73B3C] mb-4">
                      {getServiceIcon(service.id)}
                    </div>
                    <div className="w-full">
                      <h3 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#FAFAFA] mb-3">
                        {service.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                      {service.features?.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#E5C16C] mr-2 text-xl font-bold">•</span>
                          <span className="text-sm sm:text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/reservation?service=${service.id}`}
                    className="w-full block text-center py-3 bg-[#A73B3C] hover:bg-[#8B3032] text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
                  >
                    Réserver ce Service
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 md:px-8 bg-[#A73B3C] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Une Question sur nos Forfaits ?</h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90">
            Notre équipe est disponible 24/7 pour vous conseiller et vous accompagner.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-[#E5C16C] hover:bg-[#D4B060] text-[#1A1A1A] font-bold rounded-lg shadow-2xl transition-all duration-300 text-lg"
          >
            Contacter un Conseiller
          </Link>
        </div>
      </section>
    </div>
  );
}

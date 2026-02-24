import { Navigation } from "@/components/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Témoignages Clients | Navette Xpress Sénégal - Transfert Aéroport AIBD",
  description: "Découvrez les témoignages de nos clients satisfaits. Plus de 1000 transferts aéroport AIBD réussis au Sénégal. Chauffeurs professionnels, service 24h/24.",
  keywords: "témoignages transfert aéroport Dakar, avis clients navette AIBD, satisfaction client Sénégal",
  openGraph: {
    title: "Témoignages Clients | Navette Xpress Sénégal",
    description: "Découvrez les témoignages de nos clients satisfaits pour nos services de transfert aéroport AIBD.",
    url: 'https://navettexpress.sn/temoignages',
  },
};

export default function TemoignagesPage() {
  const temoignages = [
    {
      id: 1,
      nom: "Marie Diop",
      role: "Directrice Marketing",
      note: 5,
      commentaire: "Service exceptionnel ! Chauffeur ponctuel, véhicule impeccable. Je recommande vivement Navette Xpress pour les transferts aéroport AIBD. Prix très compétitifs au Sénégal.",
      date: "2024-12-15",
      service: "Transfert AIBD Dakar"
    },
    {
      id: 2,
      nom: "Amadou Ba",
      role: "Entrepreneur",
      note: 5,
      commentaire: "Utilisé plusieurs fois pour mes voyages d'affaires. Service professionnel, chauffeurs expérimentés. Le suivi des vols en temps réel est un vrai plus !",
      date: "2024-12-10",
      service: "Chauffeur Privé Dakar"
    },
    {
      id: 3,
      nom: "Fatou Sall",
      role: "Touriste",
      note: 5,
      commentaire: "Première fois au Sénégal, Navette Xpress m'a rassurée dès l'aéroport. Chauffeur accueillant, véhicule confortable. Parfait pour découvrir Dakar !",
      date: "2024-12-08",
      service: "Transfert Aéroport Thies"
    },
    {
      id: 4,
      nom: "Papa Diouf",
      role: "Cadre Supérieur",
      note: 5,
      commentaire: "Service 24h/24 très pratique. J'ai eu un vol retardé, le chauffeur a attendu patiemment. Service client au top !",
      date: "2024-12-05",
      service: "Transfert AIBD Dakar"
    },
    {
      id: 5,
      nom: "Aïcha Ndiaye",
      role: "Médecin",
      note: 5,
      commentaire: "Véhicules très propres, chauffeurs respectueux. Prix abordables pour la qualité du service. Je recommande sans hésitation !",
      date: "2024-12-01",
      service: "Transfert Aéroport Mbour"
    },
    {
      id: 6,
      nom: "Moussa Diallo",
      role: "Diplomate",
      note: 5,
      commentaire: "Service VIP impeccable. Chauffeur bilingue, véhicule de luxe. Parfait pour recevoir des invités importants. Navette Xpress est devenu mon choix numéro 1.",
      date: "2024-11-28",
      service: "Service VIP"
    },
    {
      id: 7,
      nom: "Khadija Fall",
      role: "Étudiante",
      note: 5,
      commentaire: "Réservation facile et rapide. Chauffeur à l'heure, prix étudiants. Service parfait pour mes déplacements entre Dakar et Thies.",
      date: "2024-11-25",
      service: "Transfert Aéroport Thies"
    },
    {
      id: 8,
      nom: "Cheikh Wade",
      role: "Homme d'Affaires",
      note: 5,
      commentaire: "Utilisé pour un mariage, service exceptionnel. Limousine magnifique, chauffeur en tenue. Nos invités ont été impressionnés !",
      date: "2024-11-20",
      service: "Événement Spécial"
    }
  ];

  const stats = [
    { nombre: "1000+", label: "Transferts Réussis" },
    { nombre: "4.9/5", label: "Note Moyenne" },
    { nombre: "98%", label: "Clients Satisfaits" },
    { nombre: "24/7", label: "Service Disponible" }
  ];

  return (
    <div className="min-h-screen">
      <Navigation variant="solid" />
      
      {/* Hero Section */}
      <section className="relative bg-[#1A1A1A] text-white pt-20 pb-6 sm:pt-32 sm:pb-8 md:pt-36 md:pb-10 px-6 sm:px-8 md:px-8 overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E5C16C' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3 leading-tight px-2">
            <span className="text-[#E5C16C]">Témoignages</span> Clients
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            Découvrez pourquoi plus de 1000 clients nous font confiance pour leurs transferts aéroport au Sénégal
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#A73B3C] mb-1 sm:mb-2">
                  {stat.nombre}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages Grid */}
      <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 bg-white dark:bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2 sm:mb-3 leading-tight">
              Ce que disent <span className="text-[#E5C16C]">nos clients</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Plus de 1000 transferts aéroport réussis au Sénégal avec une satisfaction client de 98%
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {temoignages.map((temoignage) => (
              <div key={temoignage.id} className="bg-white dark:bg-[#252525] p-4 sm:p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-[#A73B3C]">
                {/* Note */}
                <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                  <div className="flex text-[#E5C16C]">
                    {[...Array(temoignage.note)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {temoignage.date}
                  </span>
                </div>

                {/* Commentaire */}
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 italic leading-relaxed">
                  &quot;{temoignage.commentaire}&quot;
                </p>

                {/* Service */}
                <div className="mb-3 sm:mb-4">
                  <span className="inline-block bg-[#E5C16C]/20 text-[#A73B3C] text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {temoignage.service}
                  </span>
                </div>

                {/* Client */}
                <div className="flex items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#A73B3C] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {temoignage.nom.charAt(0)}
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <div className="font-semibold text-sm sm:text-base text-[#1A1A1A] dark:text-white">
                      {temoignage.nom}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {temoignage.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 bg-[#A73B3C] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
            Rejoignez nos clients satisfaits
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-5 sm:mb-6 text-gray-100 leading-relaxed px-2">
            Découvrez pourquoi plus de 1000 clients nous font confiance pour leurs transferts aéroport au Sénégal
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-2xl mx-auto">
            <a
              href="/reservation"
              className="w-full sm:w-auto bg-[#E5C16C] hover:bg-[#D4B060] text-[#1A1A1A] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
            >
              Réserver Maintenant
            </a>
            <a
              href="tel:+221781319191"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#A73B3C] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-colors text-center"
            >
              📞 +221 78 131 91 91
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

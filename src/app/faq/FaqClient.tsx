"use client";

import { Navigation } from "@/components/navigation";
import { useState } from "react";
import { CaretDown, Phone, EnvelopeSimple } from "@phosphor-icons/react";

export default function FaqClient() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const faqCategories = [
    {
      title: "Réservation et Tarifs",
      questions: [
        {
          question: "Comment réserver un transfert ?",
          answer: "C'est très simple ! Rendez-vous sur notre page de réservation, remplissez le formulaire avec vos détails de vol et vos informations personnelles. Vous recevrez une confirmation par email avec les détails de votre chauffeur."
        },
        {
          question: "Quels sont vos tarifs ?",
          answer: "Nos tarifs varient selon la destination. Pour Dakar - AIBD ou AIBD - Dakar nos tarifs commencent à 25 000 Fcfa. Pour toute autre destination, contactez-nous pour un devis personnalisé."
        },
        {
          question: "Y a-t-il des frais cachés ?",
          answer: "Non, nos tarifs sont transparents. Le prix indiqué inclut le transport, l'assistance bagages et l'attente gratuite de 30 minutes. Seuls les péages et parkings peuvent s'ajouter selon l'itinéraire."
        },
        {
          question: "Puis-je annuler ma réservation ?",
          answer: "Oui, vous pouvez annuler jusqu'à 2 heures avant l'heure prévue sans frais. Pour les annulations de dernière minute, des frais peuvent s'appliquer."
        }
      ]
    },
    {
      title: "Services et Véhicules",
      questions: [
        {
          question: "Quels types de véhicules proposez-vous ?",
          answer: "Nous proposons une flotte moderne de véhicules : berlines, SUV et minibus climatisés. Tous nos véhicules sont parfaitement entretenus et équipés pour votre confort."
        },
        {
          question: "Vos chauffeurs sont-ils professionnels ?",
          answer: "Absolument ! Tous nos chauffeurs sont certifiés, expérimentés et connaissent parfaitement les routes du Sénégal."
        },
        {
          question: "Proposez-vous des services 24h/24 ?",
          answer: "Oui, nous sommes disponibles 24h/24, 7j/7 pour tous vos transferts aéroport et déplacements privés. Nos chauffeurs sont toujours prêts à vous servir."
        },
        {
          question: "Que se passe-t-il si mon vol est en retard ?",
          answer: "Pas de problème ! Nous surveillons les vols en temps réel. Votre chauffeur attendra gratuitement jusqu'à 1h après l'heure d'arrivée prévue. Au-delà, des frais d'attente peuvent s'appliquer."
        }
      ]
    },
    {
      title: "Aéroport AIBD Dakar",
      questions: [
        {
          question: "Comment me retrouver à l'aéroport ?",
          answer: "Votre chauffeur vous attendra dans le hall d'arrivées avec un panneau à votre nom. Il vous contactera également par téléphone si nécessaire. Nous vous enverrons ses coordonnées avant votre arrivée."
        },
        {
          question: "Combien de temps avant mon vol dois-je réserver ?",
          answer: "Nous recommandons de réserver au moins 24h à l'avance pour garantir la disponibilité. Cependant, nous acceptons les réservations de dernière minute selon nos disponibilités."
        },
        {
          question: "Puis-je réserver un aller-retour ?",
          answer: "Bien sûr ! Nous proposons des forfaits aller-retour avec des tarifs préférentiels. Contactez-nous pour connaître nos offres spéciales."
        },
        {
          question: "Que se passe-t-il si je rate mon vol ?",
          answer: "Si vous ratez votre vol, contactez-nous immédiatement. Nous adapterons votre réservation selon votre nouveau vol sans frais supplémentaires."
        }
      ]
    },
    {
      title: "Paiement et Facturation",
      questions: [
        {
          question: "Quels modes de paiement acceptez-vous ?",
          answer: "Nous acceptons les paiements en espèces (FCFA), par carte bancaire, virement bancaire et mobile money (Orange Money, Free Money). Le paiement s'effectue généralement à la fin du service."
        },
        {
          question: "Puis-je payer à l'avance ?",
          answer: "Oui, vous pouvez payer à l'avance par virement bancaire ou mobile money. Cela vous garantit votre réservation et peut vous faire bénéficier de tarifs préférentiels."
        },
        {
          question: "Émettez-vous des factures ?",
          answer: "Oui, nous émettons des factures professionnelles pour tous nos services. Elles sont parfaites pour vos justificatifs de déplacement d'affaires."
        }
      ]
    },
    {
      title: "Autres Services",
      questions: [
        {
          question: "Proposez-vous des services de mise à disposition ?",
          answer: "Oui ! Nous proposons des services de mise à disposition avec chauffeur pour des durées déterminées. Idéal pour les événements, visites touristiques ou déplacements d'affaires."
        },
        {
          question: "Organisez-vous des tours touristiques ?",
          answer: "Absolument ! Nos chauffeurs-guides vous feront découvrir Dakar et ses environs. Nous proposons des itinéraires personnalisés selon vos centres d'interest."
        },
        {
          question: "Puis-je réserver pour un groupe ?",
          answer: "Oui, nous avons des véhicules adaptés aux groupes (jusqu'à 8 personnes). Contactez-nous pour organiser le transport de votre équipe ou groupe d'amis."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation variant="solid" />

      {/* Hero Section */}
      <section className="relative bg-[#1A1A1A] text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 mt-16 sm:mt-20 overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E5C16C' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>

        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-[#E5C16C]">Questions</span> Fréquentes
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Trouvez rapidement les réponses à vos questions sur nos services de transport au Sénégal
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-6 sm:mb-8 text-center">
                <span className="text-[#A73B3C]">{category.title}</span>
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${faqIndex}`];
                  return (
                    <div key={faqIndex} className="bg-white dark:bg-[#252525] rounded-xl sm:rounded-2xl border-l-4 border-[#A73B3C] shadow-sm hover:shadow-md transition-shadow duration-200">
                      <button
                        onClick={() => toggleItem(categoryIndex, faqIndex)}
                        className="w-full text-left p-4 sm:p-5 md:p-6 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:ring-inset rounded-xl sm:rounded-2xl"
                      >
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A] dark:text-white flex-1 leading-snug">
                            {faq.question}
                          </h3>
                          <div className="shrink-0">
                            <CaretDown
                              className={`w-5 h-5 sm:w-6 sm:h-6 text-[#A73B3C] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                                }`}
                              weight="bold"
                            />
                          </div>
                        </div>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                          <div className="border-t border-[#E5C16C]/30 pt-3 sm:pt-4">
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 bg-[#A73B3C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-base sm:text-lg text-gray-100 mb-6 sm:mb-8 leading-relaxed">
            Notre équipe est là pour vous aider. Contactez-nous directement !
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-2xl mx-auto">
            <a
              href="tel:+221781319191"
              className="w-full sm:w-auto bg-[#E5C16C] hover:bg-[#D4B060] text-[#1A1A1A] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-colors text-center flex items-center justify-center gap-2"
            >
              <Phone weight="fill" /> +221 78 131 91 91
            </a>
            <a
              href="mailto:contact@navettexpress.com"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#A73B3C] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-colors text-center flex items-center justify-center gap-2"
            >
              <EnvelopeSimple weight="fill" /> Nous écrire
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

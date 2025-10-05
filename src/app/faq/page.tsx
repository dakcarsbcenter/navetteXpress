"use client";

import { Navigation } from "@/components/navigation";
import { useState } from "react";

export default function FAQPage() {
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
          answer: "Absolument ! Nos chauffeurs-guides vous feront découvrir Dakar et ses environs. Nous proposons des itinéraires personnalisés selon vos centres d'intérêt."
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
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-8 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Questions Fréquentes
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Trouvez rapidement les réponses à vos questions sur nos services de transport au Sénégal
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
                {category.title}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${faqIndex}`];
                  return (
                    <div key={faqIndex} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <button
                        onClick={() => toggleItem(categoryIndex, faqIndex)}
                        className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-2xl"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900 pr-4">
                            {faq.question}
                          </h3>
                          <div className="flex-shrink-0">
                            <svg
                              className={`w-6 h-6 text-slate-500 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-6">
                          <div className="border-t border-slate-200 pt-4">
                            <p className="text-slate-600 leading-relaxed">
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
      <section className="py-20 px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Notre équipe est là pour vous aider. Contactez-nous directement !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+221781319191"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              📞 +221 78 131 91 91
            </a>
            <a
              href="mailto:contact@navettexpress.sn"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              ✉️ Nous écrire
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

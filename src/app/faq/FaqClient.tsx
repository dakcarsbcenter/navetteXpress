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
    <div className="min-h-screen bg-midnight text-foreground selection:bg-gold/30">
      <Navigation variant="solid" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gold/5 blur-[120px] -z-10 rounded-full"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-serif text-5xl md:text-7xl mb-8 tracking-tight text-foreground">
            <span className="text-gold italic">Questions</span> Fréquentes
          </h1>
          <p className="font-sans text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Trouvez rapidement les réponses à vos questions sur nos services de transport au Sénégal
          </p>
        </motion.div>
      </section>

      {/* FAQ Content */}
      <section className="py-24 px-4 bg-transparent border-y border-border/10">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-20">
              <h2 className="font-serif text-3xl mb-12 text-center text-foreground">
                {category.title}
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${faqIndex}`];
                  return (
                    <div key={faqIndex} className="bg-surface-2/50 backdrop-blur-xl border border-border rounded-3xl overflow-hidden hover:border-gold/30 transition-all duration-500 mb-6">
                      <button
                        onClick={() => toggleItem(categoryIndex, faqIndex)}
                        className="w-full text-left p-8 focus:outline-none group"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <h3 className="font-serif text-xl text-foreground group-hover:text-gold transition-colors duration-300">
                            {faq.question}
                          </h3>
                          <div className="shrink-0 w-10 h-10 rounded-full bg-midnight/50 border border-border flex items-center justify-center group-hover:border-gold transition-colors">
                            <CaretDown
                              className={`w-5 h-5 text-gold transition-transform duration-500 ${isOpen ? 'rotate-180' : ''
                                }`}
                              weight="regular"
                            />
                          </div>
                        </div>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="px-8 pb-8">
                          <div className="pt-6 border-t border-border">
                            <p className="font-sans text-foreground/60 leading-relaxed">
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
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gold/5 blur-[150px] -z-10"></div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-6xl mb-12 leading-tight text-foreground">
            Vous ne trouvez pas <br />
            <span className="text-gold italic">votre réponse ?</span>
          </h2>
          <p className="font-sans text-xl text-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Notre équipe est là pour vous aider. Contactez-nous directement !
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="tel:+221781319191"
              className="px-10 py-5 bg-gold text-[#1A1A1A] font-bold tracking-widest uppercase rounded-full hover:scale-105 transition-all text-sm flex items-center justify-center gap-3"
            >
              <Phone weight="fill" /> +221 78 131 91 91
            </a>
            <a
              href="mailto:contact@navettexpress.com"
              className="px-10 py-5 border border-border text-foreground font-bold tracking-widest uppercase rounded-full hover:bg-surface-2/50 transition-all text-sm flex items-center justify-center gap-3"
            >
              <EnvelopeSimple weight="fill" /> Nous écrire
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

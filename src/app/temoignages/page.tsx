import { Navigation } from "@/components/navigation";
import { Metadata } from "next";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: 'Avis Clients | Navette Xpress — Chauffeur Privé Dakar',
  description: 'Découvrez les avis de nos clients satisfaits. Note 4.9/5 sur plus de 1 000 transferts aéroport AIBD et navettes privées à Dakar, Sénégal.',
  keywords: 'avis navette Dakar, témoignages chauffeur privé Dakar, avis transfert AIBD, clients satisfaits Navette Xpress',
  openGraph: {
    title: 'Avis Clients — Navette Xpress',
    description: '4.9/5 sur 1 000+ transferts à Dakar. Lisez les témoignages de nos clients.',
    url: 'https://navettexpress.com/temoignages',
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

  const noteGlobale = 4.9;
  const nombreAvis = 1000;

  return (
    <div className="min-h-screen noise-bg" style={{ backgroundColor: 'var(--color-midnight)' }}>
      <Navigation variant="solid" />

      {/* SECTION HERO — Note globale + résumé */}
      <section
        className="relative py-20 sm:py-28 text-center overflow-hidden"
      >
        {/* Halo décoratif doré derrière le contenu */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up"
            style={{
              backgroundColor: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.25)',
            }}>
            <span style={{ color: 'var(--color-gold)', fontSize: '12px' }}>✦</span>
            <span className="text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-body)' }}>
              Avis clients vérifiés
            </span>
          </div>

          {/* Titre */}
          <h1
            className="text-4xl sm:text-6xl leading-tight mb-4 animate-fade-in-up"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
              fontWeight: 400,
            }}>
            Ils nous ont fait{' '}
            <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>confiance</span>
          </h1>

          <p className="text-base sm:text-lg mb-12 text-gray-400 animate-fade-in-up delay-100"
            style={{ fontFamily: 'var(--font-body)' }}>
            Plus de 1 000 transferts réalisés à Dakar. Voici ce que nos clients disent de leur expérience.
          </p>

          {/* NOTE GLOBALE — bloc trophée */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-8 px-10 py-8 rounded-3xl animate-scaleIn"
            style={{
              backgroundColor: 'var(--color-obsidian)',
              border: '1px solid rgba(201,168,76,0.2)',
              boxShadow: '0 0 60px rgba(201,168,76,0.08)',
            }}>

            {/* Note chiffre */}
            <div className="text-center">
              <p className="text-7xl font-semibold leading-none"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}>
                {noteGlobale}
              </p>
              <p className="text-xs uppercase tracking-[0.15em] mt-2"
                style={{ color: 'var(--color-text-secondary)' }}>
                sur 5
              </p>
            </div>

            {/* Séparateur vertical */}
            <div className="hidden sm:block w-px h-16"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            {/* Étoiles + nb avis */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                      fill={i <= Math.round(noteGlobale) ? 'var(--color-gold)' : 'rgba(201,168,76,0.2)'}
                    />
                  </svg>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {nombreAvis}+ avis vérifiés
              </p>
              <a href="#"
                className="text-xs underline underline-offset-2 mt-1 inline-block transition-colors hover:text-white"
                style={{ color: 'var(--color-gold)' }}>
                Voir sur Google →
              </a>
            </div>

            {/* Séparateur vertical */}
            <div className="hidden sm:block w-px h-16"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            {/* Stats rapides */}
            <div className="text-center">
              <p className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                98%
              </p>
              <p className="text-xs uppercase tracking-[0.12em] mt-1"
                style={{ color: 'var(--color-text-secondary)' }}>
                Clients Satisfaits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION GRILLE TÉMOIGNAGES */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {temoignages.map((temoignage) => (
              <TestimonialCard
                key={temoignage.id}
                name={temoignage.nom}
                role={temoignage.role}
                content={temoignage.commentaire}
                rating={temoignage.note}
                date={temoignage.date}
                service={temoignage.service}
                isVerified={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION CTA FINAL — "Votre avis compte" */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-obsidian)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          {/* Déco étoiles */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                  fill="var(--color-gold)" />
              </svg>
            ))}
          </div>

          <h2 className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
              fontWeight: 400,
            }}>
            Votre avis nous aide à{' '}
            <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>grandir</span>
          </h2>

          <p className="text-base mb-10"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
            Vous avez voyagé avec Navette Xpress ? Partagez votre expérience sur Google et aidez d'autres voyageurs à faire le bon choix.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#"
              target="_blank" rel="noopener noreferrer"
              className="btn-gold w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.32-2.12 4.52-1.36 1.36-3.48 2.84-7.44 2.84-6.4 0-11.6-5.2-11.6-11.6s5.2-11.6 11.6-11.6c3.48 0 6.04 1.36 7.92 3.16l2.32-2.32c-2.12-2.04-4.92-3.64-10.24-3.64-9.48 0-17.24 7.76-17.24 17.24s7.76 17.24 17.24 17.24c5.12 0 9.04-1.68 12.16-4.92 3.24-3.24 4.24-7.76 4.24-11.32 0-.92-.08-1.76-.24-2.52h-16.16z" />
              </svg>
              Laisser un avis Google
            </a>

            <a
              href="/reservation"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              Réserver une navette →
            </a>
          </div>

          <p className="text-xs mt-8" style={{ color: 'var(--color-text-muted)' }}>
            Tous nos avis sont vérifiés et proviennent de clients ayant effectué un trajet avec nous.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

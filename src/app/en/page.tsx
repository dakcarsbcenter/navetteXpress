// src/app/en/page.tsx
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Private Chauffeur Dakar & AIBD Airport Transfer | Navette Xpress',
    description:
        'Navette Xpress is the #1 private chauffeur service in Dakar. AIBD airport transfer 24/7, urban shuttle, day-hire. Instant online booking. Fixed guaranteed prices.',
    alternates: {
        canonical: 'https://navettexpress.com/en',
        languages: {
            'fr-FR': 'https://navettexpress.com',
            'en-US': 'https://navettexpress.com/en',
        },
    },
};

const waypoints = [
    { label: "Dakar", dot: "bg-accent" },
    { label: "AIBD", dot: "bg-foreground", distance: "47 KM" },
    { label: "Mbour", dot: "bg-foreground", distance: "79 KM" },
    { label: "Petite Côte", dot: "bg-gold", distance: "92 KM" },
];

export default function EnglishHomePage() {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navigation variant="transparent" />

            <main className="pt-28 md:pt-36">
                {/* Corridor strip */}
                <div className="border-b border-[#e2dacd]">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center overflow-x-auto">
                        {waypoints.map((wp, i) => (
                            <div key={wp.label} className="flex items-center flex-1 last:flex-none">
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`w-2 h-2 rounded-full ${wp.dot}`} />
                                    <span className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.14em] uppercase text-foreground">
                                        {wp.label}
                                    </span>
                                    {wp.distance && (
                                        <span className="hidden sm:inline font-[family-name:var(--font-ibm-plex-mono)] text-[11px] text-text-muted">
                                            {wp.distance}
                                        </span>
                                    )}
                                </div>
                                {i < waypoints.length - 1 && (
                                    <span className="flex-1 h-[1.5px] bg-foreground mx-3 min-w-6" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <section className="px-6 py-16 md:py-24 max-w-4xl mx-auto text-center">
                    <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs tracking-[0.16em] uppercase text-accent mb-6">
                        Corridor Dakar — AIBD — Petite Côte
                    </p>
                    <h1 className="text-4xl md:text-6xl font-semibold text-foreground tracking-tight leading-[1.1] mb-6">
                        One route. Handled <span className="text-gold">end to end</span>.
                    </h1>
                    <p className="text-lg text-[#3d3a35] mb-10 max-w-2xl mx-auto leading-relaxed">
                        Experience premium AIBD airport transfers and dependable private chauffeur service across Dakar and the Petite Côte, with transparent per-segment pricing.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/reservation" className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-4 rounded transition-colors">
                            Book Now
                        </Link>
                        <Link href="/services" className="border border-foreground text-foreground font-semibold px-8 py-4 rounded hover:bg-foreground hover:text-background transition-colors">
                            Our Services
                        </Link>
                    </div>

                    <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 text-left border-t border-[#e2dacd] pt-12">
                        <div>
                            <h3 className="text-foreground font-semibold text-xl mb-3">Airport Transfer</h3>
                            <p className="text-text-muted leading-relaxed">Personalized meet &amp; greet at AIBD airport with a name sign. Real-time flight tracking.</p>
                        </div>
                        <div>
                            <h3 className="text-foreground font-semibold text-xl mb-3">Private Driver</h3>
                            <p className="text-text-muted leading-relaxed">Full-day or half-day disposal for business meetings or sightseeing tours.</p>
                        </div>
                        <div>
                            <h3 className="text-foreground font-semibold text-xl mb-3">Fixed Rates</h3>
                            <p className="text-text-muted leading-relaxed">Transparent pricing set in advance, toll and fuel included. No hidden costs or surge pricing.</p>
                        </div>
                    </section>
                </section>
            </main>

            <Footer />
        </div>
    );
}

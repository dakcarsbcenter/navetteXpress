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

export default function EnglishHomePage() {
    return (
        <div className="min-h-screen bg-midnight text-white selection:bg-gold/30">
            <Navigation variant="transparent" />

            <main className="pt-40 pb-20 px-6 max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-7xl font-display mb-8">
                    The Art of <span className="text-gold italic">Private Mobility</span> in Dakar
                </h1>
                <p className="text-xl text-text-secondary mb-12">
                    Experience premium AIBD airport transfers and high-end private chauffeur services in Senegal.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link href="/reservation" className="bg-gold text-midnight font-bold px-10 py-5 rounded-xl hover:scale-105 transition-all">
                        Book Now
                    </Link>
                    <Link href="/services" className="border border-white/20 text-white font-bold px-10 py-5 rounded-xl hover:bg-white/5 transition-all">
                        Our Services
                    </Link>
                </div>

                <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                    <div>
                        <h3 className="text-gold font-display text-2xl mb-4">Airport Transfer</h3>
                        <p className="text-text-secondary">Personalized meet & greet at AIBD airport with a name sign. Real-time flight tracking.</p>
                    </div>
                    <div>
                        <h3 className="text-gold font-display text-2xl mb-4">Private Driver</h3>
                        <p className="text-text-secondary">Full-day or half-day disposal for business meetings or sightseeing tours.</p>
                    </div>
                    <div>
                        <h3 className="text-gold font-display text-2xl mb-4">Fixed Rates</h3>
                        <p className="text-text-secondary">Transparent pricing set in advance. No hidden costs or surge pricing.</p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

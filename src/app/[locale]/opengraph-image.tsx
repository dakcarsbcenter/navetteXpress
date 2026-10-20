// Image de partage par defaut du site (WhatsApp, Facebook, LinkedIn, X).
// Fichier conventionnel Next : injectee dans og:image / twitter:image de toutes
// les pages sous /[locale] qui ne declarent pas leurs propres images (la page
// partenaire a la sienne, plus proche, qui l'emporte). Les anciens fichiers
// /og/og-home|routes|services|zones.jpg n'ont jamais existe : 404 sur chaque
// partage.
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Navette Xpress — Chauffeur privé Dakar & transfert aéroport AIBD';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// Satori ne resout pas les variables CSS : tokens de la charte repris en clair
// (memes valeurs que devenir-partenaire/opengraph-image.tsx).
const CREAM = '#F7F3EC';
const INK = '#12100E';
const LAGUNE = '#1F5245';
const TERRE = '#B4643A';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home.meta' });

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: CREAM,
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', padding: '72px 80px 0', gap: 28 }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 22,
                            letterSpacing: 6,
                            color: LAGUNE,
                            textTransform: 'uppercase',
                        }}
                    >
                        Navette Xpress
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 74,
                            lineHeight: 1.1,
                            fontWeight: 700,
                            color: INK,
                            maxWidth: 980,
                        }}
                    >
                        {t('ogTitle')}
                    </div>
                    <div style={{ display: 'flex', fontSize: 30, color: TERRE, letterSpacing: 1 }}>
                        AIBD · Dakar · Saly · Mbour · Saint-Louis
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 44,
                        backgroundColor: LAGUNE,
                        color: CREAM,
                        padding: '34px 80px',
                        fontSize: 27,
                        letterSpacing: 3,
                        textTransform: 'uppercase',
                    }}
                >
                    <span>navettexpress.com</span>
                    <span>·</span>
                    <span>24/7</span>
                </div>
            </div>
        ),
        size
    );
}

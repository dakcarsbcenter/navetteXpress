// Image de partage de la page de recrutement (WhatsApp, Facebook, LinkedIn).
// Fichier conventionnel Next : l'image est injectee automatiquement dans les
// metadonnees Open Graph et Twitter de /devenir-partenaire, ce qui evite un
// fichier binaire a maintenir dans public/og.
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Navette Xpress — Devenir chauffeur partenaire';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// Satori (moteur de next/og) ne resout pas les variables CSS : les tokens de la
// charte sont repris ici en clair, et nulle part ailleurs.
//   #F7F3EC --background · #12100E --foreground · #1F5245 --color-accent
//   #B4643A --gold        · #E2DACD bordure de la page partenaire
const CREAM = '#F7F3EC';
const INK = '#12100E';
const LAGUNE = '#1F5245';
const TERRE = '#B4643A';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'devenir-partenaire' });

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
                    // Police par defaut de satori : Archivo/IBM Plex Mono ne sont pas
                    // embarquees ici pour ne pas dependre d'un fetch de fonte au build.
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
                            fontSize: 70,
                            lineHeight: 1.1,
                            fontWeight: 700,
                            color: INK,
                            maxWidth: 940,
                        }}
                    >
                        {t('meta.ogTitle')}
                    </div>
                    <div style={{ display: 'flex', fontSize: 30, color: TERRE, letterSpacing: 1 }}>
                        {t('hero.eyebrow')}
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
                    <span>Commission 15 %</span>
                    <span>·</span>
                    <span>Paiement immédiat</span>
                    <span>·</span>
                    <span>0 frais</span>
                </div>
            </div>
        ),
        size
    );
}

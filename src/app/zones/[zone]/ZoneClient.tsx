"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { schemaBreadcrumb } from "@/lib/schema";
import Link from "next/link";
import { MapPin, ShieldCheck, Clock } from "@phosphor-icons/react";
import Image from "next/image";
import { Link as ScrollLink } from "react-scroll";

export default function ZoneClient({ t, breadcrumbs }: { t: any, breadcrumbs: any }) {
    return (
        <div className="min-h-screen bg-midnight font-body selection:bg-gold/30 selection:text-white">
            <Navigation variant="transparent" />
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />

            <main className="relative pt-40 pb-32">
                {/* Background Decorative Halos */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-crimson/5 rounded-full blur-[150px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

                <div className="max-w-4xl mx-auto px-6">
                    {/* Breadcrumb Visual */}
                    <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-8">
                        <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
                        <span className="text-white/20">/</span>
                        <span className="text-gold">Zones</span>
                        <span className="text-white/20">/</span>
                        <span className="text-white">{t.name}</span>
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl text-white font-display leading-[1.1] mb-8">
                            Chauffeur Privé <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-gold via-white to-gold bg-[length:200%_auto] animate-shimmer italic">
                                {t.name}
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-16 font-light">
                            {t.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                            {/* Content Side */}
                            <div className="space-y-12">
                                <article
                                    className="prose prose-invert prose-gold max-w-none 
                    prose-h3:font-display prose-h3:text-3xl prose-h3:text-white prose-h3:mb-6
                    prose-p:text-text-secondary prose-p:leading-relaxed prose-p:mb-6
                    prose-ul:text-text-secondary prose-ul:space-y-4 prose-li:marker:text-gold
                    prose-strong:text-gold prose-strong:font-bold"
                                    dangerouslySetInnerHTML={{ __html: t.content }}
                                />
                            </div>

                            {/* Action Side */}
                            <div className="sticky top-32 space-y-8">
                                <div className="p-8 rounded-[2.5rem] bg-obsidian/50 border border-white/10 backdrop-blur-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-1000"></div>

                                    <h2 className="text-2xl text-white font-display mb-6">Réserver à {t.name}</h2>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                                <Clock className="text-gold" size={16} weight="light" />
                                            </div>
                                            <span>Confirmation en 30 minutes</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="text-gold" size={16} weight="light" />
                                            </div>
                                            <span>Prix fixe garanti</span>
                                        </div>
                                    </div>

                                    <Link
                                        href="/reservation"
                                        className="flex items-center justify-center gap-3 w-full py-5 bg-gold text-midnight font-bold rounded-2xl shadow-[0_10px_40px_rgba(201,168,76,0.2)] hover:scale-[1.02] transition-all"
                                    >
                                        <span>Réserver Maintenant</span>
                                        <MapPin size={20} weight="regular" />
                                    </Link>
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="relative w-8 h-8 rounded-full border-2 border-midnight bg-obsidian overflow-hidden">
                                                    <Image
                                                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                                        alt="Avis client Navette Xpress"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-text-muted">
                                            <span className="text-white font-bold">4.9/5</span> sur +100 trajets à {t.name}
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted italic">"Service impeccable pour mes rdv business au Plateau. Chauffeur très pro."</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

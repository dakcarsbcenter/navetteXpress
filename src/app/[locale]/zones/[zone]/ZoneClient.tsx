"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { schemaBreadcrumb } from "@/lib/schema";
import { Link } from "@/i18n/navigation";
import { MapPin, ShieldCheck, Clock } from "@phosphor-icons/react";
import Image from "next/image";

interface ZoneData {
    id: string;
    name: string;
    description: string;
    content: string;
}

interface Breadcrumb {
    name: string;
    item: string;
}

export default function ZoneClient({ zone, breadcrumbs }: { zone: ZoneData; breadcrumbs: Breadcrumb[] }) {
    const t = useTranslations("zones");

    return (
        <div className="min-h-screen bg-background">
            <Navigation variant="solid" />
            <JsonLd data={schemaBreadcrumb(breadcrumbs)} />

            <div className="pt-24 md:pt-36">
                <CorridorStrip />

                <main className="py-12 md:py-16">
                    <div className="max-w-4xl mx-auto px-6">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-8">
                            <Link href="/" className="hover:text-accent transition-colors">{t("breadcrumbs.home")}</Link>
                            <span className="text-text-muted/40">/</span>
                            <span className="text-accent">{t("breadcrumbs.zones")}</span>
                            <span className="text-text-muted/40">/</span>
                            <span className="text-foreground">{zone.name}</span>
                        </nav>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl text-foreground font-bold leading-[1.08] tracking-tight mb-6">
                                {t("hero.titlePrefix")} <br />
                                <span className="text-accent">{zone.name}</span>
                            </h1>

                            <p className="text-lg md:text-xl text-[#3d3a35] leading-relaxed mb-12 max-w-2xl">
                                {zone.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                                {/* Content Side */}
                                <div
                                    className="[&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mb-4 [&_h3]:mt-8 [&_h3]:first:mt-0
                    [&_p]:text-[#3d3a35] [&_p]:leading-relaxed [&_p]:mb-5
                    [&_ul]:text-[#3d3a35] [&_ul]:space-y-3 [&_ul]:mb-5 [&_li]:pl-1 [&_li]:marker:text-accent
                    [&_strong]:text-foreground [&_strong]:font-semibold"
                                    dangerouslySetInnerHTML={{ __html: zone.content }}
                                />

                                {/* Action Side */}
                                <div className="sticky top-32 space-y-6">
                                    <div className="p-8 rounded-lg bg-white border border-[#e2dacd]">
                                        <h2 className="text-xl font-bold text-foreground mb-6">{t("sidebar.reserveAt", { name: zone.name })}</h2>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-4 text-sm text-[#3d3a35]">
                                                <div className="w-8 h-8 rounded bg-background border border-[#e2dacd] flex items-center justify-center shrink-0">
                                                    <Clock className="text-accent" size={16} weight="light" />
                                                </div>
                                                <span>{t("sidebar.confirmation")}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-[#3d3a35]">
                                                <div className="w-8 h-8 rounded bg-background border border-[#e2dacd] flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="text-accent" size={16} weight="light" />
                                                </div>
                                                <span>{t("sidebar.fixedPrice")}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/reservation"
                                            className="flex items-center justify-center gap-3 w-full py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded transition-colors"
                                        >
                                            <span>{t("sidebar.reserveNow")}</span>
                                            <MapPin size={18} weight="regular" />
                                        </Link>
                                    </div>

                                    <div className="p-8 rounded-lg bg-white border border-[#e2dacd]">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="relative w-8 h-8 rounded-full border-2 border-white bg-background overflow-hidden">
                                                        <Image
                                                            src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                                            alt={t("sidebar.reviewAlt")}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                                <span className="text-foreground font-bold">4.9/5</span> {t("sidebar.ratingSuffix", { name: zone.name })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-text-muted italic">{t("sidebar.testimonial")}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

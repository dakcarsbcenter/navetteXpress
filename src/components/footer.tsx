"use client";

import Link from "next/link";
import { Phone, EnvelopeSimple, MapPin, InstagramLogo, FacebookLogo, LinkedinLogo } from "@phosphor-icons/react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    const services = [
        { label: "Transfert Aéroport AIBD", href: "/services" },
        { label: "Navette Urbaine Dakar", href: "/services" },
        { label: "Mise à Disposition", href: "/services" },
        { label: "Événements & VIP", href: "/services" },
    ];

    const zones = [
        "Dakar Plateau", "Almadies", "Ngor", "Mermoz", "Saly", "Mbour", "Saint-Louis"
    ];

    const socialLinks = [
        { icon: <FacebookLogo size={18} weight="regular" />, href: "https://facebook.com/navettexpresssenegal", label: "Facebook" },
        { icon: <InstagramLogo size={18} weight="regular" />, href: "https://instagram.com/navettexpresssenegal", label: "Instagram" },
        { icon: <LinkedinLogo size={18} weight="regular" />, href: "https://linkedin.com/company/navettexpresssenegal", label: "LinkedIn" },
    ];

    return (
        <footer className="bg-midnight pt-20 pb-10 border-t border-border font-body">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                                <span className="text-midnight font-bold text-xl">NX</span>
                            </div>
                            <span className="text-foreground font-display text-2xl tracking-wide">NAVETTE XPRESS</span>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                            L'excellence de la mobility privée au Sénégal. Service premium de transfert aéroport, navette urbaine et mise à disposition.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-text-secondary hover:text-gold hover:border-gold transition-all"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Services Column */}
                    <div>
                        <h3 className="text-white font-display text-lg mb-6 tracking-wide">Nos Services</h3>
                        <ul className="space-y-4">
                            {services.map((service, i) => (
                                <li key={i}>
                                    <Link href={service.href} className="text-text-secondary hover:text-gold text-sm transition-colors">
                                        {service.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Zones SEO Column */}
                    <div>
                        <h3 className="text-white font-display text-lg mb-6 tracking-wide">Zones Desservies</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { name: "Dakar Plateau", slug: "plateau" },
                                { name: "Almadies", slug: "almadies" },
                                { name: "Ngor", slug: "ngor" },
                                { name: "Mermoz", slug: "sacre-coeur" },
                                { name: "Sacré-Cœur", slug: "sacre-coeur" },
                                { name: "Yoff", slug: "yoff" }
                            ].map((zone, i) => (
                                <Link
                                    key={i}
                                    href={`/zones/${zone.slug}`}
                                    className="text-text-secondary text-sm hover:text-gold transition-colors"
                                >
                                    {zone.name}{i < 5 ? " • " : ""}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-8">
                            <h3 className="text-white font-display text-sm mb-4 tracking-wide uppercase">Support 24/7</h3>
                            <a href="https://wa.me/221781319191" className="text-gold font-bold text-lg hover:underline transition-all">
                                +221 78 131 91 91
                            </a>
                        </div>
                    </div>

                    {/* Newsletter/Contact Column */}
                    <div>
                        <h3 className="text-white font-display text-lg mb-6 tracking-wide">Contact</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-text-secondary text-sm">
                                <MapPin size={16} weight="light" className="text-gold" />
                                <span>Dakar, Sénégal</span>
                            </li>
                            <li className="flex items-center gap-3 text-text-secondary text-sm">
                                <Phone size={16} weight="light" className="text-gold" />
                                <span>+221 78 131 91 91</span>
                            </li>
                            <li className="flex items-center gap-3 text-text-secondary text-sm">
                                <EnvelopeSimple size={16} weight="light" className="text-gold" />
                                <span>contact@navettexpress.com</span>
                            </li>
                        </ul>
                        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                            <p className="text-xs text-text-secondary mb-2 uppercase tracking-tighter">Paiements Acceptés</p>
                            <div className="flex gap-3 opacity-60">
                                <span className="text-white text-[10px] font-bold">Wave</span>
                                <span className="text-white text-[10px] font-bold">Orange Money</span>
                                <span className="text-white text-[10px] font-bold">Transfert</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
                    <p>© {currentYear} Navette Xpress Sénégal. Tous droits réservés.</p>
                    <div className="flex gap-6">
                        <Link href="/cgv" className="hover:text-gold transition-colors">CGV</Link>
                        <Link href="/mentions-legales" className="hover:text-gold transition-colors">Mentions Légales</Link>
                        <Link href="/confidentialite" className="hover:text-gold transition-colors">Confidentialité</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

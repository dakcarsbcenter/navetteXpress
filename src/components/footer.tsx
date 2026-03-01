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

    const socialLinks = [
        { icon: <FacebookLogo size={18} weight="regular" />, href: "https://facebook.com/navettexpresssenegal", label: "Facebook" },
        { icon: <InstagramLogo size={18} weight="regular" />, href: "https://instagram.com/navettexpresssenegal", label: "Instagram" },
        { icon: <LinkedinLogo size={18} weight="regular" />, href: "https://linkedin.com/company/navettexpresssenegal", label: "LinkedIn" },
    ];

    return (
        <footer className="bg-surface-1 pt-20 pb-10 border-t border-border font-sans">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12 shrink-0">
                                <span className="text-background font-bold text-xl">NX</span>
                            </div>
                            <span className="text-foreground font-display text-2xl tracking-wide">NAVETTE XPRESS</span>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                            L&apos;excellence de la mobilité privée au Sénégal. Service premium de transfert aéroport, navette urbaine et mise à disposition.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-gold hover:border-gold transition-all"
                                    aria-label={social.label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Services Column */}
                    <div>
                        <h3 className="text-foreground font-display text-lg mb-6 tracking-wide">Nos Services</h3>
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
                        <h3 className="text-foreground font-display text-lg mb-6 tracking-wide">Zones Desservies</h3>
                        <div className="flex flex-wrap gap-x-1 gap-y-2">
                            {[
                                { name: "Dakar Plateau", slug: "plateau" },
                                { name: "Almadies", slug: "almadies" },
                                { name: "Ngor", slug: "ngor" },
                                { name: "Mermoz", slug: "mermoz" },
                                { name: "Sacré-Cœur", slug: "sacre-coeur" },
                                { name: "Yoff", slug: "yoff" },
                            ].map((zone, i, arr) => (
                                <span key={i} className="text-text-secondary text-sm">
                                    <Link
                                        href={`/zones/${zone.slug}`}
                                        className="hover:text-gold transition-colors"
                                    >
                                        {zone.name}
                                    </Link>
                                    {i < arr.length - 1 && <span className="text-border mx-1">•</span>}
                                </span>
                            ))}
                        </div>
                        <div className="mt-8">
                            <h3 className="text-foreground font-display text-sm mb-4 tracking-wide uppercase">Support 24/7</h3>
                            <a href="https://wa.me/221781319191" className="text-gold font-bold text-lg hover:underline transition-all">
                                +221 78 131 91 91
                            </a>
                        </div>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h3 className="text-foreground font-display text-lg mb-6 tracking-wide">Contact</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-text-secondary text-sm">
                                <MapPin size={16} weight="light" className="text-gold shrink-0" />
                                <span>Dakar, Sénégal</span>
                            </li>
                            <li className="flex items-center gap-3 text-text-secondary text-sm">
                                <Phone size={16} weight="light" className="text-gold shrink-0" />
                                <span>+221 78 131 91 91</span>
                            </li>
                            <li className="flex items-center gap-3 text-text-secondary text-sm">
                                <EnvelopeSimple size={16} weight="light" className="text-gold shrink-0" />
                                <span>contact@navettexpress.com</span>
                            </li>
                        </ul>

                        {/* Payment methods */}
                        <div className="mt-8 p-4 rounded-xl bg-surface-2/80 border border-border">
                            <p className="text-xs text-text-muted mb-3 uppercase tracking-widest font-medium">Paiements Acceptés</p>
                            <div className="flex flex-wrap gap-2">
                                {["Wave", "Orange Money", "Virement"].map((method) => (
                                    <span
                                        key={method}
                                        className="px-2 py-1 rounded-md bg-background border border-border text-foreground text-[10px] font-bold tracking-wide"
                                    >
                                        {method}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
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

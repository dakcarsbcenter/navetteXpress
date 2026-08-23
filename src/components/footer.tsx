"use client";

import Link from "next/link";
import { Phone, MapPin, InstagramLogo, FacebookLogo, LinkedinLogo } from "@phosphor-icons/react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    const services = [
        { label: "Transfert Aéroport AIBD", href: "/services" },
        { label: "Navette Urbaine Dakar", href: "/services" },
        { label: "Mise à Disposition", href: "/services" },
        { label: "Événements & VIP", href: "/services" },
    ];

    const societe = [
        { label: "Hôtels & entreprises", href: "/entreprises" },
        { label: "Diaspora", href: "/diaspora" },
        { label: "Devenir partenaire", href: "/devenir-partenaire" },
        { label: "Avis clients", href: "/temoignages" },
    ];

    const socialLinks = [
        { icon: <FacebookLogo size={16} weight="regular" />, href: "https://facebook.com/navettexpresssenegal", label: "Facebook" },
        { icon: <InstagramLogo size={16} weight="regular" />, href: "https://instagram.com/navettexpresssenegal", label: "Instagram" },
        { icon: <LinkedinLogo size={16} weight="regular" />, href: "https://linkedin.com/company/navettexpresssenegal", label: "LinkedIn" },
    ];

    return (
        <footer className="bg-foreground pt-16 pb-8 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-14">

                    {/* Brand + Contact Column */}
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-background rounded flex items-center justify-center shrink-0">
                                <span className="text-foreground font-bold text-base font-[family-name:var(--font-archivo)]">NX</span>
                            </div>
                            <span className="text-background font-semibold text-lg tracking-tight">Navette Xpress</span>
                        </Link>

                        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs leading-[1.7] tracking-[0.02em] text-[#6b645c] uppercase max-w-xs">
                            Dakar, Sénégal<br />
                            +221 78 465 13 02<br />
                            contact@navettexpress.com
                        </p>

                        <div className="flex gap-3 pt-1">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-9 h-9 rounded border border-[#2e2b27] flex items-center justify-center text-[#9a938a] hover:text-gold hover:border-gold transition-colors"
                                    aria-label={social.label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Trajets Column */}
                    <div>
                        <h3 className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.14em] uppercase text-[#6b645c] mb-4">
                            Trajets
                        </h3>
                        <ul className="space-y-3">
                            {services.map((service, i) => (
                                <li key={i}>
                                    <Link href={service.href} className="text-[#9a938a] hover:text-gold text-sm transition-colors">
                                        {service.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Société Column */}
                    <div>
                        <h3 className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.14em] uppercase text-[#6b645c] mb-4">
                            Société
                        </h3>
                        <ul className="space-y-3">
                            {societe.map((item, i) => (
                                <li key={i}>
                                    <Link href={item.href} className="text-[#9a938a] hover:text-gold text-sm transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/cgv" className="text-[#9a938a] hover:text-gold text-sm transition-colors">
                                    Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Langue Column */}
                    <div>
                        <h3 className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.14em] uppercase text-[#6b645c] mb-4">
                            Langue
                        </h3>
                        <ul className="space-y-3">
                            <li className="text-background text-sm">Français</li>
                            <li>
                                <Link href="/en" className="text-[#9a938a] hover:text-gold text-sm transition-colors">
                                    English
                                </Link>
                            </li>
                        </ul>

                        <div className="mt-8">
                            <h3 className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.14em] uppercase text-[#6b645c] mb-3">
                                Support 24/7
                            </h3>
                            <a href="https://wa.me/221784651302" className="flex items-center gap-2 text-gold text-sm font-semibold hover:underline">
                                <Phone size={14} weight="fill" />
                                +221 78 465 13 02
                            </a>
                        </div>
                    </div>
                </div>

                {/* Zones + Contact strip */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-t border-[#2e2b27]">
                    <div className="flex flex-wrap gap-x-1 gap-y-2">
                        {[
                            { name: "Dakar Plateau", slug: "plateau" },
                            { name: "Almadies", slug: "almadies" },
                            { name: "Ngor", slug: "ngor" },
                            { name: "Mermoz", slug: "mermoz" },
                            { name: "Sacré-Cœur", slug: "sacre-coeur" },
                            { name: "Yoff", slug: "yoff" },
                        ].map((zone, i, arr) => (
                            <span key={i} className="text-[#6b645c] text-xs">
                                <Link href={`/zones/${zone.slug}`} className="hover:text-gold transition-colors">
                                    {zone.name}
                                </Link>
                                {i < arr.length - 1 && <span className="text-[#2e2b27] mx-1.5">·</span>}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {["Wave", "Orange Money", "Virement"].map((method) => (
                            <span
                                key={method}
                                className="px-2 py-1 rounded border border-[#2e2b27] text-[#9a938a] text-[10px] font-semibold tracking-[0.06em] uppercase"
                            >
                                {method}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-6 border-t border-[#2e2b27] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6b645c]">
                    <p className="flex items-center gap-2">
                        <MapPin size={12} weight="light" />
                        © {currentYear} Navette Xpress Sénégal. Tous droits réservés.
                    </p>
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

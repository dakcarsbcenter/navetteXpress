"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Phone, EnvelopeSimple, List, X, CaretDown, UserCircle, SignOut, SquaresFour } from "@phosphor-icons/react";
import { trackPhoneCall, trackEmailClick } from "@/lib/analytics";

interface NavigationProps {
  variant?: "transparent" | "solid";
}

export function Navigation({ variant = "solid" }: NavigationProps) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/services", label: "Services" },
    { href: "/flotte", label: "Flotte" },
    { href: "/temoignages", label: "Avis" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClasses = variant === "transparent"
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
      ? "bg-midnight/80 backdrop-blur-xl border-b border-white/5 py-2"
      : "bg-transparent py-4"
    }`
    : "fixed top-0 left-0 right-0 z-50 bg-midnight border-b border-white/5 py-2";

  return (
    <>
      {/* Top Bar - Midnight */}
      <div className="bg-midnight border-b border-white/5 text-[10px] sm:text-xs py-1.5 fixed top-0 left-0 right-0 z-[60] hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white/50">
          <div className="flex items-center gap-6">
            <a
              href="tel:+221781319191"
              className="flex items-center gap-1.5 hover:text-gold transition-colors"
              onClick={() => trackPhoneCall('header')}
            >
              <Phone size={12} weight="light" className="text-gold" />
              <span>+221 78 131 91 91</span>
            </a>
            <a
              href="mailto:contact@navettexpress.com"
              className="flex items-center gap-1.5 hover:text-gold transition-colors"
              onClick={() => trackEmailClick('header')}
            >
              <EnvelopeSimple size={12} weight="light" className="text-gold" />
              <span>contact@navettexpress.com</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Service 24h/24
            </span>
            <div className="h-3 w-px bg-white/10"></div>
            <Link href="/devenir-partenaire" className="hover:text-gold transition-colors">
              Devenir Partenaire
            </Link>
          </div>
        </div>
      </div>

      <header className={`${headerClasses} mt-0 md:mt-8`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                <span className="text-midnight font-bold text-xl">NX</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-display text-xl leading-none tracking-wide">NAVETTE XPRESS</span>
                <span className="text-gold text-[10px] tracking-[0.2em] font-medium leading-none mt-1 uppercase">Premium Service</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/70 hover:text-gold font-body text-sm font-medium transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-6">
              <ThemeToggle />

              {!session ? (
                <div className="flex items-center gap-3">
                  <Link href="/auth/signin" className="text-white text-sm font-medium hover:text-gold transition-colors">
                    Log In
                  </Link>
                  <Link
                    href="/reservation"
                    className="bg-gold text-midnight px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(201,168,76,0.2)] hover:shadow-[0_0_30px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5"
                  >
                    Réserver
                  </Link>
                </div>
              ) : (
                <div className="relative group/user">
                  <button className="flex items-center gap-2 text-white hover:text-gold transition-colors">
                    <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center bg-white/5">
                      <UserCircle size={16} weight="light" className="text-gold" />
                    </div>
                    <CaretDown size={14} weight="light" />
                  </button>

                  <div className="absolute right-0 mt-2 w-56 bg-obsidian border border-white/5 rounded-xl shadow-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-300 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/5">
                      <p className="text-white text-sm font-bold truncate">{session.user.name}</p>
                      <p className="text-white/50 text-xs truncate">{session.user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        href={(session.user as any).role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <SquaresFour size={16} weight="regular" className="text-gold" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-crimson hover:bg-crimson/10 rounded-lg transition-colors"
                      >
                        <SignOut size={16} weight="regular" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              className="lg:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} weight="light" /> : <List size={28} weight="regular" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-0 z-40 bg-midnight/95 backdrop-blur-2xl transition-transform duration-500 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col p-8 pt-24">
            <nav className="space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-2xl font-display text-white hover:text-gold transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              <Link
                href="/reservation"
                className="block w-full bg-gold text-midnight text-center py-4 rounded-xl font-bold text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Réserver Maintenant
              </Link>
              {!session ? (
                <Link
                  href="/auth/signin"
                  className="block w-full border border-white/10 text-white text-center py-4 rounded-xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Se connecter
                </Link>
              ) : (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full text-crimson text-center py-4"
                >
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}



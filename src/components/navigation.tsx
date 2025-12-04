"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Phone, Mail, Menu, X, ChevronDown } from "lucide-react";
import { trackPhoneCall, trackEmailClick } from "@/lib/analytics";

interface NavigationProps {
  variant?: "transparent" | "solid";
  showUserRole?: boolean;
}

export function Navigation({ variant = "solid" }: NavigationProps) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Menu principal - Services principaux
  const mainNavLinks = [
    { href: "/", label: "Accueil" },
    { href: "/services", label: "Services" },
    { href: "/flotte", label: "Flotte" },
    { href: "/temoignages", label: "Témoignages" },
    { href: "/contact", label: "Contact" },
  ];

  // Menu secondaire - Informations et support
  const secondaryNavLinks = [
    { href: "/faq", label: "FAQ" },
    { href: "/devenir-partenaire", label: "Partenaires" },
  ];

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Éviter les différences d'hydratation en utilisant des classes fixes pour le premier rendu
  const baseClasses = variant === "transparent" 
    ? `fixed top-10 left-0 right-0 z-40 transition-all duration-300 ${
        isMounted && isScrolled 
          ? "bg-white/98 dark:bg-slate-900/98 backdrop-blur-md shadow-md border-b border-slate-200/50 dark:border-slate-700/50" 
          : "bg-slate-900/95 backdrop-blur-md"
      }`
    : "bg-white/98 dark:bg-slate-900/98 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 mt-10";

  const textClasses = variant === "transparent"
    ? isMounted && isScrolled 
      ? "text-slate-900 dark:text-white"
      : "text-white"
    : "text-slate-900 dark:text-white";

  const linkClasses = variant === "transparent"
    ? isMounted && isScrolled
      ? "text-gray-600 dark:text-gray-300 hover:text-[#A73B3C] dark:hover:text-[#E5C16C]"
      : "text-white/90 hover:text-[#E5C16C]"
    : "text-gray-600 dark:text-gray-300 hover:text-[#A73B3C] dark:hover:text-[#E5C16C]";

  return (
    <>
      {/* Menu supérieur - Style moderne avec couleurs */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm py-2.5 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              {/* Liens secondaires style moderne */}
              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-700 dark:text-slate-300 hover:text-[#A73B3C] dark:hover:text-[#E5C16C] font-medium transition-colors whitespace-nowrap hidden sm:inline-block"
                >
                  {link.label}
                </Link>
              ))}
              <a 
                href="tel:+221781319191" 
                className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#A73B3C] dark:hover:text-[#E5C16C] transition-colors whitespace-nowrap group"
                onClick={() => trackPhoneCall('header')}
              >
                <Phone className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium">+221 78 131 91 91</span>
              </a>
              <a 
                href="mailto:contact@navettexpress.com" 
                className="hidden lg:flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#A73B3C] dark:hover:text-[#E5C16C] transition-colors group"
                onClick={() => trackEmailClick('header')}
              >
                <Mail className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium">contact@navettexpress.com</span>
              </a>
            </div>
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Service 24h/24</span>
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* Boutons d'authentification style moderne */}
              {isMounted && !session && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/signin"
                    className="text-slate-700 dark:text-slate-300 hover:text-[#A73B3C] dark:hover:text-[#E5C16C] px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-[#A73B3C] hover:bg-[#8B3032] text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm"
                  >
                    Inscription
                  </Link>
                </div>
              )}
              
              {/* Badge Dashboard style moderne */}
              {isMounted && session?.user && (
                <Link
                  href={(session.user as unknown as { role?: string })?.role === 'admin' ? '/admin/dashboard' : 
                        (session.user as unknown as { role?: string })?.role === 'driver' ? '/driver/dashboard' : '/client/dashboard'}
                  className="flex items-center gap-1.5 bg-[#A73B3C] hover:bg-[#8B3032] text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap shadow-sm"
                >
                  <span className="text-sm">
                    {(session.user as unknown as { role?: string })?.role === 'admin' ? '👑' : 
                     (session.user as unknown as { role?: string })?.role === 'driver' ? '🚗' : '👤'}
                  </span>
                  <span className="hidden sm:inline">
                    {(session.user as unknown as { role?: string })?.role === 'admin' ? 'Admin' : 
                     (session.user as unknown as { role?: string })?.role === 'driver' ? 'Chauffeur' : 'Espace'}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu principal - Optimisé */}
      <header className={baseClasses}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16 lg:h-18">
          {/* Logo - Compact */}
          <Link 
            href="/" 
            className="transition-transform duration-300 hover:scale-105 flex items-center gap-3 shrink-0"
          >
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-[#1A1A1A] dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-[#1A1A1A] font-bold text-lg lg:text-xl">NX</span>
            </div>
            <span className={`${textClasses} font-bold text-lg lg:text-xl hidden sm:inline`}>
              Navette Xpress
            </span>
          </Link>

          {/* Desktop Navigation - Optimisé */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-4">
            {/* Menu principal */}
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${linkClasses} font-medium transition-colors duration-200 px-4 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm xl:text-base whitespace-nowrap`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Bouton CTA - Style moderne avec icône */}
            <Link
              href="/reservation"
              className="ml-4 xl:ml-6 px-5 xl:px-6 py-2.5 rounded-lg font-semibold text-sm xl:text-base transition-all duration-300 whitespace-nowrap bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Réserver</span>
            </Link>

            {/* Profil utilisateur - Simplifié */}
            {isMounted && session?.user && (
              <div className="ml-2 xl:ml-3 relative group">
                <button
                  className={`flex items-center gap-2 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${linkClasses} hover:bg-slate-100 dark:hover:bg-slate-800`}
                >
                  <span className="w-8 h-8 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="hidden xl:block max-w-[100px] truncate">{session.user.name}</span>
                  <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{session.user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{session.user.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-1 bg-linear-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full">
                      {(session.user as unknown as { role?: string })?.role === 'admin' ? '👑 Admin' : 
                       (session.user as unknown as { role?: string })?.role === 'driver' ? '🚗 Chauffeur' : '👤 Client'}
                    </span>
                  </div>
                  <div className="p-2">
                    <Link
                      href={(session.user as unknown as { role?: string })?.role === 'admin' ? '/admin/dashboard' : 
                            (session.user as unknown as { role?: string })?.role === 'driver' ? '/driver/dashboard' : '/client/dashboard'}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <span className="text-base">📊</span>
                      Mon Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <span className="text-base">🚪</span>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="ml-2 xl:ml-3 shrink-0">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${textClasses} p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <nav className="py-4 space-y-2">
            {/* Menu principal mobile */}
            <div className="space-y-1">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkClasses} block px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Séparateur */}
            <div className="border-t border-slate-200 dark:border-slate-700 my-3"></div>
            
            {/* Menu secondaire mobile */}
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Informations
              </div>
              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkClasses} block px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <Link
              href="/reservation"
              className="block bg-linear-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg w-fit mx-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Réserver
            </Link>

            {isMounted && session?.user && (
              <Link
                href={(session.user as unknown as { role?: string })?.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                className={`${linkClasses} block px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {(session.user as unknown as { role?: string })?.role === 'admin' ? 'Dashboard Admin' : 'Mon Espace'}
              </Link>
            )}

            {isMounted && !session && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 px-4">
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/signin"
                    className="w-full bg-linear-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg cursor-pointer text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              </div>
            )}

            {session?.user && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 px-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{session.user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {(session.user as unknown as { role?: string })?.role === 'admin' ? 'Admin' : 'Client'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
      </header>
    </>
  );
}



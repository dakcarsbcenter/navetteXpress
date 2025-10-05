"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavigationProps {
  variant?: "transparent" | "solid";
  showUserRole?: boolean;
}

export function Navigation({ variant = "solid", showUserRole = false }: NavigationProps) {
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
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isMounted && isScrolled 
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg" 
          : "bg-slate-900/95 backdrop-blur-md"
      }`
    : "bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200/20 dark:border-slate-700/20";

  const textClasses = variant === "transparent"
    ? isMounted && isScrolled 
      ? "text-slate-900 dark:text-white"
      : "text-white"
    : "text-slate-900 dark:text-white";

  const linkClasses = variant === "transparent"
    ? isMounted && isScrolled
      ? "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      : "text-white/90 hover:text-white"
    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white";

  return (
    <>
      {/* Menu supérieur - Informations de contact */}
      <div className="bg-slate-900 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hidden sm:inline">+221 78 131 91 91</span>
                <span className="sm:hidden">+221 78 131 91 91</span>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contact@navettexpress.sn</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-4">
                <span>Service 24h/24</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              
              {/* Boutons d'authentification */}
              {!session && (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/signin"
                    className="text-white/90 hover:text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="border border-white/30 text-white hover:bg-white/10 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu principal */}
      <header className={baseClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo - Style épuré comme dans l'exemple */}
          <Link 
            href="/" 
            className={`text-2xl font-bold transition-all duration-300 hover:scale-105 ${textClasses}`}
          >
            <span className="font-bold">
              Navette Xpress
            </span>
          </Link>

          {/* Desktop Navigation - Style minimaliste */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Menu principal */}
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${linkClasses} font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Menu secondaire avec séparateur */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-300 dark:border-slate-600">
              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkClasses} font-medium transition-all duration-200 hover:scale-105 text-sm whitespace-nowrap`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Bouton CTA - Style professionnel */}
            <Link
              href="/reservation"
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                variant === "transparent" && isMounted && isScrolled
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                  : variant === "transparent"
                  ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
              }`}
            >
              Réserver
            </Link>

            {/* Tableau de bord adaptatif selon le rôle */}
            {session?.user && (
              <Link
                href={session.user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                className={`${linkClasses} font-medium transition-all duration-200 hover:scale-105`}
              >
                {session.user.role === 'admin' ? 'Dashboard Admin' : 'Mon Espace'}
              </Link>
            )}


            {session?.user && (
              <div className="ml-2 relative group">
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${linkClasses} hover:bg-slate-100 dark:hover:bg-slate-800`}
                >
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="hidden md:block">{session.user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{session.user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {session.user.role === 'admin' ? 'Admin' : 'Client'}
                    </span>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="ml-4">
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
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
              className="block bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg font-semibold transition-all duration-200 w-fit mx-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Réserver
            </Link>

            {session?.user && (
              <Link
                href={session.user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                className={`${linkClasses} block px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {session.user.role === 'admin' ? 'Dashboard Admin' : 'Mon Espace'}
              </Link>
            )}

            {!session && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 px-4">
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/signin"
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    S'inscrire
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
                      {session.user.role === 'admin' ? 'Admin' : 'Client'}
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

"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

// Composant pour les utilisateurs connectés
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  
  if (status === "loading") {
    return <div>Chargement...</div>
  }
  
  if (status === "authenticated") {
    return <>{children}</>
  }
  
  return null
}

// Composant pour les utilisateurs non connectés
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  
  if (status === "loading") {
    return <div>Chargement...</div>
  }
  
  if (status === "unauthenticated") {
    return <>{children}</>
  }
  
  return null
}

// Bouton de connexion
export function SignInButton({ 
  children, 
  mode = "redirect" 
}: { 
  children: React.ReactNode
  mode?: "redirect" | "modal"
}) {
  const handleSignIn = () => {
    if (mode === "redirect") {
      window.location.href = "/auth/signin"
    } else {
      // Pour le mode modal, vous pouvez implémenter un modal personnalisé
      window.location.href = "/auth/signin"
    }
  }

  return (
    <button onClick={handleSignIn}>
      {children}
    </button>
  )
}

// Bouton d'inscription
export function SignUpButton({ 
  children, 
  mode = "redirect" 
}: { 
  children: React.ReactNode
  mode?: "redirect" | "modal"
}) {
  const handleSignUp = () => {
    if (mode === "redirect") {
      window.location.href = "/auth/signup"
    } else {
      // Pour le mode modal, vous pouvez implémenter un modal personnalisé
      window.location.href = "/auth/signup"
    }
  }

  return (
    <button onClick={handleSignUp}>
      {children}
    </button>
  )
}

// Bouton de déconnexion
export function SignOutButton({ children }: { children: React.ReactNode }) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <button onClick={handleSignOut}>
      {children}
    </button>
  )
}

// Composant UserButton (profil utilisateur)
export function UserButton({ 
  appearance 
}: { 
  appearance?: {
    elements?: {
      avatarBox?: string
    }
  }
}) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${appearance?.elements?.avatarBox || "w-8 h-8"} rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 transition-colors`}
      >
        {session.user.image ? (
          <div className="relative w-full h-full">
            <Image 
              src={session.user.image} 
              alt={session.user.name || "User"} 
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {session.user.name || "Utilisateur"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.user.email}
            </p>
          </div>
          
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          
          <button
            onClick={() => {
              signOut({ callbackUrl: "/" })
              setIsOpen(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

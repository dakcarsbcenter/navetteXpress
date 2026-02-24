"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function TestNextAuthPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        alert(`Erreur: ${result.error}`)
      } else {
        alert("Connexion réussie!")
      }
    } catch (error) {
      alert(`Erreur: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Test NextAuth</h2>
          <p className="text-center text-gray-600 mt-2">
            Testez la connexion NextAuth
          </p>
        </div>

        {session ? (
          <div className="bg-green-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Connecté avec succès !
            </h3>
            <p className="text-green-700 mb-4">
              Bonjour, {session.user?.name || session.user?.email} !
            </p>
            <div className="space-y-2 text-sm text-green-600">
              <p><strong>ID:</strong> {(session.user as unknown as { id?: string })?.id}</p>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Nom:</strong> {session.user?.name}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="test@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="n&apos;importe quel mot de passe"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

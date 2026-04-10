"use client"

import { useState } from "react"
import Link from "next/link"

export default function TestServerPage() {
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState("test@example.com")
  const [testPassword, setTestPassword] = useState("")

  const testServer = async () => {
    setIsLoading(true)
    setResult("")

    if (!testPassword) {
      setResult("❌ Veuillez entrer un mot de passe de test")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: testEmail,
          password: testPassword
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Serveur fonctionne: ${data.message}`)
      } else {
        setResult(`❌ Erreur serveur: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Erreur réseau: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Test du serveur</h2>
          <p className="text-center text-gray-600 mt-2">
            Vérifiez que le serveur Next.js fonctionne
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email de test"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Mot de passe de test (requis)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <button
          onClick={testServer}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Test en cours..." : "Tester le serveur"}
        </button>

        {result && (
          <div className={`p-4 rounded-md ${
            result.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {result}
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Si le test fonctionne, le problème vient de la configuration de la base de données.
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

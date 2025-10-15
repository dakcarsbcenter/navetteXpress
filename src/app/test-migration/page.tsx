'use client'

import { useState } from 'react'

export default function TestMigrationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/migrate-roles-simple', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Erreur lors de la migration', details: String(error) })
    }
    setLoading(false)
  }

  const testCreateRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Gestionnaire',
          displayName: 'Gestionnaire',
          description: 'Rôle de gestionnaire avec accès limité aux fonctions administratives'
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Erreur lors de la création du rôle', details: String(error) })
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Migration & Création de Rôles</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runMigration}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'En cours...' : '1. Exécuter la migration'}
        </button>
        
        <button
          onClick={testCreateRole}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          {loading ? 'En cours...' : '2. Créer un rôle de test'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Résultat :</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
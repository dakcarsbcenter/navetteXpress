'use client'

import { useState } from 'react'

export default function MigrationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    setResult(null)
    try {
      console.log('Démarrage de la migration...')
      const response = await fetch('/api/admin/migrate-roles-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Réponse reçue:', response.status)
      const data = await response.json()
      console.log('Données:', data)
      setResult(data)
    } catch (error) {
      console.error('Erreur:', error)
      setResult({ 
        success: false, 
        error: 'Erreur lors de la migration', 
        details: String(error) 
      })
    }
    setLoading(false)
  }

  const testRoleCreation = async () => {
    setLoading(true)
    setResult(null)
    try {
      console.log('Test de création de rôle...')
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Manager',
          displayName: 'Manager',
          description: 'Rôle de gestion avec privilèges étendus'
        })
      })
      
      const data = await response.json()
      console.log('Réponse création rôle:', data)
      setResult(data)
    } catch (error) {
      console.error('Erreur création rôle:', error)
      setResult({ 
        success: false, 
        error: 'Erreur lors de la création du rôle', 
        details: String(error) 
      })
    }
    setLoading(false)
  }

  const refreshRoles = async () => {
    setLoading(true)
    setResult(null)
    try {
      console.log('Récupération des rôles...')
      const response = await fetch('/api/admin/roles')
      const data = await response.json()
      console.log('Rôles récupérés:', data)
      setResult(data)
    } catch (error) {
      console.error('Erreur récupération rôles:', error)
      setResult({ 
        success: false, 
        error: 'Erreur lors de la récupération des rôles', 
        details: String(error) 
      })
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Migration des Rôles Personnalisés</h1>
      
      <div className="space-y-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Étape 1: Migration de la base de données</h2>
          <p className="text-blue-700 mb-4">Créer les tables custom_roles et role_permissions</p>
          <button
            onClick={runMigration}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Migration en cours...' : 'Exécuter la migration'}
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Étape 2: Test de création de rôle</h2>
          <p className="text-green-700 mb-4">Créer un rôle personnalisé pour tester</p>
          <button
            onClick={testRoleCreation}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création en cours...' : 'Créer un rôle de test'}
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Étape 3: Vérification</h2>
          <p className="text-gray-700 mb-4">Vérifier que les rôles sont bien récupérés</p>
          <button
            onClick={refreshRoles}
            disabled={loading}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : 'Rafraîchir les rôles'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Résultat :</h2>
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
            <div className="mb-2">
              <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅ Succès' : '❌ Erreur'}
              </span>
            </div>
            <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions :</h3>
        <ol className="text-yellow-700 space-y-1">
          <li>1. Exécutez d'abord la migration pour créer les nouvelles tables</li>
          <li>2. Testez la création d'un rôle personnalisé</li>
          <li>3. Vérifiez que les rôles sont bien récupérés par l'API</li>
          <li>4. Retournez sur la page des permissions pour voir les nouveaux rôles</li>
        </ol>
      </div>
    </div>
  )
}

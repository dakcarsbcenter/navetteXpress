"use client"

import { useState, useEffect } from "react"

interface Session {
  id: string
  userId: string
  expires: string
  sessionToken: string
  user?: {
    name: string
    email: string
    role: string
  }
}

export function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return
    
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchSessions()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const isSessionActive = (expires: string) => {
    return new Date(expires) > new Date()
  }

  const getSessionStatus = (expires: string) => {
    const isActive = isSessionActive(expires)
    return {
      isActive,
      text: isActive ? 'Active' : 'Expirée',
      color: isActive 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200',
      icon: isActive ? '✅' : '❌'
    }
  }

  const filteredSessions = sessions.filter(session => {
    const status = getSessionStatus(session.expires)
    switch (filter) {
      case 'active':
        return status.isActive
      case 'expired':
        return !status.isActive
      default:
        return true
    }
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des sessions
        </h2>
        
        {/* Filtres */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'expired'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Expirées
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total sessions</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sessions actives</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {sessions.filter(s => isSessionActive(s.expires)).length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">❌</div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sessions expirées</div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {sessions.filter(s => !isSessionActive(s.expires)).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expire le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSessions.map((session) => {
                const status = getSessionStatus(session.expires)
                return (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.user?.name || 'Utilisateur inconnu'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {session.user?.email || ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.user?.role === 'admin' ? '👑 Admin' : '🚗 Chauffeur'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {session.sessionToken.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(session.expires).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            {filter === 'all' 
              ? 'Aucune session trouvée'
              : filter === 'active'
              ? 'Aucune session active'
              : 'Aucune session expirée'
            }
          </div>
        </div>
      )}
    </div>
  )
}

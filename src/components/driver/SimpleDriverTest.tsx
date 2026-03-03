"use client"

import { useState } from 'react'

export function SimpleDriverTest() {
  const [currentView, setCurrentView] = useState<string>('home')

  const handleClick = (view: string) => {
    console.log(`Clic sur ${view}`)
    alert(`Navigation vers ${view}`)
    setCurrentView(view)
  }

  if (currentView === 'planning') {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <button 
            onClick={() => setCurrentView('home')}
            className="bg-gray-500 dark:bg-gray-700 text-white px-4 py-2 rounded mb-4 hover:bg-gray-600 dark:hover:bg-gray-600"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-blue-600">📅 PLANNING</h1>
          <p className="text-lg text-gray-900 dark:text-white">Vous êtes maintenant dans la section Planning !</p>
        </div>
      </div>
    )
  }

  if (currentView === 'vehicle-report') {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <button 
            onClick={() => setCurrentView('home')}
            className="bg-gray-500 dark:bg-gray-700 text-white px-4 py-2 rounded mb-4 hover:bg-gray-600 dark:hover:bg-gray-600"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-orange-600">🚗 RAPPORT VÉHICULE</h1>
          <p className="text-lg text-gray-900 dark:text-white">Vous êtes maintenant dans la section Rapport Véhicule !</p>
        </div>
      </div>
    )
  }

  if (currentView === 'stats') {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <button 
            onClick={() => setCurrentView('home')}
            className="bg-gray-500 dark:bg-gray-700 text-white px-4 py-2 rounded mb-4 hover:bg-gray-600 dark:hover:bg-gray-600"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-purple-600">📊 STATISTIQUES</h1>
          <p className="text-lg text-gray-900 dark:text-white">Vous êtes maintenant dans la section Statistiques !</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Test Navigation Chauffeur</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Vue actuelle: <strong>{currentView}</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Planning</h3>
          <button
            onClick={() => handleClick('planning')}
            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-xl w-full transition-colors"
          >
            Voir le Planning
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">🚗</div>
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Véhicule</h3>
          <button
            onClick={() => handleClick('vehicle-report')}
            className="bg-orange-600 dark:bg-orange-600 hover:bg-orange-700 dark:hover:bg-orange-700 text-white px-6 py-3 rounded-xl w-full transition-colors"
          >
            Rapport Véhicule
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Statistiques</h3>
          <button
            onClick={() => handleClick('stats')}
            className="bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700 text-white px-6 py-3 rounded-xl w-full transition-colors"
          >
            Voir Stats
          </button>
        </div>
      </div>
    </div>
  )
}

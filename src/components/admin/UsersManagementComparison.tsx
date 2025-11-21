"use client"

import { useState } from "react"
import { UsersManagement } from "./UsersManagement"
import { ModernUsersManagement } from "./ModernUsersManagement"

export function UsersManagementComparison() {
  const [activeView, setActiveView] = useState<'current' | 'modern'>('modern')

  return (
    <div className="min-h-screen">
      {/* Sélecteur de vue */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                🎨 Design Comparison - Gestion des Utilisateurs
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Comparez l'interface actuelle avec le nouveau design moderne
              </p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveView('current')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'current'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📋 Interface Actuelle
              </button>
              <button
                onClick={() => setActiveView('modern')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'modern'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ✨ Design Moderne
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="transition-all duration-300">
        {activeView === 'current' ? (
          <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <UsersManagement />
          </div>
        ) : (
          <ModernUsersManagement />
        )}
      </div>

      {/* Indicateur de vue active */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              activeView === 'modern' ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <span className="font-medium text-slate-900 dark:text-white">
              {activeView === 'modern' ? '✨ Design Moderne' : '📋 Interface Actuelle'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

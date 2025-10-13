"use client"

export default function TestPage() {
  console.log('🧪 TEST PAGE - Composant chargé!')
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🧪 Page de Test React
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tests de Fonctionnalité</h2>
          
          <div className="space-y-4">
            {/* Test 1: Rendu de base */}
            <div className="p-3 bg-green-100 rounded">
              <h3 className="font-medium text-green-800">✅ React Render OK</h3>
              <p className="text-green-700">Si vous voyez ce texte, React fonctionne.</p>
            </div>
            
            {/* Test 2: JavaScript basique */}
            <div className="p-3 bg-blue-100 rounded">
              <h3 className="font-medium text-blue-800">🔧 Test JavaScript</h3>
              <button 
                onClick={() => {
                  console.log('✅ JavaScript fonctionne!')
                  alert('JavaScript OK!')
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tester JavaScript
              </button>
            </div>
            
            {/* Test 3: État React */}
            <StateTest />
            
            {/* Test 4: Navigation */}
            <div className="p-3 bg-purple-100 rounded">
              <h3 className="font-medium text-purple-800">🚀 Navigation</h3>
              <a 
                href="/driver/dashboard" 
                className="mt-2 inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Retour au Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StateTest() {
  console.log('🧪 StateTest component rendered')
  
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-3 bg-yellow-100 rounded">
      <h3 className="font-medium text-yellow-800">⚡ Test État React</h3>
      <p className="text-yellow-700">Compteur: {count}</p>
      <button 
        onClick={() => {
          console.log('✅ setState fonctionne!')
          setCount(prev => prev + 1)
        }}
        className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        Incrémenter (+1)
      </button>
    </div>
  )
}

// Import nécessaire
import { useState } from 'react'
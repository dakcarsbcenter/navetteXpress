'use client';

import { useState, useEffect } from 'react';
import { trackEvent, trackPhoneCall, trackEmailClick, trackQuoteRequest } from '@/lib/analytics';

export default function TestGoogleAnalytics() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    // Vérifier si Google Analytics est chargé
    const checkGA = setInterval(() => {
      if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
        setIsLoaded(true);
        clearInterval(checkGA);
      }
    }, 100);

    return () => clearInterval(checkGA);
  }, []);

  const addEvent = (eventName: string) => {
    setEvents(prev => [...prev, `${new Date().toLocaleTimeString()} - ${eventName}`]);
  };

  const testPhoneCall = () => {
    trackPhoneCall('test_page');
    addEvent('Appel téléphonique tracké');
  };

  const testEmailClick = () => {
    trackEmailClick('test_page');
    addEvent('Clic email tracké');
  };

  const testQuoteRequest = () => {
    trackQuoteRequest('Transfert Aéroport AIBD');
    addEvent('Demande de devis trackée');
  };

  const testCustomEvent = () => {
    trackEvent({
      action: 'test_custom_event',
      category: 'test',
      label: 'manual_test',
      value: 1
    });
    addEvent('Événement personnalisé tracké');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Test Google Analytics - Navette Xpress
          </h1>

          {/* Status */}
          <div className="mb-8 p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Status Google Analytics</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isLoaded ? 'text-green-600' : 'text-red-600'}>
                {isLoaded ? 'Google Analytics chargé ✅' : 'Google Analytics non chargé ❌'}
              </span>
            </div>
            {isLoaded && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                ID de suivi : G-X1NDJE79VS
              </p>
            )}
          </div>

          {/* Test Buttons */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={testPhoneCall}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium transition-colors"
              disabled={!isLoaded}
            >
              📞 Tester Appel Téléphonique
            </button>
            
            <button
              onClick={testEmailClick}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg font-medium transition-colors"
              disabled={!isLoaded}
            >
              ✉️ Tester Clic Email
            </button>
            
            <button
              onClick={testQuoteRequest}
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg font-medium transition-colors"
              disabled={!isLoaded}
            >
              💰 Tester Demande de Devis
            </button>
            
            <button
              onClick={testCustomEvent}
              className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg font-medium transition-colors"
              disabled={!isLoaded}
            >
              🔥 Tester Événement Personnalisé
            </button>
          </div>

          {/* Events Log */}
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Journal des Événements</h3>
            {events.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Aucun événement tracké. Cliquez sur les boutons ci-dessus pour tester.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div key={index} className="bg-white dark:bg-slate-600 p-2 rounded text-sm">
                    {event}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Comment vérifier dans Google Analytics
            </h3>
            <ol className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
              <li>1. Ouvrez Google Analytics (analytics.google.com)</li>
              <li>2. Allez dans "Rapports" &gt; "Temps réel" &gt; "Événements"</li>
              <li>3. Cliquez sur les boutons de test ci-dessus</li>
              <li>4. Vérifiez que les événements apparaissent en temps réel</li>
              <li>5. Les événements peuvent prendre 1-2 minutes pour apparaître</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

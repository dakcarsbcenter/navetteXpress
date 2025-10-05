"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Page utilitaire pour assigner le rôle admin
 * Accès: /init-admin
 * À utiliser uniquement pour initialiser le premier admin
 */
export default function InitAdminPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const isLoaded = status !== "loading";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

  const handleAssignAdmin = async (targetUserId: string) => {
    if (!targetUserId) {
      setMessage('❌ ID utilisateur requis');
      return;
    }

    setLoading(true);
    setMessage('🔄 Assignation du rôle admin...');

    try {
      const response = await fetch('/api/init-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('✅ Rôle admin assigné avec succès! Vous pouvez maintenant accéder à /admin');
      } else {
        setMessage('❌ Erreur: ' + result.error);
      }
    } catch (error) {
      setMessage('❌ Erreur réseau: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              🔐 Initialisation Admin
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Utilitaire pour assigner le rôle administrateur
            </p>
          </div>

          {/* Info utilisateur actuel */}
          {userId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                👤 Utilisateur connecté
              </h3>
              <p className="font-mono text-sm bg-white dark:bg-slate-700 px-3 py-2 rounded border">
                {userId}
              </p>
              <button
                onClick={() => handleAssignAdmin(userId)}
                disabled={loading}
                className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {loading ? 'Traitement...' : 'M\'assigner le rôle admin'}
              </button>
            </div>
          )}

          {/* Formulaire pour un autre utilisateur */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4">
              Ou assigner à un autre utilisateur
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  ID Utilisateur
                </label>
                <input
                  type="text"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="uuid-utilisateur..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  L&apos;ID utilisateur de la base de données
                </p>
              </div>

              <button
                onClick={() => handleAssignAdmin(userIdInput)}
                disabled={loading || !userIdInput}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {loading ? 'Traitement...' : 'Assigner le rôle admin'}
              </button>
            </div>
          </div>

          {/* Message de résultat */}
          {message && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-900 dark:text-white whitespace-pre-line">
                {message}
              </p>
            </div>
          )}

          {/* Guide */}
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
              📋 Comment obtenir l&apos;ID utilisateur ?
            </h3>
            <ol className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-decimal list-inside">
              <li>Connectez-vous à votre compte</li>
              <li>Allez sur le dashboard</li>
              <li>L&apos;ID utilisateur est affiché dans l&apos;URL ou les DevTools</li>
              <li>Ou utilisez l&apos;ID affiché ci-dessus pour votre compte actuel</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="/dashboard"
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              ← Dashboard Normal
            </a>
            <a
              href="/admin"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Dashboard Admin →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

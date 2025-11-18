"use client"

import React, { useState } from 'react';

interface PriceApprovalModalProps {
  bookingId: number;
  price: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDateTime: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PriceApprovalModal({
  bookingId,
  price,
  customerName,
  pickupAddress,
  dropoffAddress,
  scheduledDateTime,
  isOpen,
  onClose,
  onSuccess
}: PriceApprovalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/client/bookings/${bookingId}/respond-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: 'accepted',
          message: message || undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Proposition acceptée ! Votre réservation est confirmée.');
        onSuccess();
        onClose();
      } else {
        alert('❌ Erreur : ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!message.trim()) {
      alert('Veuillez indiquer pourquoi vous refusez cette proposition');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/client/bookings/${bookingId}/respond-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: 'rejected',
          message: message
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Proposition rejetée. L\'administrateur a été notifié.');
        onSuccess();
        onClose();
      } else {
        alert('❌ Erreur : ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold">💰 Proposition de Prix</h2>
          <p className="text-blue-100 mt-2">Réservation #{bookingId}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Détails de la réservation */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">📋 Détails du trajet</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">De :</span>
                <span className="ml-2 text-slate-900 dark:text-white font-medium">{pickupAddress}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">À :</span>
                <span className="ml-2 text-slate-900 dark:text-white font-medium">{dropoffAddress}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Date :</span>
                <span className="ml-2 text-slate-900 dark:text-white font-medium">
                  {new Date(scheduledDateTime).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Prix proposé */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-2">Prix proposé par l'administrateur</p>
            <p className="text-5xl font-bold text-green-600 dark:text-green-400">{price} FCFA</p>
          </div>

          {/* Message optionnel */}
          {!showRejectForm && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message optionnel (pour acceptation ou questions)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ajoutez un commentaire si vous le souhaitez..."
                rows={3}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Formulaire de rejet */}
          {showRejectForm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                Pourquoi refusez-vous cette proposition ? *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Exemple : Le prix est trop élevé, je souhaite négocier..."
                rows={4}
                className="w-full p-3 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          )}

          {/* Avertissement */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Important :</strong> Une fois votre réponse envoyée, vous ne pourrez plus la modifier.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600 flex flex-col sm:flex-row gap-3">
          {!showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                ❌ Refuser
              </button>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Traitement...' : '✅ Accepter'}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setMessage('');
                }}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                ← Retour
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Envoi...' : 'Confirmer le refus'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

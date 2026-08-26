"use client"

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toIntlLocale } from '@/lib/intl-locale';
import { Wallet, Clock, Warning } from '@phosphor-icons/react';

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
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const t = useTranslations('client.priceApproval');
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
        onSuccess();
        onClose();
      } else {
        alert(`${t('genericError')}: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!message.trim()) {
      alert(t('rejectReasonRequired'));
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
        onSuccess();
        onClose();
      } else {
        alert(`${t('genericError')}: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, var(--color-client-accent-bg) 0%, transparent 100%)', borderBottom: '1px solid var(--color-client-border)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}>
            <Wallet size={24} weight="duotone" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('title')}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>{t('booking')} #{bookingId}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
            <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--color-client-text-primary)' }}>{t('tripDetails')}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('from')}</span>
                <span className="ml-2 font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{pickupAddress}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('to')}</span>
                <span className="ml-2 font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{dropoffAddress}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('date')}</span>
                <span className="ml-2 font-medium" style={{ color: 'var(--color-client-text-primary)' }}>
                  {new Date(scheduledDateTime).toLocaleDateString(intlLocale, {
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
          <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
            <p className="mb-2 text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>{t('proposedPrice')}</p>
            <p className="text-4xl sm:text-5xl font-bold" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>{price} FCFA</p>
          </div>

          {!showRejectForm && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-client-text-primary)' }}>
                {t('optionalMessage')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('optionalMessagePlaceholder')}
                rows={3}
                className="w-full p-3 rounded-lg resize-none outline-none transition-all"
                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
              />
            </div>
          )}

          {showRejectForm && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#EF4444' }}>
                {t('rejectReasonLabel')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('rejectReasonPlaceholder')}
                rows={4}
                className="w-full p-3 rounded-lg resize-none outline-none transition-all"
                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-client-text-primary)' }}
                required
              />
            </div>
          )}

          <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Warning size={18} weight="fill" className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
            <p className="text-sm" style={{ color: '#B45309' }}>{t('warning')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3" style={{ backgroundColor: 'var(--color-client-surface)', borderTop: '1px solid var(--color-client-border)' }}>
          {!showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                className="flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ border: '2px solid #EF4444', color: '#EF4444', backgroundColor: 'transparent' }}
              >
                {t('reject')}
              </button>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
              >
                {isLoading ? (
                  <>
                    <Clock size={16} className="animate-spin" /> {t('processing')}
                  </>
                ) : t('accept')}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-secondary)' }}
              >
                {t('cancel')}
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
                className="flex-1 px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-secondary)' }}
              >
                {t('back')}
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ backgroundColor: '#EF4444', color: '#fff' }}
              >
                {isLoading ? t('sending') : t('confirmReject')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client"

import React, { useEffect, useState } from 'react';
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
  initialMode?: 'accept' | 'reject';
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
  initialMode = 'accept',
  onClose,
  onSuccess
}: PriceApprovalModalProps) {
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const t = useTranslations('client.priceApproval');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(initialMode === 'reject');

  useEffect(() => {
    if (isOpen) setShowRejectForm(initialMode === 'reject');
  }, [isOpen, initialMode]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(18,16,14,0.5)' }}>
      <div className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }}>
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center gap-4" style={{ borderBottom: '1px solid #E2DACD' }}>
          <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', borderRadius: '4px' }}>
            <Wallet size={22} weight="duotone" />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#12100E', letterSpacing: '-0.01em' }}>{t('title')}</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase" style={{ color: '#6E6A63', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>{t('booking')} #{bookingId}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="p-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase" style={{ color: '#6E6A63', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)' }}>{t('tripDetails')}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span style={{ color: '#6E6A63' }}>{t('from')}</span>
                <span className="ml-2 font-medium" style={{ color: '#12100E' }}>{pickupAddress}</span>
              </div>
              <div>
                <span style={{ color: '#6E6A63' }}>{t('to')}</span>
                <span className="ml-2 font-medium" style={{ color: '#12100E' }}>{dropoffAddress}</span>
              </div>
              <div>
                <span style={{ color: '#6E6A63' }}>{t('date')}</span>
                <span className="ml-2 font-medium" style={{ color: '#12100E' }}>
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
          <div className="p-6 text-center" style={{ backgroundColor: '#E8DCC8', borderRadius: '3px' }}>
            <p className="mb-2 font-mono text-[10px] uppercase" style={{ color: '#3d3a35', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>{t('proposedPrice')}</p>
            <p className="text-4xl font-semibold" style={{ color: '#12100E', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{price} <span className="text-xl font-normal" style={{ color: '#6E6A63' }}>FCFA</span></p>
          </div>

          {!showRejectForm && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#12100E' }}>
                {t('optionalMessage')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('optionalMessagePlaceholder')}
                rows={3}
                className="w-full p-3 resize-none outline-none transition-all"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E' }}
              />
            </div>
          )}

          {showRejectForm && (
            <div className="p-4" style={{ backgroundColor: 'rgba(184,73,60,.06)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '3px' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#B8493C' }}>
                {t('rejectReasonLabel')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('rejectReasonPlaceholder')}
                rows={4}
                className="w-full p-3 resize-none outline-none transition-all"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(184,73,60,.35)', borderRadius: '3px', color: '#12100E' }}
                required
              />
            </div>
          )}

          <div className="p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(180,100,58,.08)', border: '1px solid rgba(180,100,58,.25)', borderRadius: '3px' }}>
            <Warning size={18} weight="fill" className="shrink-0 mt-0.5" style={{ color: '#B4643A' }} />
            <p className="text-sm" style={{ color: '#3d3a35' }}>{t('warning')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3" style={{ backgroundColor: '#F7F3EC', borderTop: '1px solid #E2DACD' }}>
          {!showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                className="flex-1 px-4 sm:px-6 py-3 font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ border: '1px solid #12100E', color: '#12100E', backgroundColor: 'transparent', borderRadius: '4px' }}
              >
                {t('reject')}
              </button>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 px-4 sm:px-6 py-3 font-semibold transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1F5245', color: '#FFFFFF', borderRadius: '4px' }}
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
                className="w-full sm:w-auto px-4 sm:px-6 py-3 font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '4px' }}
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
                className="flex-1 px-4 sm:px-6 py-3 font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '4px' }}
              >
                {t('back')}
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 px-4 sm:px-6 py-3 font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
                style={{ backgroundColor: '#B8493C', color: '#FFFFFF', borderRadius: '4px' }}
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

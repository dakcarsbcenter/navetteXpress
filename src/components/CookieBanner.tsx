'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GA_MEASUREMENT_ID } from '@/lib/ga';
import { CONSENT_OPEN_EVENT, readConsent, writeConsent, type ConsentChoice } from '@/lib/consent';

export function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    if (readConsent() === null) setVisible(true);
    const open = () => setVisible(true);
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  if (!visible) return null;

  const choose = (choice: ConsentChoice) => {
    writeConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      className="fixed inset-x-3 bottom-3 z-[90] md:inset-x-auto md:left-6 md:bottom-6 md:max-w-md rounded-md bg-foreground text-background p-5 shadow-lg"
    >
      <p className="text-sm leading-relaxed">
        {t('text')}{' '}
        <Link href="/confidentialite" className="underline underline-offset-2">
          {t('learnMore')}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => choose('granted')}
          className="min-h-11 px-5 rounded bg-background text-foreground font-mono text-xs tracking-[0.12em] uppercase active:scale-[0.97] transition-transform"
        >
          {t('accept')}
        </button>
        <button
          type="button"
          onClick={() => choose('denied')}
          className="min-h-11 px-5 rounded border border-background/40 font-mono text-xs tracking-[0.12em] uppercase active:scale-[0.97] transition-transform"
        >
          {t('refuse')}
        </button>
      </div>
    </div>
  );
}

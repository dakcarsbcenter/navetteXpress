"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * Ilot client isole de la home : seule cette carte a besoin d'interactivite
 * (onglets + navigation avec parametres). Le reste de la section (titre,
 * arguments) reste rendu cote serveur dans HomeClient.tsx.
 */
export function BookingWidget() {
  const t = useTranslations("home");
  const router = useRouter();
  const [bookingService, setBookingService] = useState('transfert-aibd-dakar');

  return (
    <div className="bg-white border border-line rounded-lg p-8 md:p-10">
      <div className="relative flex gap-2 mb-8 p-1 bg-background rounded border border-line">
        {/* Pastille qui glisse d'un onglet a l'autre (2 onglets, gap-2, p-1). */}
        <span
          aria-hidden="true"
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded bg-accent transition-transform duration-300 ease-out ${
            bookingService === 'chauffeur-prive-dakar' ? 'translate-x-[calc(100%+0.5rem)]' : 'translate-x-0'
          }`}
        />
        <button
          onClick={() => setBookingService('transfert-aibd-dakar')}
          aria-pressed={bookingService === 'transfert-aibd-dakar'}
          className={`relative z-10 flex-1 py-3 px-6 rounded font-semibold transition-colors duration-300 ${
            bookingService === 'transfert-aibd-dakar'
              ? 'text-white'
              : 'text-foreground hover:text-accent'
          }`}
        >
          {t("booking.tabAirport")}
        </button>
        <button
          onClick={() => setBookingService('chauffeur-prive-dakar')}
          aria-pressed={bookingService === 'chauffeur-prive-dakar'}
          className={`relative z-10 flex-1 py-3 px-6 rounded font-semibold transition-colors duration-300 ${
            bookingService === 'chauffeur-prive-dakar'
              ? 'text-white'
              : 'text-foreground hover:text-accent'
          }`}
        >
          {t("booking.tabCity")}
        </button>
      </div>

      <div className="p-6 rounded border border-line bg-background text-center mb-6">
        <p className="text-body text-lg">
          {t("booking.placeholder")}
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        icon={<ArrowRight size={22} weight="regular" />}
        iconPosition="right"
        onClick={() => {
          const queryParams = new URLSearchParams();
          if (bookingService) queryParams.append('service', bookingService);
          router.push(`/reservation?${queryParams.toString()}`);
        }}
      >
        {t("booking.cta")}
      </Button>
    </div>
  );
}

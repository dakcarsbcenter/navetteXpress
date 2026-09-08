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
    <div className="bg-white border border-[#e2dacd] rounded-lg p-8 md:p-10">
      <div className="flex gap-2 mb-8 p-1 bg-background rounded border border-[#e2dacd]">
        <button
          onClick={() => setBookingService('transfert-aibd-dakar')}
          aria-pressed={bookingService === 'transfert-aibd-dakar'}
          className={`flex-1 py-3 px-6 rounded font-semibold transition-colors ${
            bookingService === 'transfert-aibd-dakar'
              ? 'bg-accent text-white'
              : 'text-foreground hover:bg-[#F0ECE2]'
          }`}
        >
          {t("booking.tabAirport")}
        </button>
        <button
          onClick={() => setBookingService('chauffeur-prive-dakar')}
          aria-pressed={bookingService === 'chauffeur-prive-dakar'}
          className={`flex-1 py-3 px-6 rounded font-semibold transition-colors ${
            bookingService === 'chauffeur-prive-dakar'
              ? 'bg-accent text-white'
              : 'text-foreground hover:bg-[#F0ECE2]'
          }`}
        >
          {t("booking.tabCity")}
        </button>
      </div>

      <div className="p-6 rounded border border-[#e2dacd] bg-background text-center mb-6">
        <p className="text-[#3d3a35] text-lg">
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

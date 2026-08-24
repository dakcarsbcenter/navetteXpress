"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReservationForm } from "@/app/[locale]/reservation/ReservationClient";
import reservationFr from "../../messages/fr/reservation.json";
import commonFr from "../../messages/fr/common.json";

interface ClientReservationFormProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

// /client/dashboard lives outside the [locale] segment (not translated yet),
// but reuses ReservationForm, which now depends on the next-intl context.
// This provides a static French-only context for it there.
export function ClientReservationForm(props: ClientReservationFormProps) {
  return (
    <NextIntlClientProvider locale="fr" messages={{ reservation: reservationFr, ...commonFr }}>
      <ReservationForm {...props} />
    </NextIntlClientProvider>
  );
}

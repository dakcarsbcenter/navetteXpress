import { getTranslations } from "next-intl/server";
import { Phone, WhatsappLogo, CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { CONTACT_PHONE_E164, whatsappHref } from "@/lib/contact";

/**
 * Barre d'action collée en bas d'écran sur mobile (Appeler / WhatsApp /
 * Réserver), bouton WhatsApp flottant sur ordinateur. Sur mobile, le numéro
 * n'était visible nulle part en haut de page (barre supérieure masquée).
 *
 * Pur HTML, aucun JavaScript : les clics sont comptés par ContactTracking
 * (délégation sur tel: et wa.me). À ne pas poser sur /reservation, où elle
 * recouvrirait les boutons du formulaire. Le bandeau cookies (z-[90]) passe
 * au-dessus tant qu'il est affiché.
 */
export async function MobileContactBar({
  locale,
  bookingHref = "/reservation",
  whatsappMessage,
}: {
  locale: string;
  bookingHref?: string;
  whatsappMessage?: string;
}) {
  const t = await getTranslations({ locale, namespace: "MoneyPage.bar" });
  const waHref = whatsappHref(whatsappMessage);

  return (
    <>
      {/* Réserve la hauteur de la barre pour qu'elle ne masque pas le bas du pied de page */}
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label={t("book")}
        className="md:hidden fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <a href={`tel:${CONTACT_PHONE_E164}`} data-track="mobile-bar" className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold text-foreground">
          <Phone size={20} weight="fill" className="text-accent" aria-hidden />
          {t("call")}
        </a>
        <a href={waHref} target="_blank" rel="noopener noreferrer" data-track="mobile-bar" className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold text-foreground">
          <WhatsappLogo size={20} weight="fill" className="text-[#1E8E4E]" aria-hidden />
          {t("whatsapp")}
        </a>
        <Link href={bookingHref} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold bg-accent text-white">
          <CalendarCheck size={20} weight="fill" aria-hidden />
          {t("book")}
        </Link>
      </nav>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        data-track="floating-whatsapp"
        aria-label={t("whatsapp")}
        className="hidden md:flex fixed right-6 bottom-6 z-50 h-14 w-14 items-center justify-center rounded-full bg-[#1E8E4E] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <WhatsappLogo size={30} weight="fill" aria-hidden />
      </a>
    </>
  );
}

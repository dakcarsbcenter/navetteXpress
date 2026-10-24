"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";
import { trackContactClick } from "@/lib/analytics";

/**
 * Monté une fois dans le layout des pages publiques.
 *
 * - Mémorise la provenance de la visite (page d'entrée, UTM) pour la joindre à
 *   une éventuelle réservation.
 * - Suit les clics téléphone et WhatsApp par délégation : un seul écouteur couvre
 *   tous les liens `tel:` et `wa.me` du site, y compris ceux ajoutés plus tard,
 *   sans onClick à poser sur chacun. Une grande partie des réservations passe par
 *   ces deux canaux, invisibles sans cela.
 */
export function ContactTracking() {
  useEffect(() => {
    captureAttribution();

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const source = link.getAttribute("data-track") || window.location.pathname;
      if (href.startsWith("tel:")) trackContactClick("phone_call", source);
      else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) trackContactClick("whatsapp_click", source);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

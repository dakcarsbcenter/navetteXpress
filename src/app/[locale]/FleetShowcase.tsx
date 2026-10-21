"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { VehiclePhoto } from "@/components/fleet/VehiclePhoto";
import { Link } from "@/i18n/navigation";
import type { PublicVehicle } from "@/lib/public-catalog";
import { ArrowRight, UserCircle, Van } from "@phosphor-icons/react";

/**
 * Ilot client isole de la home : affiche la flotte lue cote serveur et gere
 * le carrousel auto-defilant. Le titre de section et le CTA "voir tout"
 * restent statiques (rendus cote serveur dans HomeClient.tsx).
 */
export function FleetShowcase({ vehicles }: { vehicles: PublicVehicle[] }) {
  const t = useTranslations("home");
  const tFleet = useTranslations("flotte");
  const carouselRef = useRef<HTMLDivElement>(null);
  // Libelle du type de vehicule quand l'admin n'a pas saisi de categorie : sans
  // cette table, la valeur brute de l'enum ("luxury") s'affichait sur la carte.
  const categoryLabels: Record<string, string> = {
    sedan: tFleet("categories.sedan"),
    luxury: tFleet("categories.luxury"),
    suv: tFleet("categories.suv"),
    van: tFleet("categories.van"),
    bus: tFleet("categories.bus"),
  };
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    if (isCarouselHovered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth, children } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const firstChild = children[0] as HTMLElement;
          const scrollAmount = firstChild ? firstChild.offsetWidth + 32 : 400; // gap-8 = 32px
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isCarouselHovered, vehicles]);

  if (vehicles.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="font-[family-name:var(--font-ibm-plex-mono)] text-sm tracking-[0.16em] uppercase text-text-muted">
          {t("fleet.empty")}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={carouselRef}
      onMouseEnter={() => setIsCarouselHovered(true)}
      onMouseLeave={() => setIsCarouselHovered(false)}
      onFocus={() => setIsCarouselHovered(true)}
      onBlur={() => setIsCarouselHovered(false)}
      className="flex gap-8 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {vehicles.map((vehicle, i) => (
        <div
          key={vehicle.id || i}
          className="min-w-[85vw] md:min-w-[360px] flex-shrink-0 snap-center rounded-lg bg-white border border-[#e2dacd] flex flex-col overflow-hidden"
        >
          <div className="h-56 relative overflow-hidden">
            <VehiclePhoto
              src={vehicle.photo || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800'}
              alt={`${vehicle.make} ${vehicle.model}`}
              sizes="(max-width: 768px) 85vw, 360px"
              className="object-cover"
            />
            <div className="absolute top-3 right-3 px-3 py-1 rounded bg-background border border-[#e2dacd] text-gold-deep text-[10px] font-semibold uppercase tracking-[0.1em]">
              {vehicle.category || categoryLabels[vehicle.vehicleType] || tFleet("categories.default")}
            </div>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-foreground">{vehicle.make} {vehicle.model}</h3>
            <div className="flex items-center gap-6 text-text-muted text-sm">
              <div className="flex items-center gap-2">
                <UserCircle size={16} weight="light" className="text-accent" />
                <span>{vehicle.capacity || 4} {t("fleet.pax")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Van size={16} weight="light" className="text-accent" />
                <span>{t("fleet.luggageIncluded")}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#e2dacd]">
              <div>
                <div className="text-text-muted text-[10px] uppercase tracking-[0.14em] mb-1">{t("fleet.from")}</div>
                <div className="text-foreground font-semibold text-lg">{t("fleet.onRequest")}</div>
              </div>
              <Link
                href="/reservation"
                className="w-11 h-11 rounded-full border border-[#e2dacd] flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors"
                aria-label={t("fleet.bookVehicleAria")}
              >
                <ArrowRight size={18} weight="regular" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

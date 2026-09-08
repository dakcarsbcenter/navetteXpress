"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { fetchPublicApi } from "@/lib/apiClient";
import { ArrowRight, UserCircle, Van } from "@phosphor-icons/react";

/**
 * Ilot client isole de la home : recupere la flotte via l'API et gere le
 * carrousel auto-defilant. Le titre de section et le CTA "voir tout"
 * restent statiques (rendus cote serveur dans HomeClient.tsx).
 */
export function FleetShowcase() {
  const t = useTranslations("home");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetchPublicApi('/api/vehicles');
        const data = await response.json();
        setVehicles(data.data || []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (loading || isCarouselHovered) return;
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
  }, [loading, isCarouselHovered, vehicles]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="font-[family-name:var(--font-ibm-plex-mono)] text-sm tracking-[0.16em] uppercase text-text-muted">
          {t("fleet.loading")}
        </div>
      </div>
    );
  }

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
      className="flex gap-8 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {vehicles.map((vehicle: any, i: number) => (
        <div
          key={vehicle.id || i}
          className="min-w-[85vw] md:min-w-[360px] flex-shrink-0 snap-center rounded-lg bg-white border border-[#e2dacd] flex flex-col overflow-hidden"
        >
          <div className="h-56 relative overflow-hidden">
            <Image
              src={vehicle.photo || vehicle.image || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800'}
              alt={`${vehicle.make} ${vehicle.model}`}
              width={600}
              height={400}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 px-3 py-1 rounded bg-background border border-[#e2dacd] text-gold text-[10px] font-semibold uppercase tracking-[0.1em]">
              {vehicle.category || vehicle.vehicleType || t("fleet.categories.vip")}
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
                {vehicle.price ? (
                  <div className="text-foreground font-semibold text-lg font-[family-name:var(--font-ibm-plex-mono)]">
                    {vehicle.price} <span className="text-xs text-text-muted font-normal">FCFA</span>
                  </div>
                ) : (
                  <div className="text-foreground font-semibold text-lg">{t("fleet.onRequest")}</div>
                )}
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

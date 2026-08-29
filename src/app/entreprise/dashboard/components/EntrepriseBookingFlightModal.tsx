"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Airplane, ArrowSquareOut } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Booking } from "../types";

const FLIGHT_LIVE_TRACKING_URL = "https://www.skyscanner.fr/vols/arrivees-departs/dss/blaise-diagne-international-arrivees-departs";

interface EntrepriseBookingFlightModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EntrepriseBookingFlightModal({ booking, isOpen, onClose, onSuccess }: EntrepriseBookingFlightModalProps) {
  const t = useTranslations("entreprise.schedule.flight");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [flightInfo, setFlightInfo] = useState<Pick<Booking, "flightStatus" | "flightLastCheckedAt"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking && isOpen) {
      setFlightNumber(booking.flightNumber || "");
      setAirline(booking.airline || "");
      setFlightInfo({ flightStatus: booking.flightStatus, flightLastCheckedAt: booking.flightLastCheckedAt });
      setError(null);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const flightCooldownActive = Boolean(
    flightInfo?.flightLastCheckedAt &&
    Date.now() - new Date(flightInfo.flightLastCheckedAt).getTime() < 15 * 60 * 1000
  );

  const handleSave = async () => {
    if (!flightNumber.trim()) {
      setError(t("numberRequired"));
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/flights/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber: flightNumber.trim(), airline: airline.trim() }),
      });
      const result = await response.json();
      if (result.success) {
        setFlightInfo(result.data);
        onSuccess();
      } else {
        setError(result.error || t("genericError"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`/api/flights/${booking.id}`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        setFlightInfo(result.data);
        onSuccess();
      } else {
        setError(result.error || t("genericError"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-[95vw] max-w-md bg-white rounded border border-border overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Airplane size={18} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#6E6A63]">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6E6A63]">{t("numberLabel")}</label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder={t("numberPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded bg-[#F7F3EC] text-sm text-foreground focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6E6A63]">{t("airlineLabel")}</label>
            <input
              type="text"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              placeholder={t("airlinePlaceholder")}
              className="w-full px-3 py-2 border border-border rounded bg-[#F7F3EC] text-sm text-foreground focus:outline-none"
            />
          </div>

          {booking.flightNumber && (
            <div className="flex items-center justify-between gap-2">
              <StatusBadge domain="flight" value={flightInfo?.flightStatus || "unknown"} audience="client" live={flightInfo?.flightStatus === "active"} />
              <span className="text-xs text-[#6E6A63]">
                {flightInfo?.flightLastCheckedAt
                  ? t("lastChecked", { time: new Date(flightInfo.flightLastCheckedAt).toLocaleString() })
                  : t("neverChecked")}
              </span>
            </div>
          )}

          {error && <p className="text-xs font-medium" style={{ color: "#B8493C" }}>{error}</p>}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded bg-[#1F5245] text-white disabled:opacity-50"
            >
              {isSaving ? t("saving") : t("saveButton")}
            </button>
            {booking.flightNumber && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || flightCooldownActive}
                className="px-4 py-2 text-xs font-bold rounded border border-[#1F5245] text-[#1F5245] disabled:opacity-50"
              >
                {isRefreshing ? t("refreshing") : t("refreshButton")}
              </button>
            )}
          </div>

          <a
            href={FLIGHT_LIVE_TRACKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1F5245]"
          >
            {t("cta")} <ArrowSquareOut size={14} />
          </a>
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#6E6A63] border border-border rounded">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

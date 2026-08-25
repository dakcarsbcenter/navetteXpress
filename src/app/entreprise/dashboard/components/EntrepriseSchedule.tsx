"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { toIntlLocale } from "@/lib/intl-locale";
import type { Booking } from "../types";

type Period = "day" | "week" | "month" | "year";

function getRange(period: Period, anchor: Date): [Date, Date] {
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return [start, end];
}

function shiftAnchor(period: Period, anchor: Date, dir: 1 | -1): Date {
  const next = new Date(anchor);
  if (period === "day") next.setDate(next.getDate() + dir);
  else if (period === "week") next.setDate(next.getDate() + dir * 7);
  else if (period === "month") next.setMonth(next.getMonth() + dir);
  else next.setFullYear(next.getFullYear() + dir);
  return next;
}

function formatRangeLabel(period: Period, anchor: Date, intlLocale: string): string {
  const [start, end] = getRange(period, anchor);

  if (period === "day") {
    return anchor.toLocaleDateString(intlLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (period === "week") {
    return `${start.toLocaleDateString(intlLocale, { day: "2-digit", month: "short" })} – ${end.toLocaleDateString(intlLocale, { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (period === "month") {
    return anchor.toLocaleDateString(intlLocale, { month: "long", year: "numeric" });
  }
  return String(anchor.getFullYear());
}

export function EntrepriseSchedule({ bookings }: { bookings: Booking[] }) {
  const t = useTranslations("entreprise.schedule");
  const tStatus = useTranslations("entreprise.schedule.status");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const [period, setPeriod] = useState<Period>("month");
  const [anchor, setAnchor] = useState(new Date());

  const [start, end] = useMemo(() => getRange(period, anchor), [period, anchor]);

  const items = useMemo(() => {
    return bookings
      .filter((b) => {
        const d = new Date(b.scheduledDateTime);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime());
  }, [bookings, start, end]);

  const periods: Period[] = ["day", "week", "month", "year"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-white p-1">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                period === p ? "bg-[#12100E] text-white" : "text-[#6E6A63] hover:text-[#12100E]"
              }`}
            >
              {t(`periods.${p}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor((a) => shiftAnchor(period, a, -1))}
            aria-label={t("prev")}
            className="h-8 w-8 inline-flex items-center justify-center rounded border border-border bg-white text-[#6E6A63] hover:text-[#12100E]"
          >
            <CaretLeft size={14} />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[170px] text-center capitalize">
            {formatRangeLabel(period, anchor, intlLocale)}
          </span>
          <button
            type="button"
            onClick={() => setAnchor((a) => shiftAnchor(period, a, 1))}
            aria-label={t("next")}
            className="h-8 w-8 inline-flex items-center justify-center rounded border border-border bg-white text-[#6E6A63] hover:text-[#12100E]"
          >
            <CaretRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="text-xs text-accent font-semibold ml-1 hover:text-[#12100E]"
          >
            {t("today")}
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-5 py-3 border-b-2 border-[#12100E] text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.12em] text-[#6E6A63] uppercase">
          <span>{t("columns.date")}</span>
          <span>{t("columns.trip")}</span>
          <span>{t("columns.status")}</span>
          <span className="text-right">{t("columns.amount")}</span>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#6E6A63]">{t("empty")}</div>
        ) : (
          items.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-5 py-3 border-b border-border last:border-0 text-sm items-center"
            >
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                {new Date(b.scheduledDateTime).toLocaleDateString(intlLocale, { day: "2-digit", month: "2-digit", year: period === "year" ? undefined : "numeric" })}
              </span>
              <span className="text-foreground truncate pr-4">
                {b.pickupAddress} → {b.dropoffAddress}
              </span>
              <span className="text-xs font-medium text-[#6E6A63]">{tStatus(b.status)}</span>
              <span className="text-right font-medium text-foreground font-[family-name:var(--font-ibm-plex-mono)]">
                {b.price ? Number.parseFloat(b.price).toLocaleString(intlLocale) : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

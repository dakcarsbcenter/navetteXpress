"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Van, Coins, Clock, CheckCircle } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toIntlLocale } from "@/lib/intl-locale";
import type { Booking, Profile } from "../types";

type Period = "day" | "week" | "month" | "year";

function getPeriodRange(period: Period, now: Date): [Date, Date] {
  const start = new Date(now);
  const end = new Date(now);

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

function priceOf(booking: Booking): number {
  return booking.price ? Number.parseFloat(booking.price) : 0;
}

export function EntrepriseOverview({
  profile,
  companyTypeLabels,
  bookings,
}: {
  profile: Profile;
  companyTypeLabels: Record<string, string>;
  bookings: Booking[];
}) {
  const t = useTranslations("entreprise.overview");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const [period, setPeriod] = useState<Period>("month");

  const periodStats = useMemo(() => {
    const now = new Date();
    const [start, end] = getPeriodRange(period, now);
    const inPeriod = bookings.filter((b) => {
      const d = new Date(b.scheduledDateTime);
      return d >= start && d <= end;
    });

    return {
      trips: inPeriod.length,
      amount: inPeriod.reduce((sum, b) => sum + priceOf(b), 0),
      pending: inPeriod.filter((b) => b.status === "pending").length,
      completed: inPeriod.filter((b) => b.status === "completed").length,
    };
  }, [bookings, period]);

  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleDateString(intlLocale, { month: "short" }),
      trips: 0,
    }));

    bookings.forEach((b) => {
      const d = new Date(b.scheduledDateTime);
      if (d.getFullYear() === year) {
        months[d.getMonth()].trips += 1;
      }
    });

    return months;
  }, [bookings, intlLocale]);

  const monthlyTrips = bookings.filter((b) => {
    const d = new Date(b.scheduledDateTime);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const periods: Period[] = ["day", "week", "month", "year"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <div className="space-y-6">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded p-4">
            <div className="flex items-center gap-2 text-[#6E6A63] mb-2">
              <Van size={16} weight="light" />
              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-wide uppercase">{t("stats.trips")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{periodStats.trips}</p>
          </div>
          <div className="bg-white border border-border rounded p-4">
            <div className="flex items-center gap-2 text-[#6E6A63] mb-2">
              <Coins size={16} weight="light" />
              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-wide uppercase">{t("stats.amount")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{periodStats.amount.toLocaleString(intlLocale)} FCFA</p>
          </div>
          <div className="bg-white border border-border rounded p-4">
            <div className="flex items-center gap-2 text-[#6E6A63] mb-2">
              <Clock size={16} weight="light" />
              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-wide uppercase">{t("stats.pending")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{periodStats.pending}</p>
          </div>
          <div className="bg-white border border-border rounded p-4">
            <div className="flex items-center gap-2 text-[#6E6A63] mb-2">
              <CheckCircle size={16} weight="light" />
              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-wide uppercase">{t("stats.completed")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{periodStats.completed}</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t("chartTitle")}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid stroke="#e2e8f0" strokeOpacity={0.6} vertical={false} />
                <XAxis dataKey="month" stroke="#6E6A63" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6E6A63" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Bar dataKey="trips" fill="#12100E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[#12100E] rounded p-5 space-y-3">
          <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#9a938a] uppercase block">
            {t("accountCard.title")}
          </span>
          <div className="h-px bg-[#2e2b27]" />
          <div className="flex flex-col gap-2 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
            <div className="flex justify-between">
              <span className="uppercase">{t("accountCard.type")}</span>
              <span className="text-white">{profile.companyType ? companyTypeLabels[profile.companyType] : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase">{t("accountCard.tripsThisMonth")}</span>
              <span className="text-white">{monthlyTrips}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

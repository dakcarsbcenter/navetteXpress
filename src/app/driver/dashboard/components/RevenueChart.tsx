"use client"

import { useLocale, useTranslations } from "next-intl"
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { RevenueChartProps, RevenuePoint } from "@/types/dashboard"
import { toIntlLocale } from "@/lib/intl-locale"

export function RevenueChart({ data }: RevenueChartProps) {
  const t = useTranslations("driver.home.revenueChart")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const days = t.raw("days") as string[]

  const defaultData: RevenuePoint[] = [
    { day: days[0], value: 12000 },
    { day: days[1], value: 18000 },
    { day: days[2], value: 14000 },
    { day: days[3], value: 21000 },
    { day: days[4], value: 26000 },
    { day: days[5], value: 30000 },
    { day: days[6], value: 19000 },
  ]

  const chartData = data ?? defaultData

  return (
    <section className="driver-dashboard-card rounded-2xl border border-(--border) bg-(--bg-card) p-6">
      <h3 className="mb-4 font-heading text-lg font-bold text-(--text-primary)">{t("title")}</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
            <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
              }}
              formatter={(value) => `${Number(value).toLocaleString(intlLocale)} F`}
            />
            <Line type="monotone" dataKey="value" stroke="#f5a623" strokeWidth={3} dot={{ r: 3, fill: "#f5a623" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

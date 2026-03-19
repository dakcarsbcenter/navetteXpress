"use client"

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { RevenueChartProps, RevenuePoint } from "@/types/dashboard"

const defaultData: RevenuePoint[] = [
  { day: "LUN", value: 12000 },
  { day: "MAR", value: 18000 },
  { day: "MER", value: 14000 },
  { day: "JEU", value: 21000 },
  { day: "VEN", value: 26000 },
  { day: "SAM", value: 30000 },
  { day: "DIM", value: 19000 },
]

export function RevenueChart({ data = defaultData }: RevenueChartProps) {
  return (
    <section className="driver-dashboard-card rounded-2xl border border-(--border) bg-(--bg-card) p-6">
      <h3 className="mb-4 font-heading text-lg font-bold text-(--text-primary)">Évolution des Revenus</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              formatter={(value) => `${Number(value).toLocaleString("fr-FR")} F`}
            />
            <Line type="monotone" dataKey="value" stroke="#f5a623" strokeWidth={3} dot={{ r: 3, fill: "#f5a623" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

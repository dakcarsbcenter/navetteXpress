"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash, X } from "@phosphor-icons/react";

type Recurrence = "weekly" | "monthly" | "custom";

interface TripPlan {
  id: number;
  pickupAddress: string;
  dropoffAddress: string;
  time: string;
  recurrence: Recurrence | "once";
  startDate: string;
  endDate: string | null;
  status: "active" | "completed" | "cancelled";
  totalOccurrences: number;
  pendingCount: number;
  cancelledCount: number;
}

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EntreprisePlanning({ onPlanChanged }: { onPlanChanged: () => void }) {
  const t = useTranslations("entreprise.planningTab");
  const tForm = useTranslations("entreprise.planningTab.form");
  const tErrors = useTranslations("entreprise.planningTab.errors");
  const tRecurrence = useTranslations("entreprise.planningTab.recurrenceLabels");
  const tStatus = useTranslations("entreprise.planningTab.statusLabels");
  const daysShort = tForm.raw("daysShort") as string[];

  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [time, setTime] = useState("08:00");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [dateToAdd, setDateToAdd] = useState(todayIso());

  const maxEndDate = useMemo(() => {
    const d = new Date(startDate || todayIso());
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  }, [startDate]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await fetch("/api/entreprise/trip-plans");
      const data = await res.json();
      if (data.success) setPlans(data.plans || []);
    } catch (error) {
      console.error("Erreur lors du chargement des planifications:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const addCustomDate = () => {
    if (!dateToAdd) return;
    setCustomDates((prev) => (prev.includes(dateToAdd) ? prev : [...prev, dateToAdd].sort()));
  };

  const removeCustomDate = (date: string) => {
    setCustomDates((prev) => prev.filter((d) => d !== date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (recurrence === "weekly" && daysOfWeek.length === 0) {
      setFeedback({ type: "error", message: tErrors("noDays") });
      return;
    }
    if (recurrence === "custom" && customDates.length === 0) {
      setFeedback({ type: "error", message: tErrors("noDates") });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/entreprise/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          dropoffAddress,
          time,
          passengers,
          luggage,
          notes,
          recurrence,
          daysOfWeek: recurrence === "weekly" ? daysOfWeek : undefined,
          dayOfMonth: recurrence === "monthly" ? dayOfMonth : undefined,
          customDates: recurrence === "custom" ? customDates : undefined,
          startDate: recurrence === "custom" ? customDates[0] : startDate,
          endDate: recurrence === "custom" ? undefined : endDate || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        const key = ["maxSpan", "maxOccurrences", "noDates", "noDays"].includes(data.error) ? data.error : "generic";
        setFeedback({ type: "error", message: key === "maxOccurrences" ? tErrors("maxOccurrences", { max: 400 }) : tErrors(key) });
        return;
      }

      setFeedback({ type: "success", message: t("success", { count: data.occurrencesCount }) });
      setPickupAddress("");
      setDropoffAddress("");
      setNotes("");
      setCustomDates([]);
      await loadPlans();
      onPlanChanged();
    } catch (error) {
      console.error("Erreur lors de la planification:", error);
      setFeedback({ type: "error", message: tErrors("generic") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPlan = async (planId: number) => {
    if (!window.confirm(t("cancelConfirm"))) return;
    try {
      const res = await fetch(`/api/entreprise/trip-plans/${planId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await loadPlans();
        onPlanChanged();
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
      <div className="bg-white border border-border rounded p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-foreground mb-1">{t("title")}</h3>
          <p className="text-sm text-[#6E6A63]">{t("description")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("pickup")}</label>
              <input
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("dropoff")}</label>
              <input
                required
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("time")}</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("passengers")}</label>
              <input
                type="number"
                min={1}
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("luggage")}</label>
              <input
                type="number"
                min={0}
                value={luggage}
                onChange={(e) => setLuggage(Number(e.target.value))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("recurrenceType")}</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="weekly">{tForm("recurrenceWeekly")}</option>
              <option value="monthly">{tForm("recurrenceMonthly")}</option>
              <option value="custom">{tForm("recurrenceCustom")}</option>
            </select>
          </div>

          {recurrence === "weekly" && (
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-2">{tForm("daysOfWeek")}</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_INDICES.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`h-9 w-12 rounded text-xs font-semibold border transition-colors ${
                      daysOfWeek.includes(day)
                        ? "bg-[#12100E] text-white border-[#12100E]"
                        : "bg-white text-[#6E6A63] border-border hover:border-[#12100E]"
                    }`}
                  >
                    {daysShort[day]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrence === "monthly" && (
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("dayOfMonth")}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-32 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

          {recurrence !== "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("startDate")}</label>
                <input
                  type="date"
                  required
                  min={todayIso()}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("endDate")}</label>
                <input
                  type="date"
                  required
                  min={startDate}
                  max={maxEndDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#6E6A63] mb-2">{tForm("customDates")}</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  min={todayIso()}
                  value={dateToAdd}
                  onChange={(e) => setDateToAdd(e.target.value)}
                  className="flex-1 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={addCustomDate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#12100E] text-white text-xs font-semibold"
                >
                  <Plus size={14} /> {tForm("addDate")}
                </button>
              </div>
              {customDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 bg-[#F7F3EC] border border-border rounded px-2 py-1 text-xs">
                      {d}
                      <button type="button" onClick={() => removeCustomDate(d)} aria-label={tForm("removeDate")}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#6E6A63] mb-1">{tForm("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {feedback && (
            <div className={`text-sm rounded px-3 py-2 ${feedback.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
              {feedback.message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {submitting ? tForm("submitting") : tForm("submit")}
          </button>
        </form>
      </div>

      <div className="bg-white border border-border rounded p-6">
        <h3 className="text-base font-bold text-foreground mb-4">{t("listTitle")}</h3>
        {loadingPlans ? null : plans.length === 0 ? (
          <p className="text-sm text-[#6E6A63]">{t("empty")}</p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-border rounded p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {plan.pickupAddress} → {plan.dropoffAddress}
                    </p>
                    <p className="text-xs text-[#6E6A63] mt-1">
                      {tRecurrence(plan.recurrence)} · {plan.time} · {t("occurrences", { count: plan.totalOccurrences })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-1 rounded ${
                      plan.status === "active"
                        ? "bg-green-50 text-green-700"
                        : plan.status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tStatus(plan.status)}
                  </span>
                </div>
                {plan.status === "active" && (
                  <button
                    type="button"
                    onClick={() => handleCancelPlan(plan.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    <Trash size={12} /> {t("cancel")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

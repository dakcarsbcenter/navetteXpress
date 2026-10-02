"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarBlank, Plus, Trash, X } from "@phosphor-icons/react"
import {
  DEFAULT_END,
  DEFAULT_START,
  buildWeekDrafts,
  isFullDayException,
  isValidRange,
  sortExceptions,
  toInputTime,
  weekdayName,
  type WeekDayDraft,
} from "@/lib/driver-availability-shared"
import type { DriverAvailabilityRow } from "@/types/dashboard"

/**
 * Edition du planning d'un chauffeur par l'admin. Les libelles sont en francais
 * en dur, comme le reste de UsersManagement qui n'est pas encore traduit.
 */

interface DriverAvailabilityModalProps {
  driver: { id: string; name: string }
  onClose: () => void
  /** Appele apres une ecriture reussie, pour rafraichir le resume de la liste. */
  onSaved: () => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
}

interface AvailabilityPayload {
  weekly: WeekDayDraft[]
  exceptions: DriverAvailabilityRow[]
}

const LOCALE = "fr-FR"

const label: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: "9.5px",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#1F5245",
  marginBottom: "8px",
}

const timeInput: React.CSSProperties = {
  height: "38px",
  padding: "0 12px",
  border: "1px solid #E2DACD",
  borderRadius: "3px",
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  color: "#12100E",
  background: "#FFFFFF",
}

export function DriverAvailabilityModal({
  driver,
  onClose,
  onSaved,
  showSuccess,
  showError,
}: DriverAvailabilityModalProps) {
  const [weekly, setWeekly] = useState<WeekDayDraft[]>(() => buildWeekDrafts([]))
  const [exceptions, setExceptions] = useState<DriverAvailabilityRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingWeek, setIsSavingWeek] = useState(false)
  const [isAddingException, setIsAddingException] = useState(false)
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null)

  const [showExceptionForm, setShowExceptionForm] = useState(false)
  const [exceptionDate, setExceptionDate] = useState("")
  const [exceptionKind, setExceptionKind] = useState<"unavailable" | "available">("unavailable")
  const [exceptionFullDay, setExceptionFullDay] = useState(true)
  const [exceptionStart, setExceptionStart] = useState(DEFAULT_START)
  const [exceptionEnd, setExceptionEnd] = useState(DEFAULT_END)
  const [exceptionNotes, setExceptionNotes] = useState("")

  const basePath = `/api/admin/drivers/${driver.id}/availability`

  const applyPayload = useCallback((payload: AvailabilityPayload) => {
    setWeekly(payload.weekly)
    setExceptions(payload.exceptions)
  }, [])

  const load = useCallback(async () => {
    try {
      const response = await fetch(basePath, { cache: "no-store" })
      const json = await response.json()
      if (!response.ok || !json.success) {
        showError(json.error || "Impossible de charger le planning", "Erreur")
        return
      }
      applyPayload(json.data)
    } catch {
      showError("Erreur technique lors du chargement du planning", "Erreur")
    } finally {
      setIsLoading(false)
    }
  }, [basePath, applyPayload, showError])

  useEffect(() => {
    load()
  }, [load])

  const invalidDay = useMemo(
    () => weekly.find((day) => day.isOpen && !isValidRange(day.start, day.end)),
    [weekly]
  )

  const openCount = weekly.filter((day) => day.isOpen).length

  const toggleDay = (dayOfWeek: number) => {
    setWeekly((prev) => prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, isOpen: !day.isOpen } : day)))
  }

  const changeTime = (dayOfWeek: number, field: "start" | "end", value: string) => {
    setWeekly((prev) => prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day)))
  }

  const saveWeek = async () => {
    if (invalidDay) return
    setIsSavingWeek(true)
    try {
      const response = await fetch(basePath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly: weekly.map(({ dayOfWeek, isOpen, start, end }) => ({ dayOfWeek, isOpen, start, end })),
        }),
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        showError(json.error || "Erreur lors de l'enregistrement", "Erreur")
        return
      }
      applyPayload(json.data)
      showSuccess(`Planning de ${driver.name} mis à jour`, "Succès")
      onSaved()
    } catch {
      showError("Erreur technique lors de l'enregistrement", "Erreur")
    } finally {
      setIsSavingWeek(false)
    }
  }

  const resetExceptionForm = () => {
    setExceptionDate("")
    setExceptionKind("unavailable")
    setExceptionFullDay(true)
    setExceptionStart(DEFAULT_START)
    setExceptionEnd(DEFAULT_END)
    setExceptionNotes("")
    setShowExceptionForm(false)
  }

  const addException = async () => {
    if (!exceptionDate) return
    if (!exceptionFullDay && !isValidRange(exceptionStart, exceptionEnd)) {
      showError("L'heure de début doit précéder l'heure de fin", "Erreur")
      return
    }
    setIsAddingException(true)
    try {
      const response = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specificDate: exceptionDate,
          isAvailable: exceptionKind === "available",
          fullDay: exceptionFullDay,
          start: exceptionStart,
          end: exceptionEnd,
          notes: exceptionNotes,
        }),
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        showError(json.error || "Erreur lors de l'ajout de l'exception", "Erreur")
        return
      }
      resetExceptionForm()
      await load()
      showSuccess("Exception ajoutée", "Succès")
      onSaved()
    } catch {
      showError("Erreur technique lors de l'ajout de l'exception", "Erreur")
    } finally {
      setIsAddingException(false)
    }
  }

  const removeException = async (rowId: number) => {
    setDeletingRowId(rowId)
    try {
      const response = await fetch(`${basePath}?rowId=${rowId}`, { method: "DELETE" })
      const json = await response.json()
      if (!response.ok || !json.success) {
        showError(json.error || "Erreur lors de la suppression", "Erreur")
        return
      }
      await load()
      showSuccess("Exception supprimée", "Succès")
      onSaved()
    } catch {
      showError("Erreur technique lors de la suppression", "Erreur")
    } finally {
      setDeletingRowId(null)
    }
  }

  const sortedExceptions = sortExceptions(exceptions)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(18,16,14,.55)" }}>
      <div
        className="relative w-full max-w-3xl"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* En-tete */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "20px 24px", borderBottom: "1px solid #E2DACD" }}>
          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B4643A" }}>
              Planning chauffeur
            </span>
            <h3 style={{ margin: "6px 0 0", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em", color: "#12100E" }}>{driver.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            style={{ display: "grid", placeItems: "center", width: "30px", height: "30px", border: "1px solid #E2DACD", borderRadius: "3px", color: "#6E6A63", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "26px" }}>
          {isLoading ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#9a938a", fontStyle: "italic" }}>Chargement du planning…</p>
          ) : (
            <>
              {/* Semaine recurrente */}
              <section>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <span style={label}>Semaine type</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6A63" }}>
                    {openCount === 0 ? "Aucun jour travaillé" : `${openCount} jour${openCount > 1 ? "s" : ""} / semaine`}
                  </span>
                </div>

                <div style={{ border: "1px solid #E2DACD", borderRadius: "3px" }}>
                  {weekly.map((day, index) => {
                    const dayInvalid = day.isOpen && !isValidRange(day.start, day.end)
                    return (
                      <div
                        key={day.dayOfWeek}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          padding: "12px 16px",
                          borderBottom: index === weekly.length - 1 ? "none" : "1px solid #F0EAE0",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDay(day.dayOfWeek)}
                          aria-pressed={day.isOpen}
                          style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: "none", cursor: "pointer", padding: 0, minWidth: "150px" }}
                        >
                          <span style={{ display: "block", width: "44px", height: "26px", borderRadius: "13px", background: day.isOpen ? "#1F5245" : "#D8CFC0", position: "relative", flexShrink: 0, transition: "background .2s" }}>
                            <span style={{ position: "absolute", top: "3px", left: day.isOpen ? "21px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#FFFFFF", transition: "left .2s" }} />
                          </span>
                          <span style={{ fontSize: "13.5px", fontWeight: 600, color: day.isOpen ? "#12100E" : "#6E6A63", textTransform: "capitalize" }}>
                            {weekdayName(day.dayOfWeek, LOCALE)}
                          </span>
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <input
                            type="time"
                            value={day.start}
                            disabled={!day.isOpen}
                            onChange={(e) => changeTime(day.dayOfWeek, "start", e.target.value)}
                            style={{
                              ...timeInput,
                              border: `1px solid ${dayInvalid ? "#B8493C" : day.isOpen ? "#E2DACD" : "#EFE8DC"}`,
                              color: day.isOpen ? "#12100E" : "#9a938a",
                              background: day.isOpen ? "#FFFFFF" : "#F7F3EC",
                            }}
                          />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6E6A63" }}>→</span>
                          <input
                            type="time"
                            value={day.end}
                            disabled={!day.isOpen}
                            onChange={(e) => changeTime(day.dayOfWeek, "end", e.target.value)}
                            style={{
                              ...timeInput,
                              border: `1px solid ${dayInvalid ? "#B8493C" : day.isOpen ? "#E2DACD" : "#EFE8DC"}`,
                              color: day.isOpen ? "#12100E" : "#9a938a",
                              background: day.isOpen ? "#FFFFFF" : "#F7F3EC",
                            }}
                          />
                        </div>

                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: day.isOpen ? "#1F5245" : "#6E6A63", marginLeft: "auto" }}>
                          {day.isOpen ? "Disponible" : "Repos"}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {invalidDay && (
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#B8493C" }}>
                    {`${weekdayName(invalidDay.dayOfWeek, LOCALE)} : l'heure de début doit précéder l'heure de fin.`}
                  </p>
                )}

                {openCount === 0 && !invalidDay && (
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#B4643A" }}>
                    Sans aucun jour travaillé, ce chauffeur sera considéré indisponible et ne pourra pas être assigné.
                  </p>
                )}

                <button
                  type="button"
                  onClick={saveWeek}
                  disabled={isSavingWeek || Boolean(invalidDay)}
                  style={{
                    marginTop: "14px",
                    height: "42px",
                    padding: "0 18px",
                    background: "#1F5245",
                    border: "none",
                    borderRadius: "4px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: isSavingWeek ? "wait" : invalidDay ? "not-allowed" : "pointer",
                    opacity: isSavingWeek || invalidDay ? 0.6 : 1,
                  }}
                >
                  {isSavingWeek ? "Enregistrement…" : "Enregistrer la semaine"}
                </button>
              </section>

              {/* Exceptions datees */}
              <section>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <span style={label}>Exceptions datées</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6A63" }}>
                    Priment sur la semaine type
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sortedExceptions.length === 0 && !showExceptionForm && (
                    <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>Aucune exception enregistrée.</p>
                  )}

                  {sortedExceptions.map((exception) => {
                    const date = new Date(exception.specificDate ?? 0)
                    const fullDay = isFullDayException(exception)
                    const range = `${toInputTime(exception.startTime)} → ${toInputTime(exception.endTime)}`
                    const text = !exception.isAvailable && fullDay
                      ? "Indisponible toute la journée"
                      : exception.isAvailable
                        ? `Disponible ${range}`
                        : `Indisponible ${range}`

                    return (
                      <div key={exception.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", border: "1px solid #E2DACD", borderRadius: "3px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "44px", flexShrink: 0 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 600, lineHeight: 1 }}>
                            {date.getDate().toString().padStart(2, "0")}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
                            {date.toLocaleDateString(LOCALE, { month: "short" }).replace(".", "")}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: exception.isAvailable ? "#1F5245" : "#B8493C" }}>{text}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#6E6A63" }}>
                            {date.toLocaleDateString(LOCALE, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                          {exception.notes && <span style={{ fontSize: "12.5px", color: "#6E6A63", lineHeight: 1.45 }}>{exception.notes}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeException(exception.id)}
                          disabled={deletingRowId === exception.id}
                          title="Supprimer"
                          style={{ display: "grid", placeItems: "center", width: "32px", height: "32px", background: "transparent", border: "1px solid #E2DACD", borderRadius: "3px", color: "#B8493C", cursor: deletingRowId === exception.id ? "wait" : "pointer", flexShrink: 0 }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    )
                  })}

                  {showExceptionForm ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px", border: "1px solid #E2DACD", borderRadius: "3px" }}>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <input
                          type="date"
                          value={exceptionDate}
                          onChange={(e) => setExceptionDate(e.target.value)}
                          style={{ ...timeInput, flex: "1 1 160px" }}
                        />
                        <select
                          value={exceptionKind}
                          onChange={(e) => setExceptionKind(e.target.value as "unavailable" | "available")}
                          style={{ flex: "1 1 160px", height: "38px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E", background: "#FFFFFF" }}
                        >
                          <option value="unavailable">Indisponible</option>
                          <option value="available">Disponible exceptionnellement</option>
                        </select>
                      </div>

                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#3d3a35" }}>
                        <input
                          type="checkbox"
                          checked={exceptionFullDay}
                          onChange={(e) => setExceptionFullDay(e.target.checked)}
                          style={{ width: "15px", height: "15px", accentColor: "#1F5245" }}
                        />
                        Toute la journée
                      </label>

                      {!exceptionFullDay && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <input type="time" value={exceptionStart} onChange={(e) => setExceptionStart(e.target.value)} style={timeInput} />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6E6A63" }}>→</span>
                          <input type="time" value={exceptionEnd} onChange={(e) => setExceptionEnd(e.target.value)} style={timeInput} />
                        </div>
                      )}

                      <input
                        type="text"
                        value={exceptionNotes}
                        onChange={(e) => setExceptionNotes(e.target.value)}
                        placeholder="Motif (optionnel)"
                        style={{ height: "38px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E" }}
                      />

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={addException}
                          disabled={!exceptionDate || isAddingException}
                          style={{ flex: 1, height: "40px", background: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: isAddingException ? "wait" : "pointer", opacity: !exceptionDate || isAddingException ? 0.6 : 1 }}
                        >
                          {isAddingException ? "Ajout…" : "Ajouter"}
                        </button>
                        <button
                          type="button"
                          onClick={resetExceptionForm}
                          style={{ flex: 1, height: "40px", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowExceptionForm(true)}
                      className="inline-flex items-center justify-center gap-2"
                      style={{ height: "42px", background: "#FFFFFF", border: "1px dashed #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                    >
                      <Plus size={14} />
                      Ajouter une exception
                    </button>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Pied */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 24px", borderTop: "1px solid #E2DACD" }}>
          <span className="inline-flex items-center gap-2" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
            <CalendarBlank size={13} />
            Le chauffeur voit ce planning dans son espace
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ height: "40px", padding: "0 18px", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

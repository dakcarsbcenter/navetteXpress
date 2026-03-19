'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Minus, CalendarRange, Save, Clock3, ToggleLeft, ToggleRight } from 'lucide-react'
import { ContentCard, EmptyState, SectionHeader } from '@/components/driver/shared'

interface AvailabilityRow {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface DaySlot {
  start: string
  end: string
}

interface DayAvailability {
  key: string
  label: string
  apiDay: number
  slots: DaySlot[]
}

const DAYS: Array<{ key: string; label: string; apiDay: number }> = [
  { key: 'mon', label: 'Lundi', apiDay: 1 },
  { key: 'tue', label: 'Mardi', apiDay: 2 },
  { key: 'wed', label: 'Mercredi', apiDay: 3 },
  { key: 'thu', label: 'Jeudi', apiDay: 4 },
  { key: 'fri', label: 'Vendredi', apiDay: 5 },
  { key: 'sat', label: 'Samedi', apiDay: 6 },
  { key: 'sun', label: 'Dimanche', apiDay: 0 },
]

export function DriverAvailabilityCalendar() {
  const [isAvailable, setIsAvailable] = useState(true)
  const [days, setDays] = useState<DayAvailability[]>(() => DAYS.map((day) => ({ ...day, slots: [] })))
  const [existingRows, setExistingRows] = useState<AvailabilityRow[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/driver/availability')
        if (!response.ok) {
          setIsLoading(false)
          return
        }

        const result = await response.json()
        const rows: AvailabilityRow[] = Array.isArray(result?.data) ? result.data : []
        setExistingRows(rows)

        setDays((previous) => previous.map((day) => {
          const slots = rows
            .filter((row) => row.dayOfWeek === day.apiDay)
            .map((row) => ({ start: row.startTime.slice(0, 5), end: row.endTime.slice(0, 5) }))

          return {
            ...day,
            slots,
          }
        }))

        setIsAvailable(rows.length > 0)
      } catch (error) {
        console.error('Erreur disponibilité:', error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const totalSlots = useMemo(() => days.reduce((sum, day) => sum + day.slots.length, 0), [days])

  const addSlot = (index: number) => {
    setDays((previous) => previous.map((day, dayIndex) => {
      if (dayIndex !== index) return day
      return { ...day, slots: [...day.slots, { start: '08:00', end: '18:00' }] }
    }))
  }

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setDays((previous) => previous.map((day, idx) => {
      if (idx !== dayIndex) return day
      return { ...day, slots: day.slots.filter((_, index) => index !== slotIndex) }
    }))
  }

  const updateSlot = (dayIndex: number, slotIndex: number, key: 'start' | 'end', value: string) => {
    setDays((previous) => previous.map((day, idx) => {
      if (idx !== dayIndex) return day
      return {
        ...day,
        slots: day.slots.map((slot, index) => {
          if (index !== slotIndex) return slot
          return {
            ...slot,
            [key]: value,
          }
        }),
      }
    }))
  }

  const saveAvailability = async () => {
    setIsSaving(true)
    try {
      await Promise.all(existingRows.map((row) => fetch(`/api/driver/availability?id=${row.id}`, { method: 'DELETE' })))

      if (isAvailable) {
        const payloads = days.flatMap((day) => {
          return day.slots.map((slot) => ({
            dayOfWeek: day.apiDay,
            startTime: `${slot.start}:00`,
            endTime: `${slot.end}:00`,
            isAvailable: true,
          }))
        })

        await Promise.all(payloads.map((payload) => fetch('/api/driver/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })))
      }

      const refreshResponse = await fetch('/api/driver/availability')
      const refreshData = await refreshResponse.json()
      const rows: AvailabilityRow[] = Array.isArray(refreshData?.data) ? refreshData.data : []
      setExistingRows(rows)
    } catch (error) {
      console.error('Erreur sauvegarde disponibilité:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-20 md:pb-4">
      <SectionHeader title="DISPONIBILITÉS" subtitle="Définissez vos créneaux de la semaine" />

      <ContentCard title="Statut général" indicator={isAvailable ? 'green' : 'gold'}>
        <button
          onClick={() => setIsAvailable((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_60%,transparent)] px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-(--text-primary)">Je suis disponible</p>
            <p className="text-xs text-(--text-secondary)">
              {isAvailable ? 'Statut actif - visible par le dispatch' : 'Statut inactif - indisponible'}
            </p>
          </div>
          {isAvailable ? <ToggleRight size={34} className="text-(--accent)" /> : <ToggleLeft size={34} className="text-(--text-muted)" />}
        </button>
      </ContentCard>

      {isLoading ? (
        <EmptyState icon={<Clock3 size={30} />} title="CHARGEMENT" description="Récupération des disponibilités" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {days.map((day, dayIndex) => (
            <ContentCard key={day.key} title={day.label} indicator={day.slots.length > 0 ? 'green' : 'gold'} right={
              <button
                onClick={() => addSlot(dayIndex)}
                className="inline-flex items-center gap-1 rounded-lg border border-(--border) bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-2 py-1 text-xs font-semibold text-(--accent)"
              >
                <Plus size={13} /> Ajouter
              </button>
            }>
              {day.slots.length === 0 ? (
                <EmptyState icon={<CalendarRange size={22} />} title="AUCUN CRÉNEAU" description="Ajoutez un créneau avec le bouton +" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot, slotIndex) => (
                    <div key={`${day.key}-${slotIndex}`} className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-3 py-1 text-xs text-(--accent)">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(event) => updateSlot(dayIndex, slotIndex, 'start', event.target.value)}
                        className="bg-transparent text-xs outline-none"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(event) => updateSlot(dayIndex, slotIndex, 'end', event.target.value)}
                        className="bg-transparent text-xs outline-none"
                      />
                      <button onClick={() => removeSlot(dayIndex, slotIndex)} className="text-(--danger)">
                        <Minus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ContentCard>
          ))}
        </div>
      )}

      <button
        onClick={saveAvailability}
        disabled={isSaving}
        className="inline-flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-(--accent) px-4 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-70"
      >
        <Save size={16} /> {isSaving ? 'Enregistrement...' : `Enregistrer les disponibilités (${totalSlots})`}
      </button>
    </div>
  )
}

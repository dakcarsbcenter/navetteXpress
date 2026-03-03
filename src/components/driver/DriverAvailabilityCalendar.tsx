'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay, isToday, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CheckCircle,
  X,
  Check,
  Plus,
  Calendar as CalendarIcon,
  Lightning,
  Clock,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  FloppyDisk as Save,
  Trash
} from "@phosphor-icons/react"

// Types
interface TimeSlot {
  start: string
  end: string
}

interface DayAvailability {
  date: Date
  slots: TimeSlot[]
  isFullDay: boolean
}

interface AvailabilityData {
  [key: string]: DayAvailability // key: date in ISO format
}

type ViewMode = 'day' | 'week' | 'month' | 'year'

interface AvailabilityPreset {
  id: string
  label: string
  icon: string
  description: string
  apply: (currentDate: Date) => AvailabilityData
}

const TIME_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function DriverAvailabilityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [availability, setAvailability] = useState<AvailabilityData>({})
  const [selectedTimeStart, setSelectedTimeStart] = useState('08:00')
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('18:00')
  const [showPresets, setShowPresets] = useState(true)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editingSlot, setEditingSlot] = useState<{ dateKey: string; slotIndex: number } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Presets de disponibilité
  const availabilityPresets: AvailabilityPreset[] = [
    {
      id: 'weekdays-full',
      label: 'Semaine complète',
      icon: '📅',
      description: 'Lundi à Vendredi, toute la journée',
      apply: (date: Date) => {
        const result: AvailabilityData = {}
        const start = startOfWeek(date, { weekStartsOn: 1 })
        for (let i = 0; i < 5; i++) {
          const day = addDays(start, i)
          const key = format(day, 'yyyy-MM-dd')
          result[key] = {
            date: day,
            slots: [{ start: '00:00', end: '23:59' }],
            isFullDay: true
          }
        }
        return result
      }
    },
    {
      id: 'weekdays-hours',
      label: 'Semaine (heures bureau)',
      icon: '🕐',
      description: 'Lundi à Vendredi, 8h-18h',
      apply: (date: Date) => {
        const result: AvailabilityData = {}
        const start = startOfWeek(date, { weekStartsOn: 1 })
        for (let i = 0; i < 5; i++) {
          const day = addDays(start, i)
          const key = format(day, 'yyyy-MM-dd')
          result[key] = {
            date: day,
            slots: [{ start: '08:00', end: '18:00' }],
            isFullDay: false
          }
        }
        return result
      }
    },
    {
      id: 'everyday-full',
      label: 'Tous les jours',
      icon: '🌍',
      description: 'Disponible 7j/7, 24h/24',
      apply: (date: Date) => {
        const result: AvailabilityData = {}
        const start = startOfWeek(date, { weekStartsOn: 1 })
        for (let i = 0; i < 7; i++) {
          const day = addDays(start, i)
          const key = format(day, 'yyyy-MM-dd')
          result[key] = {
            date: day,
            slots: [{ start: '00:00', end: '23:59' }],
            isFullDay: true
          }
        }
        return result
      }
    },
    {
      id: 'everyday-hours',
      label: 'Tous les jours (heures)',
      icon: '⏰',
      description: 'Disponible 7j/7 avec horaires',
      apply: (date: Date) => {
        const result: AvailabilityData = {}
        const start = startOfWeek(date, { weekStartsOn: 1 })
        for (let i = 0; i < 7; i++) {
          const day = addDays(start, i)
          const key = format(day, 'yyyy-MM-dd')
          result[key] = {
            date: day,
            slots: [{ start: '08:00', end: '20:00' }],
            isFullDay: false
          }
        }
        return result
      }
    },
    {
      id: 'weekend-full',
      label: 'Week-end complet',
      icon: '🎉',
      description: 'Samedi et Dimanche, toute la journée',
      apply: (date: Date) => {
        const result: AvailabilityData = {}
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Lundi
        // Samedi = Lundi + 5 jours, Dimanche = Lundi + 6 jours
        const saturday = addDays(start, 5)
        const sunday = addDays(start, 6)

        result[format(saturday, 'yyyy-MM-dd')] = {
          date: saturday,
          slots: [{ start: '00:00', end: '23:59' }],
          isFullDay: true
        }
        result[format(sunday, 'yyyy-MM-dd')] = {
          date: sunday,
          slots: [{ start: '00:00', end: '23:59' }],
          isFullDay: true
        }
        return result
      }
    },
    {
      id: 'weekend-hours',
      label: 'Week-end (heures)',
      icon: '🌅',
      description: 'Samedi et Dimanche avec horaires',
      apply: (date: Date) => {
        const result: AvailabilityData = {}
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Lundi
        // Samedi = Lundi + 5 jours, Dimanche = Lundi + 6 jours
        const saturday = addDays(start, 5)
        const sunday = addDays(start, 6)

        result[format(saturday, 'yyyy-MM-dd')] = {
          date: saturday,
          slots: [{ start: '09:00', end: '17:00' }],
          isFullDay: false
        }
        result[format(sunday, 'yyyy-MM-dd')] = {
          date: sunday,
          slots: [{ start: '09:00', end: '17:00' }],
          isFullDay: false
        }
        return result
      }
    }
  ]

  const applyPreset = (preset: AvailabilityPreset) => {
    const newAvailability = preset.apply(currentDate)
    setAvailability({ ...availability, ...newAvailability })
    showToast(`Preset "${preset.label}" appliqué avec succès`, 'success')
  }

  const toggleDayAvailability = (date: Date, isFullDay: boolean = false) => {
    const key = format(date, 'yyyy-MM-dd')
    const existing = availability[key]

    if (existing) {
      // Remove availability
      const newAvailability = { ...availability }
      delete newAvailability[key]
      setAvailability(newAvailability)
    } else {
      // Add availability
      setAvailability({
        ...availability,
        [key]: {
          date,
          slots: isFullDay
            ? [{ start: '00:00', end: '23:59' }]
            : [{ start: selectedTimeStart, end: selectedTimeEnd }],
          isFullDay
        }
      })
    }
  }

  const updateSlotTime = (dateKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    const dayAvail = availability[dateKey]
    if (!dayAvail) return

    const newSlots = [...dayAvail.slots]
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      [field]: value
    }

    setAvailability({
      ...availability,
      [dateKey]: {
        ...dayAvail,
        slots: newSlots
      }
    })
  }

  const addSlot = (dateKey: string) => {
    const dayAvail = availability[dateKey]
    if (!dayAvail) return

    setAvailability({
      ...availability,
      [dateKey]: {
        ...dayAvail,
        slots: [...dayAvail.slots, { start: selectedTimeStart, end: selectedTimeEnd }]
      }
    })
    showToast('Créneau ajouté', 'success')
  }

  const removeSlot = (dateKey: string, slotIndex: number) => {
    const dayAvail = availability[dateKey]
    if (!dayAvail) return

    const newSlots = dayAvail.slots.filter((_, idx) => idx !== slotIndex)

    if (newSlots.length === 0) {
      const newAvailability = { ...availability }
      delete newAvailability[dateKey]
      setAvailability(newAvailability)
    } else {
      setAvailability({
        ...availability,
        [dateKey]: {
          ...dayAvail,
          slots: newSlots
        }
      })
    }
    showToast('Créneau supprimé', 'success')
  }

  const selectAllMonth = (isFullDay: boolean = false) => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const newAvailability = { ...availability }
    daysInMonth.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      newAvailability[key] = {
        date: day,
        slots: isFullDay
          ? [{ start: '00:00', end: '23:59' }]
          : [{ start: selectedTimeStart, end: selectedTimeEnd }],
        isFullDay
      }
    })

    setAvailability(newAvailability)
    showToast(`Mois entier sélectionné (${daysInMonth.length} jours)`, 'success')
  }

  const deselectAllMonth = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const newAvailability = { ...availability }
    daysInMonth.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      delete newAvailability[key]
    })

    setAvailability(newAvailability)
    showToast('Mois entier désélectionné', 'success')
  }

  const selectAllYear = (isFullDay: boolean = false) => {
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd })

    const newAvailability = { ...availability }
    daysInYear.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      newAvailability[key] = {
        date: day,
        slots: isFullDay
          ? [{ start: '00:00', end: '23:59' }]
          : [{ start: selectedTimeStart, end: selectedTimeEnd }],
        isFullDay
      }
    })

    setAvailability(newAvailability)
    showToast(`Année entière sélectionnée (${daysInYear.length} jours)`, 'success')
  }

  const deselectAllYear = () => {
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd })

    const newAvailability = { ...availability }
    daysInYear.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      delete newAvailability[key]
    })

    setAvailability(newAvailability)
    showToast('Année entière désélectionnée', 'success')
  }

  const selectMonthWeekends = (isFullDay: boolean = false) => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const weekendDays = daysInMonth.filter(day => {
      const dayOfWeek = day.getDay()
      return dayOfWeek === 0 || dayOfWeek === 6 // 0 = Dimanche, 6 = Samedi
    })

    const newAvailability = { ...availability }
    weekendDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      newAvailability[key] = {
        date: day,
        slots: isFullDay
          ? [{ start: '00:00', end: '23:59' }]
          : [{ start: selectedTimeStart, end: selectedTimeEnd }],
        isFullDay
      }
    })

    setAvailability(newAvailability)
    showToast(`Week-ends du mois sélectionnés (${weekendDays.length} jours)`, 'success')
  }

  const selectYearWeekends = (isFullDay: boolean = false) => {
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd })

    const weekendDays = daysInYear.filter(day => {
      const dayOfWeek = day.getDay()
      return dayOfWeek === 0 || dayOfWeek === 6 // 0 = Dimanche, 6 = Samedi
    })

    const newAvailability = { ...availability }
    weekendDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      newAvailability[key] = {
        date: day,
        slots: isFullDay
          ? [{ start: '00:00', end: '23:59' }]
          : [{ start: selectedTimeStart, end: selectedTimeEnd }],
        isFullDay
      }
    })

    setAvailability(newAvailability)
    showToast(`Week-ends de l'année sélectionnés (${weekendDays.length} jours)`, 'success')
  }

  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1))
        break
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case 'month':
        setCurrentDate(subMonths(currentDate, 1))
        break
      case 'year':
        setCurrentDate(subMonths(currentDate, 12))
        break
    }
  }

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1))
        break
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case 'month':
        setCurrentDate(addMonths(currentDate, 1))
        break
      case 'year':
        setCurrentDate(addMonths(currentDate, 12))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const saveAvailability = async () => {
    try {
      showToast('Sauvegarde en cours...', 'success')
      // Ici, implémenter l'appel API pour sauvegarder
      // await fetch('/api/driver/availability', { method: 'POST', body: JSON.stringify(availability) })
      setTimeout(() => {
        showToast('Disponibilités sauvegardées avec succès!', 'success')
      }, 1000)
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error')
    }
  }

  // Render functions for different views
  const renderDayView = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    const dayAvailability = availability[dateKey]

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {TIME_SLOTS.map((time) => {
              const isSelected = dayAvailability?.slots.some(
                slot => slot.start <= time && slot.end > time
              )
              return (
                <div
                  key={time}
                  className={`p-4 rounded-2xl font-mono text-xs font-bold transition-all duration-300 border ${isSelected
                    ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-500'
                    }`}
                >
                  {time}
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => toggleDayAvailability(currentDate, true)}
              className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3"
            >
              <CheckCircle size={20} weight="fill" /> Toute la journée
            </button>
            <button
              onClick={() => {
                const key = format(currentDate, 'yyyy-MM-dd')
                const newAvailability = { ...availability }
                delete newAvailability[key]
                setAvailability(newAvailability)
              }}
              className="flex-1 py-4 px-6 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-300 dark:hover:border-red-500/50 hover:text-red-700 dark:hover:text-red-400 transition-all flex items-center justify-center gap-3"
            >
              <X size={20} weight="bold" /> Marquer Indisponible
            </button>
          </div>
        </div>

        {/* Gestion des créneaux horaires */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⏱️</span>
            Créneaux horaires
          </h4>

          {dayAvailability && !dayAvailability.isFullDay ? (
            <div className="space-y-3">
              {dayAvailability.slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-400 mb-1">
                        Début
                      </label>
                      <select
                        value={slot.start}
                        onChange={(e) => updateSlotTime(dateKey, idx, 'start', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg font-semibold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-400 mb-1">
                        Fin
                      </label>
                      <select
                        value={slot.end}
                        onChange={(e) => updateSlotTime(dateKey, idx, 'end', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg font-semibold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSlot(dateKey, idx)}
                    className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="Supprimer ce créneau"
                  >
                    <Trash size={20} weight="bold" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSlot(dateKey)}
                className="w-full py-3 px-4 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus size={20} weight="bold" />
                Ajouter un créneau
              </button>
            </div>
          ) : dayAvailability?.isFullDay ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-semibold">
                <CheckCircle size={24} weight="fill" />
                Disponible toute la journée (24h/24)
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Aucun créneau défini pour cette journée
              </p>
              <button
                onClick={() => toggleDayAvailability(currentDate, false)}
                className="py-3 px-6 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                Ajouter un créneau horaire
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

    return (
      <div className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 gap-px bg-gray-300 dark:bg-white/5">
          {weekDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayAvailability = availability[dateKey]
            const isCurrentDay = isToday(day)

            return (
              <div
                key={index}
                className="bg-white dark:bg-[var(--color-driver-card)] min-h-[250px] p-5 relative overflow-hidden"
              >
                {isCurrentDay && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />}
                <div className="text-center mb-6">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    {WEEKDAY_NAMES[index]}
                  </div>
                  <div className={`text-2xl font-black font-mono ${isCurrentDay
                    ? 'text-blue-600 dark:text-blue-500'
                    : 'text-gray-900 dark:text-white'
                    }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => toggleDayAvailability(day, true)}
                    className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border ${dayAvailability?.isFullDay
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-500'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:border-gray-400 dark:hover:border-white/20'
                      }`}
                  >
                    <CheckCircle size={14} weight="bold" /> 24h/24
                  </button>

                  <div className="space-y-2">
                    {dayAvailability && !dayAvailability.isFullDay && (
                      <div className="space-y-2">
                        {dayAvailability.slots.map((slot, idx) => (
                          <div key={idx} className="bg-blue-50 dark:bg-blue-500/5 border border-blue-300 dark:border-blue-500/20 rounded-xl p-2.5">
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 font-bold">{slot.start} - {slot.end}</span>
                              <button
                                onClick={() => removeSlot(dateKey, idx)}
                                className="text-red-500/50 hover:text-red-500"
                              >
                                <X size={12} weight="bold" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => dayAvailability?.isFullDay ? toggleDayAvailability(day, true) : addSlot(dateKey)}
                      className="w-full py-3 px-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold uppercase hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-500/20 dark:hover:to-blue-600/20 transition-all flex items-center justify-center gap-2 border-2 border-blue-300 dark:border-blue-500/30 shadow-sm hover:shadow-md hover:shadow-blue-500/20"
                    >
                      <Plus size={14} weight="bold" /> Créneau Modulé
                    </button>
                  </div>
                </div>

                {dayAvailability && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="space-y-6">
        {/* Actions rapides pour le mois */}
        <div className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contrôle Mensuel :</span>
            <button
              onClick={() => selectAllMonth(true)}
              className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-all"
            >
              24h/24 Partout
            </button>
            <button
              onClick={() => selectAllMonth(false)}
              className="px-4 py-2.5 bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all"
            >
              Slots Standard ({selectedTimeStart}-{selectedTimeEnd})
            </button>
            <button
              onClick={() => selectMonthWeekends(true)}
              className="px-4 py-2.5 bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/50 text-purple-700 dark:text-purple-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-all"
            >
              Week-ends 24h/24
            </button>
            <button
              onClick={deselectAllMonth}
              className="px-4 py-2.5 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-200 dark:hover:bg-red-500/20 transition-all"
            >
              Reset Mois
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-7 gap-px bg-gray-300 dark:bg-white/5">
            {WEEKDAY_NAMES.map((day) => (
              <div key={day} className="bg-gray-50 dark:bg-white/5 p-4 text-center">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em]">
                  {day}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-300 dark:bg-white/5">
            {days.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayAvailability = availability[dateKey]
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-[var(--color-driver-card)] min-h-[120px] p-4 group transition-all ${!isCurrentMonth ? 'opacity-10' : ''
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold font-mono ${isCurrentDay
                      ? 'text-blue-600 dark:text-blue-500'
                      : isCurrentMonth
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600'
                      }`}>
                      {format(day, 'd')}
                    </span>

                    {isCurrentMonth && (
                      <button
                        onClick={() => toggleDayAvailability(day, false)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${dayAvailability
                          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/5 text-gray-600 dark:text-gray-600 hover:border-gray-400 dark:hover:border-white/20'
                          }`}
                      >
                        {dayAvailability ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
                      </button>
                    )}
                  </div>

                  {dayAvailability && isCurrentMonth && (
                    <div className="space-y-1">
                      {dayAvailability.isFullDay ? (
                        <div className="text-[8px] font-bold text-emerald-700 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">
                          24h/24
                        </div>
                      ) : (
                        dayAvailability.slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="group/slot text-[8px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 rounded-md px-1.5 py-0.5 flex items-center justify-between gap-1 hover:bg-blue-200 dark:hover:bg-blue-500/20 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSlot({ dateKey, slotIndex: idx })
                            }}
                          >
                            <span className="font-mono">{slot.start}-{slot.end}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderYearView = () => {
    const startOfCurrYear = startOfYear(currentDate)
    const endOfCurrYear = endOfYear(currentDate)
    const months = eachMonthOfInterval({ start: startOfCurrYear, end: endOfCurrYear })

    return (
      <div className="space-y-6">
        {/* Actions rapides pour l'année */}
        <div className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Planification Annuelle :</span>
            <button
              onClick={() => selectAllYear(true)}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
            >
              7j/7 - 24h/24
            </button>
            <button
              onClick={deselectAllYear}
              className="px-4 py-2 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-200 dark:hover:bg-red-500/20"
            >
              Reset Annee
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.map((month, index) => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

            const availableDaysCount = daysInMonth.filter(day => {
              const key = format(day, 'yyyy-MM-dd')
              return !!availability[key]
            }).length

            return (
              <div
                key={index}
                className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl p-6 hover:border-blue-500/30 transition-all cursor-pointer group"
                onClick={() => {
                  setCurrentDate(month)
                  setViewMode('month')
                }}
              >
                <div className="text-center mb-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                    {MONTH_NAMES[index]}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {format(month, 'yyyy')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Taux d'activité</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {availableDaysCount}/{daysInMonth.length} J
                    </span>
                  </div>

                  <div className="w-full bg-gray-300 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                      style={{ width: `${(availableDaysCount / daysInMonth.length) * 100}%` }}
                    />
                  </div>
                </div>

                <button className="w-full mt-6 py-2.5 px-3 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/5 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 group-hover:text-gray-900 dark:group-hover:text-white transition-all">
                  Ouvrir le mois
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modal d'édition de créneau */}
      {editingSlot && (() => {
        const dayAvail = availability[editingSlot.dateKey]
        const slot = dayAvail?.slots[editingSlot.slotIndex]
        if (!slot) return null

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingSlot(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Modifier le créneau
                </h3>
                <button
                  onClick={() => setEditingSlot(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Heure de début
                  </label>
                  <select
                    value={slot.start}
                    onChange={(e) => {
                      updateSlotTime(editingSlot.dateKey, editingSlot.slotIndex, 'start', e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Heure de fin
                  </label>
                  <select
                    value={slot.end}
                    onChange={(e) => {
                      updateSlotTime(editingSlot.dateKey, editingSlot.slotIndex, 'end', e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingSlot(null)}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Terminé
                  </button>
                  <button
                    onClick={() => {
                      removeSlot(editingSlot.dateKey, editingSlot.slotIndex)
                      setEditingSlot(null)
                    }}
                    className="py-3 px-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slide-in ${toastMessage.type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
          }`}>
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-semibold">{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-3xl shadow-2xl p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-4">
              <CalendarIcon className="text-white" size={32} weight="fill" />
              Gestion de Disponibilités
            </h2>
            <p className="text-blue-100/70 mt-2 font-medium">
              Définissez vos horaires d'activité pour optimiser vos missions.
            </p>
          </div>

          {/* View mode tabs */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xl rounded-2xl p-1.5 border border-white/5">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 ${viewMode === mode
                  ? 'bg-white text-blue-900 shadow-xl scale-105'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                {mode === 'day' && 'Jour'}
                {mode === 'week' && 'Semaine'}
                {mode === 'month' && 'Mois'}
                {mode === 'year' && 'Année'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Lightning size={18} weight="fill" className="text-blue-600 dark:text-blue-500" />
              Modèles d'activité rapides
            </h3>
            <button
              onClick={() => setShowPresets(false)}
              className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-400 transition-all"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availabilityPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="p-5 bg-gray-50 dark:bg-white/[0.02] border border-gray-300 dark:border-white/5 rounded-2xl hover:border-blue-500/50 hover:bg-blue-100 dark:hover:bg-blue-500/5 transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {preset.icon}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                      {preset.label}
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      {preset.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!showPresets && (
        <button
          onClick={() => setShowPresets(true)}
          className="w-full py-4 px-6 bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] text-gray-600 dark:text-white/70 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-3"
        >
          <Lightning size={18} weight="fill" className="text-blue-600 dark:text-blue-500" /> Afficher les modèles de travail rapides
        </button>
      )}

      {/* Time selection for custom hours */}
      <div className="bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl p-8">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Clock size={16} weight="bold" className="text-blue-600 dark:text-blue-500" />
          Plage horaire par défaut
        </h3>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Heure de début</label>
            <div className="relative">
              <select
                value={selectedTimeStart}
                onChange={(e) => setSelectedTimeStart(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500 transition-all appearance-none"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time} className="bg-white dark:bg-[#0A0F14]">{time}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Heure de fin</label>
            <div className="relative">
              <select
                value={selectedTimeEnd}
                onChange={(e) => setSelectedTimeEnd(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-mono text-sm outline-none focus:border-blue-500 transition-all appearance-none"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time} className="bg-white dark:bg-[#0A0F14]">{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-[var(--color-driver-card)] border border-gray-300 dark:border-[var(--color-driver-border)] rounded-3xl p-6 shadow-xl">
        <button
          onClick={navigatePrevious}
          className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 rounded-2xl hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={24} weight="bold" />
        </button>

        <div className="text-center group">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase font-mono">
            {viewMode === 'day' && format(currentDate, 'd MMMM yyyy', { locale: fr })}
            {viewMode === 'week' && `Du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })}`}
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
            {viewMode === 'year' && format(currentDate, 'Année yyyy')}
          </h3>
          <button
            onClick={goToToday}
            className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Revenir à aujourd'hui
          </button>
        </div>

        <button
          onClick={navigateNext}
          className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 rounded-2xl hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
        >
          <ChevronRight size={24} weight="bold" />
        </button>
      </div>

      {/* Calendar views */}
      <div>
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'year' && renderYearView()}
      </div>

      {/* Save button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={saveAvailability}
          className="flex-1 py-5 px-8 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4"
        >
          <Save size={20} weight="bold" /> Enregistrer la Configuration
        </button>
        <button
          onClick={() => setAvailability({})}
          className="py-5 px-8 bg-white/5 border border-white/10 text-gray-500 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          Effacer tout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8">
        <div className="bg-linear-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-3xl p-8 shadow-xl">
          <div className="text-4xl font-black text-white font-mono tracking-tighter">{Object.keys(availability).length}</div>
          <div className="text-[10px] uppercase font-bold text-blue-400 mt-2 tracking-widest">Jours d'activité prévus</div>
        </div>
        <div className="bg-linear-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20 rounded-3xl p-8 shadow-xl">
          <div className="text-4xl font-black text-white font-mono tracking-tighter">
            {Object.values(availability).filter(a => a.isFullDay).length}
          </div>
          <div className="text-[10px] uppercase font-bold text-emerald-400 mt-2 tracking-widest">Disponibilités 24h/24</div>
        </div>
        <div className="bg-linear-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/20 rounded-3xl p-8 shadow-xl">
          <div className="text-4xl font-black text-white font-mono tracking-tighter">
            {Object.values(availability).filter(a => !a.isFullDay).length}
          </div>
          <div className="text-[10px] uppercase font-bold text-purple-400 mt-2 tracking-widest">Créneaux horaires modulés</div>
        </div>
      </div>
    </div>
  )
}


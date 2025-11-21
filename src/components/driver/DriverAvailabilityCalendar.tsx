'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay, isToday, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'

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

const WEEKDAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
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
        const start = startOfWeek(date, { weekStartsOn: 1 })
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
        const start = startOfWeek(date, { weekStartsOn: 1 })
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
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {TIME_SLOTS.map((time) => {
              const isSelected = dayAvailability?.slots.some(
                slot => slot.start <= time && slot.end > time
              )
              return (
                <button
                  key={time}
                  className={`p-3 rounded-lg font-semibold transition-all duration-200 cursor-default ${
                    isSelected
                      ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {time}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => toggleDayAvailability(currentDate, true)}
              className="flex-1 py-3 px-4 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              Toute la journée
            </button>
            <button
              onClick={() => {
                const key = format(currentDate, 'yyyy-MM-dd')
                const newAvailability = { ...availability }
                delete newAvailability[key]
                setAvailability(newAvailability)
              }}
              className="flex-1 py-3 px-4 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
            >
              Indisponible
            </button>
          </div>
        </div>

        {/* Gestion des créneaux horaires */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
          <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>⏱️</span>
            Créneaux horaires
          </h4>

          {dayAvailability && !dayAvailability.isFullDay ? (
            <div className="space-y-3">
              {dayAvailability.slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Début
                      </label>
                      <select
                        value={slot.start}
                        onChange={(e) => updateSlotTime(dateKey, idx, 'start', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Fin
                      </label>
                      <select
                        value={slot.end}
                        onChange={(e) => updateSlotTime(dateKey, idx, 'end', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSlot(dateKey)}
                className="w-full py-3 px-4 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un créneau
              </button>
            </div>
          ) : dayAvailability?.isFullDay ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-semibold">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Disponible toute la journée (24h/24)
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
          {weekDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayAvailability = availability[dateKey]
            const isCurrentDay = isToday(day)

            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 min-h-[200px] p-4"
              >
                <div className="text-center mb-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {WEEKDAY_NAMES[index]}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${
                    isCurrentDay 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-800 dark:text-white'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!dayAvailability?.isFullDay}
                      onChange={() => toggleDayAvailability(day, true)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Journée entière
                    </span>
                  </label>

                  {!dayAvailability?.isFullDay && (
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={!!dayAvailability && !dayAvailability.isFullDay}
                          onChange={() => toggleDayAvailability(day, false)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Heures spécifiques
                        </span>
                      </label>

                      {dayAvailability && !dayAvailability.isFullDay && (
                        <div className="pl-2 space-y-2 mt-2">
                          {dayAvailability.slots.map((slot, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2 space-y-1">
                              <div className="flex items-center gap-1">
                                <select
                                  value={slot.start}
                                  onChange={(e) => updateSlotTime(dateKey, idx, 'start', e.target.value)}
                                  className="flex-1 text-xs px-2 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                                >
                                  {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                                <span className="text-xs font-bold text-slate-400">→</span>
                                <select
                                  value={slot.end}
                                  onChange={(e) => updateSlotTime(dateKey, idx, 'end', e.target.value)}
                                  className="flex-1 text-xs px-2 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                                >
                                  {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeSlot(dateKey, idx)
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                  title="Supprimer ce créneau"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              addSlot(dateKey)
                            }}
                            className="w-full py-1 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Ajouter un créneau
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {dayAvailability && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Disponible
                    </div>
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
      <div className="space-y-4">
        {/* Actions rapides pour le mois */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Actions rapides:
            </span>
            <button
              onClick={() => selectAllMonth(true)}
              className="px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Tout le mois (24h/24)
            </button>
            <button
              onClick={() => selectAllMonth(false)}
              className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tout le mois ({selectedTimeStart}-{selectedTimeEnd})
            </button>
            <button
              onClick={() => selectMonthWeekends(true)}
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Week-ends (24h/24)
            </button>
            <button
              onClick={() => selectMonthWeekends(false)}
              className="px-4 py-2 bg-linear-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Week-ends ({selectedTimeStart}-{selectedTimeEnd})
            </button>
            <button
              onClick={deselectAllMonth}
              className="px-4 py-2 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Effacer le mois
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
          {WEEKDAY_NAMES.map((day) => (
            <div key={day} className="bg-slate-100 dark:bg-slate-900 p-3 text-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
          {days.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayAvailability = availability[dateKey]
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isCurrentDay = isToday(day)

            return (
              <div
                key={index}
                className={`bg-white dark:bg-slate-800 min-h-[100px] p-2 ${
                  !isCurrentMonth ? 'opacity-30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${
                    isCurrentDay 
                      ? 'text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center' 
                      : isCurrentMonth
                      ? 'text-slate-800 dark:text-white'
                      : 'text-slate-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  
                  {isCurrentMonth && (
                    <button
                      onClick={() => toggleDayAvailability(day, false)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        dayAvailability
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {dayAvailability && (
                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {dayAvailability && isCurrentMonth && (
                  <div className="space-y-1">
                    {dayAvailability.isFullDay ? (
                      <div className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded px-1 py-0.5">
                        24h/24
                      </div>
                    ) : (
                      dayAvailability.slots.map((slot, idx) => (
                        <div 
                          key={idx} 
                          className="group text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded px-1 py-0.5 flex items-center justify-between gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSlot({ dateKey, slotIndex: idx })
                          }}
                        >
                          <span>{slot.start}-{slot.end}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSlot(dateKey, idx)
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
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
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    return (
      <div className="space-y-4">
        {/* Actions rapides pour l'année */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Actions rapides:
            </span>
            <button
              onClick={() => selectAllYear(true)}
              className="px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Toute l'année (24h/24)
            </button>
            <button
              onClick={() => selectAllYear(false)}
              className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Toute l'année ({selectedTimeStart}-{selectedTimeEnd})
            </button>
            <button
              onClick={() => selectYearWeekends(true)}
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Week-ends (24h/24)
            </button>
            <button
              onClick={() => selectYearWeekends(false)}
              className="px-4 py-2 bg-linear-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Week-ends ({selectedTimeStart}-{selectedTimeEnd})
            </button>
            <button
              onClick={deselectAllYear}
              className="px-4 py-2 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Effacer l'année
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => {
                setCurrentDate(month)
                setViewMode('month')
              }}
            >
              <div className="text-center mb-3">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                  {MONTH_NAMES[index]}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {format(month, 'yyyy')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jours disponibles:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {availableDaysCount}/{daysInMonth.length}
                  </span>
                </div>

                {availableDaysCount > 0 && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-green-500 to-green-600 h-2 transition-all duration-500"
                      style={{ width: `${(availableDaysCount / daysInMonth.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <button className="w-full mt-3 py-2 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                Voir le mois →
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
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slide-in ${
          toastMessage.type === 'success' 
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
      <div className="bg-linear-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-950 dark:to-black rounded-2xl shadow-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🗓️</span>
              Gestion de Disponibilités
            </h2>
            <p className="text-blue-100 mt-2">
              Définissez vos horaires de disponibilité avec un calendrier interactif
            </p>
          </div>

          {/* View mode tabs */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-xl p-1">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-white text-blue-700 shadow-lg'
                    : 'text-white hover:bg-white/20'
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>⚡</span>
              Modèles rapides
            </h3>
            <button
              onClick={() => setShowPresets(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availabilityPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="p-4 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl hover:shadow-lg transition-all duration-200 text-left border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {preset.icon}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                      {preset.label}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
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
          className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          ⚡ Afficher les modèles rapides
        </button>
      )}

      {/* Time selection for custom hours */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span>🕐</span>
          Horaires par défaut
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Heure de début
            </label>
            <select
              value={selectedTimeStart}
              onChange={(e) => setSelectedTimeStart(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Heure de fin
            </label>
            <select
              value={selectedTimeEnd}
              onChange={(e) => setSelectedTimeEnd(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4">
        <button
          onClick={navigatePrevious}
          className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {viewMode === 'day' && format(currentDate, 'd MMMM yyyy', { locale: fr })}
            {viewMode === 'week' && `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })}`}
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
            {viewMode === 'year' && format(currentDate, 'yyyy')}
          </h3>
          <button
            onClick={goToToday}
            className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1"
          >
            Aujourd'hui
          </button>
        </div>

        <button
          onClick={navigateNext}
          className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
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
      <div className="flex gap-4">
        <button
          onClick={saveAvailability}
          className="flex-1 py-4 px-6 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Enregistrer les disponibilités
        </button>
        <button
          onClick={() => setAvailability({})}
          className="py-4 px-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
        >
          Effacer tout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl font-bold">{Object.keys(availability).length}</div>
          <div className="text-blue-100 mt-1 font-semibold">Jours configurés</div>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl font-bold">
            {Object.values(availability).filter(a => a.isFullDay).length}
          </div>
          <div className="text-green-100 mt-1 font-semibold">Journées entières</div>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl font-bold">
            {Object.values(availability).filter(a => !a.isFullDay).length}
          </div>
          <div className="text-purple-100 mt-1 font-semibold">Créneaux horaires</div>
        </div>
      </div>
    </div>
  )
}


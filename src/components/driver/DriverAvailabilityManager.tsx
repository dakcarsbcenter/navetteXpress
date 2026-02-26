'use client'

import { useState, useEffect } from 'react'
import { Check, X, PencilSimple, Trash, Plus } from "@phosphor-icons/react"

interface Availability {
  id: number
  driverId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
  specificDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function DriverAvailabilityManager() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00',
    isAvailable: true,
    specificDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchAvailabilities()
  }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch('/api/driver/availability')
      const data = await response.json()

      if (data.success) {
        setAvailabilities(data.data)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showToast('Impossible de charger les disponibilités', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingId
        ? '/api/driver/availability'
        : '/api/driver/availability'

      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? { ...formData, id: editingId }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        showToast(data.message || 'Disponibilité enregistrée avec succès')
        await fetchAvailabilities()
        resetForm()
        setShowAddModal(false)
      } else {
        showToast(data.error || 'Erreur lors de l\'enregistrement', 'error')
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return

    try {
      const response = await fetch(`/api/driver/availability?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showToast('Disponibilité supprimée avec succès')
        await fetchAvailabilities()
      }
    } catch (error) {
      showToast('Impossible de supprimer la disponibilité', 'error')
    }
  }

  const handleEdit = (availability: Availability) => {
    setEditingId(availability.id)
    setFormData({
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isAvailable: availability.isAvailable,
      specificDate: availability.specificDate || '',
      notes: availability.notes || ''
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '18:00',
      isAvailable: true,
      specificDate: '',
      notes: ''
    })
    setEditingId(null)
  }

  // Grouper les disponibilités
  const recurringAvailabilities = availabilities.filter(a => !a.specificDate)
  const specificAvailabilities = availabilities.filter(a => a.specificDate)

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Disponibilités</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos horaires de disponibilité
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} weight="bold" /> Ajouter une disponibilité
        </button>
      </div>

      {/* Disponibilités récurrentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Disponibilités hebdomadaires</h3>

        {recurringAvailabilities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Aucune disponibilité récurrente définie
          </p>
        ) : (
          <div className="space-y-2">
            {DAY_NAMES.map((dayName, dayIndex) => {
              const dayAvailabilities = recurringAvailabilities.filter(a => a.dayOfWeek === dayIndex)

              if (dayAvailabilities.length === 0) return null

              return (
                <div key={dayIndex} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-medium text-gray-900 dark:text-white">{dayName}</div>
                  <div className="space-y-1 mt-1">
                    {dayAvailabilities.map(avail => (
                      <div key={avail.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={avail.isAvailable ? 'text-green-600' : 'text-red-600'}>
                            {avail.isAvailable ? <Check size={16} weight="bold" /> : <X size={16} weight="bold" />}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {avail.startTime} - {avail.endTime}
                          </span>
                          {avail.notes && (
                            <span className="text-gray-500 italic">({avail.notes})</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(avail)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilSimple size={18} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(avail.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash size={18} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Disponibilités spécifiques */}
      {specificAvailabilities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Disponibilités/Indisponibilités spécifiques</h3>

          <div className="space-y-2">
            {specificAvailabilities.map(avail => (
              <div key={avail.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <span className={avail.isAvailable ? 'text-green-600' : 'text-red-600'}>
                    {avail.isAvailable ? <><Check size={16} weight="bold" /> Disponible</> : <><X size={16} weight="bold" /> Indisponible</>}
                  </span>
                  <span className="font-medium">
                    {avail.specificDate && new Date(avail.specificDate).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-gray-600">
                    {avail.startTime} - {avail.endTime}
                  </span>
                  {avail.notes && (
                    <span className="text-gray-500 italic text-sm">({avail.notes})</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(avail)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilSimple size={18} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDelete(avail.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal d'ajout/édition */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Modifier' : 'Ajouter'} une disponibilité
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type de disponibilité */}
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.isAvailable ? 'available' : 'unavailable'}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'available' })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="available">Disponible</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>

              {/* Date spécifique (optionnel) */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date spécifique (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.specificDate}
                  onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour une disponibilité récurrente
                </p>
              </div>

              {/* Jour de la semaine (si pas de date spécifique) */}
              {!formData.specificDate && (
                <div>
                  <label className="block text-sm font-medium mb-1">Jour de la semaine</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {DAY_NAMES.map((name, index) => (
                      <option key={index} value={index}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Heures */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure de fin</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Ex: Rendez-vous médical, congé, etc."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm() }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-full">
          <div className={`p-4 rounded-lg shadow-lg max-w-md ${toastMessage.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }`}>
            <p className={`text-sm font-medium ${toastMessage.type === 'error'
              ? 'text-red-900 dark:text-red-200'
              : 'text-green-900 dark:text-green-200'
              }`}>
              {toastMessage.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

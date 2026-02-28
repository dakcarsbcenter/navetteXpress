"use client"

import { useState, useEffect } from "react"
import { Plus, MapPin, Trash, PencilSimple as Edit } from "@phosphor-icons/react"
import { useNotification } from "@/hooks/useNotification"
import { NotificationCenter } from "@/components/ui/NotificationCenter"

interface Location {
    id: number
    name: string
    isActive: boolean
    createdAt: string
}

export function LocationsManagementRedesigned() {
    const [locations, setLocations] = useState<Location[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLocation, setEditingLocation] = useState<Location | null>(null)

    const { notifications, showSuccess, showError, removeNotification } = useNotification()

    const [formData, setFormData] = useState({
        name: '',
        isActive: true
    })

    useEffect(() => {
        fetchLocations()
    }, [])

    const fetchLocations = async () => {
        try {
            const response = await fetch('/api/locations?all=true')
            if (response.ok) {
                const result = await response.json()
                if (result?.success) {
                    setLocations(result.data ?? [])
                }
            }
        } catch (error) {
            console.error('Erreur chargement lieux:', error)
            showError('Erreur lors du chargement des lieux', 'Erreur')
        } finally {
            setIsLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingLocation(null)
        setFormData({
            name: '',
            isActive: true
        })
        setIsModalOpen(true)
    }

    const openEditModal = (location: Location) => {
        setEditingLocation(location)
        setFormData({
            name: location.name,
            isActive: location.isActive
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations'
            const method = editingLocation ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                showSuccess(
                    editingLocation ? 'Lieu modifié avec succès' : 'Lieu créé avec succès',
                    'Succès'
                )
                setIsModalOpen(false)
                fetchLocations()
            } else {
                const error = await response.json()
                showError(`Erreur: ${error.error}`, 'Échec')
            }
        } catch (error) {
            showError('Une erreur est survenue', 'Erreur technique')
        }
    }

    const handleDelete = async (location: Location) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${location.name} ?`)) return

        try {
            const response = await fetch(`/api/locations/${location.id}`, { method: 'DELETE' })
            if (response.ok) {
                showSuccess('Lieu supprimé avec succès', 'Succès')
                fetchLocations()
            } else {
                showError('Erreur lors de la suppression', 'Erreur')
            }
        } catch (error) {
            showError('Erreur technique', 'Erreur')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <NotificationCenter
                notifications={notifications}
                onRemove={removeNotification}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Lieux de Prise en Charge</h1>
                    <p className="text-sm text-slate-400 mt-1">Gérez les lieux de départ et d'arrivée disponibles pour les clients.</p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau lieu
                </button>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white">
                        <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-slate-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nom du Lieu</th>
                                <th className="px-6 py-4 text-center">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-midnight font-medium">
                            {locations.map((loc) => (
                                <tr key={loc.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                                            <MapPin size={20} weight="light" />
                                        </div>
                                        <span>{loc.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${loc.isActive
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {loc.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(loc)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(loc)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" size={48} />
                                        <p>Aucun lieu défini</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-obsidian border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-white font-display mb-6">
                            {editingLocation ? 'Modifier le lieu' : 'Nouveau lieu'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Nom du lieu</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} weight="light" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-midnight border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-all placeholder:text-slate-600"
                                        placeholder="Ex: Aéroport AIBD"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 border border-white/5 rounded-xl bg-white/5">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-600 text-gold focus:ring-gold bg-midnight"
                                />
                                <label htmlFor="isActive" className="text-sm text-white font-medium cursor-pointer">
                                    Lieu actif <span className="text-slate-500 font-normal ml-1">(visible par les clients)</span>
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-gold text-midnight font-bold rounded-xl hover:bg-gold/90 transition-colors shadow-[0_0_20px_rgba(201,168,76,0.2)]"
                                >
                                    {editingLocation ? 'Enregistrer' : 'Créer le lieu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

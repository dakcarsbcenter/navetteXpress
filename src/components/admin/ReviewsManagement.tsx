"use client"

import { useState, useEffect } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"
import {
  Star,
  User,
  MapPin,
  Calendar,
  PencilSimple as Edit2,
  Trash as Trash2,
  Plus,
  MagnifyingGlass as Search,
  ChatCircleDots as MessageSquare,
  TrendUp as TrendingUp,
  XCircle,
  DotsThree as MoreHorizontal,
  ArrowRight,
  Quotes as Quote
} from "@phosphor-icons/react"

interface Review {
  id: number
  bookingId: number
  rating: number
  comment?: string
  createdAt: string
  booking?: {
    customerName: string
    customerEmail: string
    pickupAddress: string
    dropoffAddress: string
    scheduledDateTime: string
  }
}

export function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const { canDelete } = usePermissions()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    bookingId: '',
    rating: 5,
    comment: ''
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      } else {
        console.error('Erreur HTTP:', response.status)
        setReviews([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchReviews()
        setIsModalOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    }
  }

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReview) return

    try {
      const response = await fetch(`/api/admin/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchReviews()
        setIsModalOpen(false)
        setEditingReview(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const openDeleteConfirm = (reviewId: number) => {
    setDeleteTargetId(reviewId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteReview = async () => {
    if (deleteTargetId == null) return
    try {
      const response = await fetch(`/api/admin/reviews/${deleteTargetId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchReviews()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      bookingId: '',
      rating: 5,
      comment: ''
    })
  }

  const openEditModal = (review: Review) => {
    setEditingReview(review)
    setFormData({
      bookingId: review.bookingId.toString(),
      rating: review.rating,
      comment: review.comment || ''
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingReview(null)
    resetForm()
    setIsModalOpen(true)
  }

  const getRatingSummary = () => {
    if (reviews.length === 0) return { avg: 0, positive: 0, total: 0 }
    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const avg = sum / total
    const positive = reviews.filter(r => r.rating >= 4).length
    return { avg: avg.toFixed(1), positive, total }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"
          style={{ borderColor: 'var(--color-gold) transparent transparent transparent' }}></div>
      </div>
    )
  }

  const stats = getRatingSummary()

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={20} className="text-gold" />
              Index des Avis
            </h2>
            <p className="text-xs text-slate-500 mt-1">Surveillez et gérez les retours d'expérience clients</p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={openCreateModal}
              className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-gold/10">
              <Plus size={16} />
              Rédiger un Témoignage
            </button>
          </div>
        </div>

        {[
          { label: 'Note Moyenne', value: stats.avg, color: 'var(--color-gold)', icon: <Star size={18} fill="currentColor" /> },
          { label: 'Avis Positifs', value: stats.positive, color: '#10B981', icon: <TrendingUp size={18} /> },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: 'var(--color-dash-card)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Registry Card */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-white tracking-wide">Base de Données Avis ({reviews.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auteur & Prestation</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Évaluation</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commentaire</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] group">
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                        {review.booking?.customerName?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors">{review.booking?.customerName || 'Anonyme'}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                          <MapPin size={10} />
                          <span className="truncate max-w-[150px]">{review.booking?.dropoffAddress || 'Trajet inconnu'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12}
                            className={s <= review.rating ? "text-gold" : "text-white/5"}
                            fill={s <= review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 mt-1">{review.rating}/5.0</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative max-w-sm">
                      <Quote size={12} className="absolute -left-2 -top-2 text-white/5" />
                      <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed pl-2 underline decoration-white/5 underline-offset-4">
                        {review.comment || "Aucun commentaire laissé par le client."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                      <Calendar size={10} />
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => openEditModal(review)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        title="Éditer"
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete('reviews') && (
                        <button
                          onClick={() => openDeleteConfirm(review.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reviews.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-500 italic text-sm">Aucun avis enregistré pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Redesign */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl relative animate-slideUp"
            style={{ backgroundColor: 'var(--color-obsidian)' }}>

            <div className="flex justify-between items-start mb-8 text-center w-full block">
              <div className="w-full">
                <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] mb-2">{editingReview ? 'Éditer' : 'Enregistrer'} Retour</h3>
                <div className="h-1 w-12 bg-gold mx-auto"></div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={editingReview ? handleUpdateReview : handleCreateReview} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Référence Réservation</label>
                <input
                  type="number"
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                  placeholder="ID de la course..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Index de Satisfaction</label>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="transition-transform active:scale-90"
                    >
                      <Star size={24}
                        className={star <= formData.rating ? "text-gold" : "text-slate-700"}
                        fill={star <= formData.rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span className="ml-auto font-mono text-gold font-bold">{formData.rating}/5</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Témoignage Client</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-4 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white resize-none leading-relaxed"
                  placeholder="Saisissez les impressions du passager..."
                />
              </div>

              <button
                type="submit"
                className="w-full btn-gold py-4 rounded-2xl font-bold text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
              >
                {editingReview ? 'Mettre à jour' : 'Confirmer le Retour'}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null) }}
        title="Archivage Définitif"
        message="Voulez-vous vraiment supprimer cet avis ? Cette action est irréversible et modifiera les statistiques globales."
        type="error"
        confirmText="Supprimer"
        onConfirm={handleDeleteReview}
        showCancel={true}
        cancelText="Annuler"
      />
    </div>
  )
}

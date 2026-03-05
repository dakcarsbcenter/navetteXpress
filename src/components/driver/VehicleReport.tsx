"use client"

import { useState, useEffect } from 'react'
import {
  Plus,
  CaretLeft,
  Car,
  Wrench,
  Lightning,
  PaintBrush,
  Chair,
  DotsThree,
  Clock,
  Warning,
  FileText,
  CheckCircle,
  X,
  ClockCounterClockwise,
  ShieldWarning,
  Info,
  PencilSimple,
  Eye,
  Trash
} from "@phosphor-icons/react"

interface VehicleReportProps {
  onBack: () => void
}

interface VehicleIssue {
  id: number
  title: string
  description: string
  category: 'mechanical' | 'electrical' | 'bodywork' | 'interior' | 'other'
  severity: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  reportedAt: string
  vehicleInfo: {
    make: string
    model: string
    plateNumber: string
    year: number
  }
}

export function VehicleReport({ onBack }: VehicleReportProps) {
  const [showReportForm, setShowReportForm] = useState(false)
  const [editingReport, setEditingReport] = useState<VehicleIssue | null>(null)
  const [viewingReport, setViewingReport] = useState<VehicleIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<VehicleIssue[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<{ id: number, make: string, model: string, plateNumber: string }[]>([])

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: VehicleIssue['category'];
    severity: VehicleIssue['severity'];
    vehicleId: string;
  }>({
    title: '',
    description: '',
    category: 'mechanical',
    severity: 'medium',
    vehicleId: ''
  })

  const categories = {
    mechanical: { label: 'Mécanique', icon: <Wrench size={14} weight="bold" /> },
    electrical: { label: 'Électrique', icon: <Lightning size={14} weight="bold" /> },
    bodywork: { label: 'Carrosserie', icon: <PaintBrush size={14} weight="bold" /> },
    interior: { label: 'Intérieur', icon: <Chair size={14} weight="bold" /> },
    other: { label: 'Autre', icon: <DotsThree size={14} weight="bold" /> }
  }

  const severities = {
    low: { label: 'Faible', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    medium: { label: 'Modéré', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    high: { label: 'Élevé', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    urgent: { label: 'Urgent', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }

  const statuses = {
    open: { label: 'Ouvert', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <FileText size={12} weight="bold" /> },
    in_progress: { label: 'En cours', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: <ClockCounterClockwise size={12} weight="bold" /> },
    resolved: { label: 'Résolu', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: <CheckCircle size={12} weight="bold" /> },
    closed: { label: 'Fermé', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: <X size={12} weight="bold" /> }
  }

  useEffect(() => {
    fetchReports()
    fetchVehicles()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vehicle-reports')
      const data = await res.json()
      if (data.success) setReports(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles')
      const data = await res.json()
      if (data.success) {
        setAvailableVehicles(data.data)
        if (data.data.length > 0) setFormData(prev => ({ ...prev, vehicleId: data.data[0].id.toString() }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim() || !formData.vehicleId) return

    try {
      const url = editingReport
        ? `/api/vehicle-reports/${editingReport.id}`
        : '/api/vehicle-reports'

      const method = editingReport ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      await fetchReports()
      handleCloseForm()
    } catch (error) {
      console.error(error)
      alert("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce rapport ?")) return
    try {
      const res = await fetch(`/api/vehicle-reports/${id}`, { method: 'DELETE' })
      if (res.ok) fetchReports()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (report: VehicleIssue) => {
    setEditingReport(report)
    setFormData({
      title: report.title,
      description: report.description,
      category: report.category,
      severity: report.severity,
      // On essaie de trouver l'ID du véhicule correspondant dans availableVehicles
      // Mais le report.vehicleInfo n'a pas forcément l'ID. 
      // Pour l'instant on laisse tel quel ou on ajoute l'ID dans le GET API.
      // (J'ai ajouté vehicleTableId dans le schema, donc on l'aura)
      vehicleId: (report as any).vehicleTableId?.toString() || ""
    })
    setShowReportForm(true)
  }

  const handleCloseForm = () => {
    setShowReportForm(false)
    setEditingReport(null)
    setFormData({
      title: '',
      description: '',
      category: 'mechanical',
      severity: 'medium',
      vehicleId: availableVehicles[0]?.id.toString() || ''
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn px-4 sm:px-0">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border shadow-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-500/30"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Rapport d'État Véhicule
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Gestion de la flotte • {reports.length} signalements enregistrés
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-500 shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
        >
          <Plus size={20} weight="bold" /> Nouveau Rapport
        </button>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText size={20} weight="fill" />}
          label="Ouverts"
          value={reports.filter(r => r.status === 'open').length}
          color="blue"
        />
        <StatCard
          icon={<ClockCounterClockwise size={20} weight="bold" />}
          label="En cours"
          value={reports.filter(r => r.status === 'in_progress').length}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle size={20} weight="fill" />}
          label="Résolus"
          value={reports.filter(r => r.status === 'resolved').length}
          color="emerald"
        />
        <StatCard
          icon={<ShieldWarning size={20} weight="fill" />}
          label="Urgents"
          value={reports.filter(r => r.severity === 'urgent').length}
          color="red"
        />
      </div>

      {/* ── REPORTS LIST ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="driver-card-enter group p-6 rounded-3xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border hover:border-orange-500/30 transition-all shadow-sm hover:shadow-md">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{report.title}</h3>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statuses[report.status].bg} ${statuses[report.status].color}`}>
                      {statuses[report.status].icon} {statuses[report.status].label}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${severities[report.severity].bg} ${severities[report.severity].color}`}>
                      {report.severity === 'urgent' && <Warning size={10} weight="bold" />} {severities[report.severity].label}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        {categories[report.category].icon}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{categories[report.category].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        <Car size={14} weight="bold" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{report.vehicleInfo?.make} {report.vehicleInfo?.model} ({report.vehicleInfo?.plateNumber})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        <Clock size={14} weight="bold" />
                      </div>
                      <span className="font-mono text-gray-600 dark:text-gray-400 italic font-medium">{formatDate(report.reportedAt)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-4xl line-clamp-2">
                    {report.description}
                  </p>
                </div>

                <div className="flex md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setViewingReport(report)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"
                  >
                    <Eye size={16} weight="bold" /> Détails
                  </button>
                  {report.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleEdit(report)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                      >
                        <PencilSimple size={16} weight="bold" /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                      >
                        <Trash size={16} weight="bold" /> Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/5 bg-white/30 dark:bg-driver-card/30 backdrop-blur-sm">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car size={40} weight="light" className="text-gray-400 dark:text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun rapport actif</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">Vous n'avez pas encore soumis de rapport d'état pour vos véhicules.</p>
            <button
              onClick={() => setShowReportForm(true)}
              className="px-10 py-4 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-500 shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
            >
              Soumettre un rapport
            </button>
          </div>
        )}
      </div>

      {/* ── REPORT FORM MODAL ── */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-slide-up">

            <div className="h-28 bg-gradient-to-br from-orange-600 to-amber-600 p-8 flex flex-col justify-end relative">
              <button
                onClick={handleCloseForm}
                className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-all"
              >
                <X size={20} weight="bold" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                  <Warning size={24} weight="bold" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    {editingReport ? "Modifier le Signalement" : "Signalement de Problème"}
                  </h2>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-0.5">Assistance Maintenance</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest px-1 flex items-center gap-2">
                    <Car size={16} /> Véhicule concerné
                  </label>
                  <div className="relative group">
                    <select
                      value={formData.vehicleId}
                      required
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="dark:bg-black">Sélectionnez un véhicule</option>
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id.toString()} className="dark:bg-[#1a1a1a]">
                          {v.make} {v.model} ({v.plateNumber})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <DotsThree size={20} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest px-1 flex items-center gap-2">
                    <DotsThree size={16} /> Catégorie
                  </label>
                  <div className="relative group">
                    <select
                      value={formData.category}
                      required
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none cursor-pointer"
                    >
                      {Object.entries(categories).map(([key, { label }]) => (
                        <option key={key} value={key} className="dark:bg-[#1a1a1a]">{label}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <CaretLeft size={20} className="-rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest px-1 flex items-center gap-2">
                  <ShieldWarning size={16} /> Niveau de Gravité
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(severities).map(([key, { label, color, bg, border }]) => {
                    const isActive = formData.severity === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, severity: key as any })}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 flex flex-col items-center gap-1 ${isActive
                          ? `${border} ${bg} ${color} ring-4 ring-orange-500/5`
                          : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                      >
                        {isActive && <CheckCircle size={14} weight="bold" className="mb-0.5" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest px-1 flex items-center gap-2">
                  <PencilSimple size={16} /> Titre de l'incident
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Grincement au freinage..."
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest px-1 flex items-center gap-2">
                  <FileText size={16} /> Description détaillée
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Décrivez précisément quand le problème survient..."
                  className="w-full px-6 py-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 flex items-start gap-3 p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 dark:bg-blue-500/10 dark:border-blue-500/20">
                  <Info size={24} weight="fill" className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-normal uppercase tracking-wider">
                    Une notification sera envoyée au service de maintenance dès validation.
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 sm:flex-none px-10 py-4.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-10 py-4.5 rounded-2xl bg-orange-600 text-white font-black hover:bg-orange-500 shadow-2xl shadow-orange-600/30 active:scale-95 transition-all text-sm uppercase tracking-widest"
                  >
                    {editingReport ? "Mettre à jour" : "Transmettre"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS MODAL ── */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[110] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-[48px] shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statuses[viewingReport.status].bg} ${statuses[viewingReport.status].color}`}>
                  {statuses[viewingReport.status].label}
                </div>
                <button
                  onClick={() => setViewingReport(null)}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-orange-500 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                  {viewingReport.title}
                </h2>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Badge icon={<Car size={16} />} text={`${viewingReport.vehicleInfo?.make} ${viewingReport.vehicleInfo?.model}`} />
                  <Badge icon={<Wrench size={16} />} text={categories[viewingReport.category].label} />
                  <Badge icon={<Warning size={16} />} text={severities[viewingReport.severity].label} color={severities[viewingReport.severity].color} />
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-white/5 w-full" />

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest px-1">Description détaillée</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {viewingReport.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-[32px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <span className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Date du signalement</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(viewingReport.reportedAt)}</span>
                </div>
                <div className="p-6 rounded-[32px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <span className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Immatriculation</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{viewingReport.vehicleInfo?.plateNumber}</span>
                </div>
              </div>

              {viewingReport.status === 'open' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleEdit(viewingReport)
                      setViewingReport(null)
                    }}
                    className="flex-1 py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    Modifier ce rapport
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: 'blue' | 'purple' | 'emerald' | 'red' }) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    red: 'text-red-500 bg-red-500/10'
  }
  return (
    <div className="p-6 rounded-[32px] bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border shadow-sm group hover:border-orange-500/20 transition-all">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest">{label}</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Badge({ icon, text, color = "text-gray-500 dark:text-gray-400" }: { icon: any, text: string, color?: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {icon}
      {text}
    </div>
  )
}

"use client"

import { useState } from 'react'
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
  Info
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
  images?: string[]
}

export function VehicleReport({ onBack }: VehicleReportProps) {
  const [showReportForm, setShowReportForm] = useState(false)
  const [reports, setReports] = useState<VehicleIssue[]>([
    {
      id: 1,
      title: "Bruit étrange au freinage",
      description: "Un grincement se fait entendre lors du freinage, particulièrement à basse vitesse.",
      category: 'mechanical',
      severity: 'medium',
      status: 'in_progress',
      reportedAt: '2024-09-23T10:30:00Z',
      vehicleInfo: {
        make: 'Mercedes',
        model: 'Classe S',
        plateNumber: 'AB-123-CD',
        year: 2022
      }
    },
    {
      id: 2,
      title: "Climatisation défaillante",
      description: "L'air conditionné ne fonctionne plus côté passager.",
      category: 'mechanical',
      severity: 'low',
      status: 'resolved',
      reportedAt: '2024-09-20T14:15:00Z',
      vehicleInfo: {
        make: 'BMW',
        model: 'Série 7',
        plateNumber: 'EF-456-GH',
        year: 2023
      }
    }
  ])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'mechanical' as const,
    severity: 'medium' as const,
    vehicleId: 'mercedes-classe-s'
  })

  const vehicles = [
    { id: 'mercedes-classe-s', make: 'Mercedes', model: 'Classe S', plateNumber: 'AB-123-CD' },
    { id: 'bmw-serie-7', make: 'BMW', model: 'Série 7', plateNumber: 'EF-456-GH' },
    { id: 'audi-a8', make: 'Audi', model: 'A8', plateNumber: 'IJ-789-KL' }
  ]

  const categories = {
    mechanical: { label: 'Mécanique', icon: <Wrench size={14} weight="bold" /> },
    electrical: { label: 'Électrique', icon: <Lightning size={14} weight="bold" /> },
    bodywork: { label: 'Carrosserie', icon: <PaintBrush size={14} weight="bold" /> },
    interior: { label: 'Intérieur', icon: <Chair size={14} weight="bold" /> },
    other: { label: 'Autre', icon: <DotsThree size={14} weight="bold" /> }
  }

  const severities = {
    low: { label: 'Faible', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    medium: { label: 'Modéré', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    high: { label: 'Élevé', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    urgent: { label: 'Urgent', color: 'text-red-500', bg: 'bg-red-500/10' }
  }

  const statuses = {
    open: { label: 'Ouvert', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <FileText size={12} weight="bold" /> },
    in_progress: { label: 'En cours', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: <ClockCounterClockwise size={12} weight="bold" /> },
    resolved: { label: 'Résolu', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: <CheckCircle size={12} weight="bold" /> },
    closed: { label: 'Fermé', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: <X size={12} weight="bold" /> }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) return
    try {
      const response = await fetch('/api/vehicle-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const newReport: VehicleIssue = {
        id: result.id || 0,
        title: result.title || '',
        description: result.description || '',
        category: formData.category,
        severity: (result.severity as any) || 'medium',
        status: 'open',
        reportedAt: result.reportedAt || new Date().toISOString(),
        vehicleInfo: result.vehicleInfo || { make: '', model: '', year: 0, plateNumber: '' }
      }
      setReports(prev => [newReport, ...prev])
      setFormData({ title: '', description: '', category: 'mechanical', severity: 'medium', vehicleId: 'mercedes-classe-s' })
      setShowReportForm(false)
    } catch (error) {
      console.error(error)
    }
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-driver-card border border-gray-300 dark:border-driver-border text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Rapport d'État Véhicule
            </h1>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Gestion de la flotte • {reports.length} signalements
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 shadow-xl shadow-orange-500/10 transition-all"
        >
          <Plus size={18} weight="bold" /> Nouveau Rapport
        </button>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText size={16} weight="fill" />
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Ouverts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{reports.filter(r => r.status === 'open').length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <ClockCounterClockwise size={16} weight="bold" />
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">En cours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{reports.filter(r => r.status === 'in_progress').length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle size={16} weight="fill" />
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Résolus</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{reports.filter(r => r.status === 'resolved').length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldWarning size={16} weight="fill" />
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Urgents</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{reports.filter(r => r.severity === 'urgent').length}</p>
        </div>
      </div>

      {/* ── REPORTS LIST ── */}
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="driver-card-enter p-6 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border hover:border-gray-400 dark:hover:border-gray-700 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{report.title}</h3>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statuses[report.status].bg} ${statuses[report.status].color}`}>
                      {statuses[report.status].icon} {statuses[report.status].label}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${severities[report.severity].bg} ${severities[report.severity].color}`}>
                      {report.severity === 'urgent' && <Warning size={10} weight="bold" />} {severities[report.severity].label}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      {categories[report.category].icon} <span className="text-gray-600 dark:text-gray-400">{categories[report.category].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car size={14} weight="light" /> <span className="text-gray-600 dark:text-gray-400">{report.vehicleInfo.make} {report.vehicleInfo.model} ({report.vehicleInfo.plateNumber})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} weight="bold" /> <span className="font-mono text-gray-600 dark:text-gray-400">{formatDate(report.reportedAt)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                    {report.description}
                  </p>
                </div>

                <div className="flex md:flex-col gap-2 shrink-0">
                  <button className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                    Détails
                  </button>
                  {report.status === 'open' && (
                    <button className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 text-xs font-bold text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                      Modifier
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/5 bg-gray-50 dark:bg-driver-card">
            <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={32} weight="light" className="text-gray-500 dark:text-gray-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-500">Aucun rapport actif</h3>
            <p className="text-sm text-gray-500 dark:text-gray-600 mb-6">Tout semble en ordre avec la flotte.</p>
            <button
              onClick={() => setShowReportForm(true)}
              className="px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all"
            >
              Signaler maintenant
            </button>
          </div>
        )}
      </div>

      {/* ── REPORT FORM MODAL ── */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--color-driver-bg)] border border-[var(--color-driver-border)] rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

            <div className="h-24 bg-gradient-to-br from-orange-600 to-amber-700 p-6 flex flex-col justify-end relative">
              <button onClick={() => setShowReportForm(false)} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-gray-700 dark:text-white/80"><X size={20} weight="bold" /></button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Signalement de Problème</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Véhicule concerné</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-orange-500 transition-all appearance-none"
                  >
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-orange-500 transition-all appearance-none"
                  >
                    {Object.entries(categories).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Niveau de Gravité</label>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(severities).map(([key, { label, color, bg }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: key as any })}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border ${formData.severity === key ? `border-orange-500 ${bg} text-white` : 'border-white/5 bg-white/5 text-gray-500'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Titre de l'incident</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Bruit suspect, voyant allumé..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-1">Description détaillée</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Détaillez les circonstances..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <Info size={16} weight="fill" className="text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-300 leading-tight">
                    Une notification sera immédiatement envoyée au service de maintenance.
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-500 shadow-lg shadow-orange-500/20 transition-all"
                >
                  Transmettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

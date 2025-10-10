"use client"

import { useState } from 'react'

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
    mechanical: '🔧 Mécanique',
    electrical: '⚡ Électrique',
    bodywork: '🚗 Carrosserie',
    interior: '🪑 Intérieur',
    other: '❓ Autre'
  }

  const severities = {
    low: { label: '🟢 Faible', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    medium: { label: '🟡 Modéré', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    high: { label: '🟠 Élevé', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
    urgent: { label: '🔴 Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
  }

  const statuses = {
    open: { label: '📋 Ouvert', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    in_progress: { label: '🔄 En cours', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
    resolved: { label: '✅ Résolu', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    closed: { label: '❌ Fermé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }

    try {
      console.log('📤 Envoi du rapport véhicule...')
      
      const response = await fetch('/api/vehicle-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result: { 
        success: boolean; 
        message?: string; 
        error?: string;
        id?: number;
        title?: string;
        description?: string;
        severity?: string;
        reportedAt?: string;
        vehicleInfo?: {
          make: string;
          model: string;
          year: number;
          plateNumber: string;
        };
        emailStatus?: string;
        emailError?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du rapport');
      }

      console.log('✅ Rapport créé avec succès:', result.id)

      // Ajouter le nouveau rapport à la liste locale
      const newReport: VehicleIssue = {
        id: result.id || 0,
        title: result.title || '',
        description: result.description || '',
        category: formData.category, // Garder l'enum original
        severity: (result.severity as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        status: 'open',
        reportedAt: result.reportedAt || new Date().toISOString(),
        vehicleInfo: result.vehicleInfo || { make: '', model: '', year: 0, plateNumber: '' }
      }

      setReports(prev => [newReport, ...prev])
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        category: 'mechanical',
        severity: 'medium',
        vehicleId: 'mercedes-classe-s'
      })
      
      setShowReportForm(false)
      
      // Message de succès avec statut email
      let successMessage = '✅ Rapport créé avec succès !'
      if (result.emailStatus === 'sent') {
        successMessage += '\n📧 Notification envoyée aux administrateurs.'
      } else if (result.emailError) {
        successMessage += '\n⚠️ Rapport créé mais notification email échouée.'
      }
      
      alert(successMessage)

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur:', error)
      alert(`❌ Erreur: ${errorMessage}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rapport Véhicule
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Signalez un problème ou consultez vos rapports
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
          >
            + Nouveau Rapport
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400">📋</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rapports ouverts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reports.filter(r => r.status === 'open').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400">🔄</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En cours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reports.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Résolus</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reports.filter(r => r.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400">🔴</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Urgents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reports.filter(r => r.severity === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Signaler un Problème
              </h2>
              <button
                onClick={() => setShowReportForm(false)}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Véhicule *
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'mechanical' })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    {Object.entries(categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gravité *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(severities).map(([key, { label }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: key as 'medium' })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        formData.severity === key
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du problème *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Décrivez brièvement le problème..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Décrivez le problème en détail : quand cela se produit, conditions, symptômes..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors"
                >
                  Envoyer le Rapport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Mes Rapports ({reports.length})
        </h2>

        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statuses[report.status].color}`}>
                        {statuses[report.status].label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${severities[report.severity].color}`}>
                        {severities[report.severity].label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span>{categories[report.category]}</span>
                      <span>•</span>
                      <span>{report.vehicleInfo.make} {report.vehicleInfo.model} ({report.vehicleInfo.plateNumber})</span>
                      <span>•</span>
                      <span>{formatDate(report.reportedAt)}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 font-medium transition-colors">
                    Voir Détails
                  </button>
                  {report.status === 'open' && (
                    <button className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors">
                      Modifier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚗</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun rapport encore
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Vous n&apos;avez signalé aucun problème de véhicule pour le moment.
            </p>
            <button
              onClick={() => setShowReportForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            >
              Signaler un Problème
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

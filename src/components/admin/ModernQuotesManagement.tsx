"use client"

import React, { useState, useEffect } from "react"
import { X, Calendar, Clock, MapPin, Users, Car, Phone, Mail, FileText } from "lucide-react"
import { format } from "date-fns"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"

interface Quote {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string | null
  service: string
  preferredDate: string | null
  message: string
  status: 'pending' | 'in_progress' | 'sent' | 'accepted' | 'rejected' | 'expired'
  adminNotes: string | null
  estimatedPrice: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

const availableServices = [
  { id: 'transport', name: 'Transport standard', icon: '🚗' },
  { id: 'tour', name: 'Tour & Excursion', icon: '🎯' },
  { id: 'airport', name: 'Transfert aéroport', icon: '✈️' },
  { id: 'vip', name: 'Transport VIP', icon: '👑' },
  { id: 'rental', name: 'Location avec chauffeur', icon: '🤵' },
  { id: 'event', name: 'Transport événementiel', icon: '🎉' }
]

// Helper functions pour les dates sécurisées
const formatDateSafely = (dateValue: any, formatString: string = 'dd/MM/yyyy à HH:mm'): string => {
  if (!dateValue) return 'Non spécifiée'
  
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) {
      return 'Date invalide'
    }
    return format(date, formatString)
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

const toLocaleDateStringSafely = (dateValue: any): string => {
  if (!dateValue) return 'Non spécifiée'
  
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) {
      return 'Date invalide'
    }
    return date.toLocaleDateString('fr-FR')
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

export function ModernQuotesManagement() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'workflow' | 'cards' | 'table'>('workflow')
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([])
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false)
  const [showEditQuoteModal, setShowEditQuoteModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<any>(null)
  const [showQuoteDetailsModal, setShowQuoteDetailsModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  const [newQuoteForm, setNewQuoteForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfPeople: '',
    services: [] as string[],
    duration: '',
    startDate: '',
    departure: '',
    destination: '',
    cabinBaggage: '',
    checkedBaggage: '',
    paymentMode: '',
    description: '',
    estimatedPrice: ''
  })

  const [editQuoteForm, setEditQuoteForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfPeople: '',
    services: [] as string[],
    duration: '',
    startDate: '',
    departure: '',
    destination: '',
    cabinBaggage: '',
    checkedBaggage: '',
    paymentMode: '',
    description: '',
    status: '',
    estimatedPrice: ''
  })
  
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: '',
    priceRange: '',
    service: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  useEffect(() => {
    fetchQuotes()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [quotes, filters])

  const fetchQuotes = async () => {
    try {
      console.log('🔍 Chargement des devis...')
      const response = await fetch('/api/quotes')
      const result = await response.json()
      
      console.log('📊 API Response:', result)
      
      if (result.success) {
        console.log('✅ Devis chargés:', result.data.length, 'devis trouvés')
        setQuotes(result.data)
      } else {
        console.error('❌ Erreur API:', result.error)
        showError('Erreur lors du chargement des devis', 'Erreur de chargement')
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
      showError('Erreur lors du chargement des devis', 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...quotes]

    // Filtres
    if (filters.status) {
      filtered = filtered.filter(quote => quote.status === filters.status)
    }
    if (filters.service) {
      filtered = filtered.filter(quote => quote.service.toLowerCase().includes(filters.service.toLowerCase()))
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(quote => 
        quote.customerName.toLowerCase().includes(searchTerm) ||
        quote.customerEmail.toLowerCase().includes(searchTerm) ||
        quote.service.toLowerCase().includes(searchTerm) ||
        quote.message.toLowerCase().includes(searchTerm)
      )
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof Quote] as string
      let bValue = b[filters.sortBy as keyof Quote] as string
      
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt' || filters.sortBy === 'preferredDate') {
        // Gestion sécurisée des dates pour le tri
        const aDate = aValue ? new Date(aValue) : new Date(0)
        const bDate = bValue ? new Date(bValue) : new Date(0)
        
        // Vérifier si les dates sont valides
        const aTime = isNaN(aDate.getTime()) ? 0 : aDate.getTime()
        const bTime = isNaN(bDate.getTime()) ? 0 : bDate.getTime()
        
        aValue = aTime.toString()
        bValue = bTime.toString()
      }
      
      const result = aValue.localeCompare(bValue)
      return filters.sortOrder === 'asc' ? result : -result
    })

    setFilteredQuotes(filtered)
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: 'En attente', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: '⏳',
        dot: 'bg-yellow-500',
        step: 1
      },
      in_progress: { 
        label: 'En cours', 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: '🔄',
        dot: 'bg-blue-500',
        step: 2
      },
      sent: { 
        label: 'Envoyé', 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        icon: '📤',
        dot: 'bg-purple-500',
        step: 3
      },
      accepted: { 
        label: 'Accepté', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: '✅',
        dot: 'bg-green-500',
        step: 4
      },
      rejected: { 
        label: 'Rejeté', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: '❌',
        dot: 'bg-red-500',
        step: 4
      },
      expired: { 
        label: 'Expiré', 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        icon: '⏰',
        dot: 'bg-gray-500',
        step: 4
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const getStatusColor = (status: string) => {
    return getStatusConfig(status).color
  }

  const getStatusIcon = (status: string) => {
    return getStatusConfig(status).icon
  }

  const getStatusLabel = (status: string) => {
    return getStatusConfig(status).label
  }

  const updateQuoteStatus = async (quoteId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await fetchQuotes()
        showSuccess(
          `Devis mis à jour: ${getStatusLabel(newStatus)}`,
          'Mise à jour réussie'
        )
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du devis', 'Erreur')
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setNewQuoteForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setNewQuoteForm(prev => ({
      ...prev,
      services: checked 
        ? [...prev.services, serviceId]
        : prev.services.filter(s => s !== serviceId)
    }))
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditQuoteForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditServiceChange = (serviceId: string, checked: boolean) => {
    setEditQuoteForm(prev => ({
      ...prev,
      services: checked 
        ? [...prev.services, serviceId]
        : prev.services.filter(s => s !== serviceId)
    }))
  }

  const resetForm = () => {
    setNewQuoteForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      numberOfPeople: '',
      services: [],
      duration: '',
      startDate: '',
      departure: '',
      destination: '',
      cabinBaggage: '',
      checkedBaggage: '',
      paymentMode: '',
      description: '',
      estimatedPrice: ''
    })
  }

  const resetEditForm = () => {
    setEditQuoteForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      numberOfPeople: '',
      services: [],
      duration: '',
      startDate: '',
      departure: '',
      destination: '',
      cabinBaggage: '',
      checkedBaggage: '',
      paymentMode: '',
      description: '',
      status: '',
      estimatedPrice: ''
    })
  }

  const openQuoteDetails = (quote: any) => {
    setSelectedQuote(quote)
    setShowQuoteDetailsModal(true)
  }

  const openEditModal = (quote: any) => {
    // Préparer les données pour l'édition
    const services = quote.service ? quote.service.split(', ') : []
    const message = quote.message || ''
    
    // Parser le message pour extraire les informations
    const numberOfPeopleMatch = message.match(/pour (\d+) personne/)
    const durationMatch = message.match(/Durée: (\d+) jour/)
    const departureMatch = message.match(/Départ: ([^\n]+)/)
    const destinationMatch = message.match(/Destination: ([^\n]+)/)
    const cabinBaggageMatch = message.match(/Bagages cabine: (\d+)/)
    const checkedBaggageMatch = message.match(/Bagages soute: (\d+)/)
    const paymentModeMatch = message.match(/Mode de paiement souhaité: ([^\n]+)/)
    const descriptionMatch = message.match(/Description: (.+)$/s)

    setEditQuoteForm({
      customerName: quote.customerName || '',
      customerEmail: quote.customerEmail || '',
      customerPhone: quote.customerPhone || '',
      numberOfPeople: numberOfPeopleMatch ? numberOfPeopleMatch[1] : '',
      services: services,
      duration: durationMatch ? durationMatch[1] : '',
      startDate: quote.preferredDate ? (() => {
        try {
          const date = new Date(quote.preferredDate)
          return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
        } catch {
          return ''
        }
      })() : '',
      departure: departureMatch ? departureMatch[1].trim() : '',
      destination: destinationMatch ? destinationMatch[1].trim() : '',
      cabinBaggage: cabinBaggageMatch ? cabinBaggageMatch[1] : '',
      checkedBaggage: checkedBaggageMatch ? checkedBaggageMatch[1] : '',
      paymentMode: paymentModeMatch ? paymentModeMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      status: quote.status || 'pending',
      estimatedPrice: quote.estimatedPrice || ''
    })
    
    setSelectedQuote(quote)
    setShowEditQuoteModal(true)
  }

  const openDeleteConfirm = (quote: any) => {
    setSelectedQuote(quote)
    setShowDeleteConfirm(true)
  }

  const handleSubmitNewQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!newQuoteForm.customerName || !newQuoteForm.customerEmail || 
        !newQuoteForm.numberOfPeople || newQuoteForm.services.length === 0 ||
        !newQuoteForm.duration || !newQuoteForm.departure || !newQuoteForm.destination) {
      showError('Veuillez remplir tous les champs requis', 'Formulaire incomplet')
      return
    }

    setIsSubmitting(true)
    
    try {
      const quoteData = {
        customerName: newQuoteForm.customerName,
        customerEmail: newQuoteForm.customerEmail,
        customerPhone: newQuoteForm.customerPhone || null,
        service: newQuoteForm.services.join(', '), // Joindre les services sélectionnés
        preferredDate: newQuoteForm.startDate || null,
        message: `Demande de devis pour ${newQuoteForm.numberOfPeople} personne(s).
Services: ${newQuoteForm.services.join(', ')}
Durée: ${newQuoteForm.duration} jour(s)
Départ: ${newQuoteForm.departure}
Destination: ${newQuoteForm.destination}
Bagages cabine: ${newQuoteForm.cabinBaggage || 0}
Bagages soute: ${newQuoteForm.checkedBaggage || 0}
Mode de paiement souhaité: ${newQuoteForm.paymentMode || 'Non spécifié'}

Description: ${newQuoteForm.description}`,
        status: 'pending',
        estimatedPrice: newQuoteForm.estimatedPrice || null
      }

      console.log('📤 Envoi des données devis:', quoteData)

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })

      console.log('📨 Réponse API status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Devis créé avec succès:', result)
        
        console.log('🔄 Rechargement de la liste des devis...')
        await fetchQuotes()
        
        setShowNewQuoteModal(false)
        resetForm()
        showSuccess('Devis créé avec succès', 'Création réussie')
      } else {
        const errorData = await response.text()
        console.error('❌ Erreur API response:', errorData)
        throw new Error('Erreur lors de la création')
      }
    } catch (error) {
      console.error('❌ Erreur création devis:', error)
      showError('Erreur lors de la création du devis', 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!editQuoteForm.customerName || !editQuoteForm.customerEmail || 
        !editQuoteForm.numberOfPeople || editQuoteForm.services.length === 0 ||
        !editQuoteForm.duration || !editQuoteForm.departure || !editQuoteForm.destination) {
      showError('Veuillez remplir tous les champs requis', 'Formulaire incomplet')
      return
    }

    setIsSubmitting(true)
    
    try {
      const quoteData = {
        customerName: editQuoteForm.customerName,
        customerEmail: editQuoteForm.customerEmail,
        customerPhone: editQuoteForm.customerPhone || null,
        service: editQuoteForm.services.join(', '),
        preferredDate: editQuoteForm.startDate || null,
        message: `Demande de devis pour ${editQuoteForm.numberOfPeople} personne(s).
Services: ${editQuoteForm.services.join(', ')}
Durée: ${editQuoteForm.duration} jour(s)
Départ: ${editQuoteForm.departure}
Destination: ${editQuoteForm.destination}
Bagages cabine: ${editQuoteForm.cabinBaggage || 0}
Bagages soute: ${editQuoteForm.checkedBaggage || 0}
Mode de paiement souhaité: ${editQuoteForm.paymentMode || 'Non spécifié'}

Description: ${editQuoteForm.description}`,
        status: editQuoteForm.status,
        estimatedPrice: editQuoteForm.estimatedPrice || null
      }

      console.log('📤 Modification du devis ID:', selectedQuote.id, quoteData)

      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })

      console.log('📨 Réponse API status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Devis modifié avec succès:', result)
        
        console.log('🔄 Rechargement de la liste des devis...')
        await fetchQuotes()
        
        setShowEditQuoteModal(false)
        resetEditForm()
        setSelectedQuote(null)
        showSuccess('Devis modifié avec succès', 'Modification réussie')
      } else {
        const errorData = await response.text()
        console.error('❌ Erreur API response:', errorData)
        throw new Error('Erreur lors de la modification')
      }
    } catch (error) {
      console.error('❌ Erreur modification devis:', error)
      showError('Erreur lors de la modification du devis', 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteQuote = async () => {
    if (!selectedQuote) return

    setIsSubmitting(true)
    
    try {
      console.log('🗑️ Suppression du devis ID:', selectedQuote.id)

      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: 'DELETE'
      })

      console.log('📨 Réponse API status:', response.status)
      
      if (response.ok) {
        console.log('✅ Devis supprimé avec succès')
        
        console.log('🔄 Rechargement de la liste des devis...')
        await fetchQuotes()
        
        setShowDeleteConfirm(false)
        setSelectedQuote(null)
        showSuccess('Devis supprimé avec succès', 'Suppression réussie')
      } else {
        const errorData = await response.text()
        console.error('❌ Erreur API response:', errorData)
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('❌ Erreur suppression devis:', error)
      showError('Erreur lors de la suppression du devis', 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStats = () => {
    const total = quotes.length
    const pending = quotes.filter(q => q.status === 'pending').length
    const inProgress = quotes.filter(q => q.status === 'in_progress').length
    const sent = quotes.filter(q => q.status === 'sent').length
    const accepted = quotes.filter(q => q.status === 'accepted').length
    const rejected = quotes.filter(q => q.status === 'rejected').length
    const conversionRate = total > 0 ? (accepted / total * 100).toFixed(1) : '0'
    const totalValue = quotes
      .filter(q => q.status === 'accepted' && q.estimatedPrice)
      .reduce((sum, q) => sum + parseFloat(q.estimatedPrice!), 0)
    
    return { total, pending, inProgress, sent, accepted, rejected, conversionRate, totalValue }
  }

  const handleStatusChange = async (quoteId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await fetchQuotes()
        showSuccess(`Statut mis à jour vers "${getStatusConfig(newStatus).label}"`, 'Mise à jour réussie')
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du statut', 'Erreur')
    }
  }

  const handleSendQuote = async (quoteId: number) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        await fetchQuotes()
        showSuccess('Le devis a été envoyé par email au client', 'Envoi réussi')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de l\'envoi')
      }
    } catch (error) {
      showError('Une erreur est survenue lors de l\'envoi du devis', 'Erreur technique')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 dark:from-slate-900 dark:via-purple-900/10 dark:to-slate-900">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Gestion des devis
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Suivez le workflow complet de vos demandes de devis
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Actions en masse */}
              {selectedQuotes.length > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
                  <span className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                    {selectedQuotes.length} sélectionné(s)
                  </span>
                  <button className="text-sm bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700">
                    Actions groupées
                  </button>
                </div>
              )}

              {/* Boutons de vue */}
              <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('workflow')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'workflow'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Workflow
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cartes
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Tableau
                </button>
              </div>
              
              {/* Bouton Nouveau devis */}
              <button 
                onClick={() => setShowNewQuoteModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouveau devis
              </button>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">En attente</p>
                </div>
                <div className="text-2xl">⏳</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">En cours</p>
                </div>
                <div className="text-2xl">🔄</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.sent}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Envoyés</p>
                </div>
                <div className="text-2xl">📤</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Acceptés</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.conversionRate}%</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Conversion</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalValue.toFixed(0)} FCFA</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Valeur totale</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher un devis..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtre par statut */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="in_progress">🔄 En cours</option>
              <option value="sent">📤 Envoyé</option>
              <option value="accepted">✅ Accepté</option>
              <option value="rejected">❌ Rejeté</option>
              <option value="expired">⏰ Expiré</option>
            </select>

            {/* Filtre par service */}
            <input
              type="text"
              placeholder="Service..."
              value={filters.service}
              onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
            />

            {/* Filtre par date */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Toutes les dates</option>
              <option value="today">📅 Aujourd'hui</option>
              <option value="week">📅 Cette semaine</option>
              <option value="month">📅 Ce mois</option>
            </select>

            {/* Tri */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
              }}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="createdAt-desc">Plus récents</option>
              <option value="createdAt-asc">Plus anciens</option>
              <option value="preferredDate-asc">Date souhaitée ↑</option>
              <option value="preferredDate-desc">Date souhaitée ↓</option>
              <option value="customerName-asc">Client A-Z</option>
              <option value="customerName-desc">Client Z-A</option>
            </select>
          </div>

          {/* Résultats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredQuotes.length} devis trouvé{filteredQuotes.length > 1 ? 's' : ''}
            </p>
            
            {Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc') && (
              <button
                onClick={() => setFilters({ status: '', dateRange: '', search: '', priceRange: '', service: '', sortBy: 'createdAt', sortOrder: 'desc' })}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Vue Workflow */}
        {viewMode === 'workflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[
              { status: 'pending', title: 'Nouvelles demandes' },
              { status: 'in_progress', title: 'En préparation' },
              { status: 'sent', title: 'En attente client' },
              { status: 'accepted', title: 'Finalisés' }
            ].map(({ status, title }) => {
              const statusQuotes = filteredQuotes.filter(q => 
                status === 'accepted' 
                  ? ['accepted', 'rejected', 'expired'].includes(q.status)
                  : q.status === status
              )
              const statusConfig = getStatusConfig(status)
              
              return (
                <div key={status} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusConfig.dot}`}></div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {title}
                        </h3>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm px-2 py-1 rounded-full">
                        {statusQuotes.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {statusQuotes.map((quote) => {
                      const quoteStatusConfig = getStatusConfig(quote.status)
                      
                      return (
                        <div 
                          key={quote.id} 
                          className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer"
                          onClick={() => openQuoteDetails(quote)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              {quote.customerName}
                            </div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${quoteStatusConfig.color}`}>
                              {quoteStatusConfig.icon}
                            </span>
                          </div>
                          
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            🛎️ {quote.service}
                          </div>
                          
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate">
                            💬 {quote.message.substring(0, 50)}...
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              {toLocaleDateStringSafely(quote.createdAt)}
                            </span>
                            {quote.estimatedPrice && (
                              <span className="font-medium text-purple-600 dark:text-purple-400">
                                {quote.estimatedPrice} FCFA
                              </span>
                            )}
                          </div>
                          
                          {/* Actions rapides */}
                          <div className="mt-2 flex gap-1">
                            {quote.status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(quote.id, 'in_progress')
                                }}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                              >
                                Traiter
                              </button>
                            )}
                            {quote.status === 'in_progress' && quote.estimatedPrice && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSendQuote(quote.id)
                                }}
                                className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                              >
                                Envoyer
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {statusQuotes.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <div className="text-3xl mb-2">{statusConfig.icon}</div>
                        <p className="text-sm">Aucun devis {title.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vue en cartes */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-6">
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {quote.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {quote.customerName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {quote.service}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)} {getStatusLabel(quote.status)}
                      </span>
                    </div>
                  </div>

                  {/* Contenu de la demande */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                      {quote.message}
                    </p>
                  </div>

                  {/* Informations complémentaires */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Email:</span>
                      <span className="text-slate-900 dark:text-white font-medium">{quote.customerEmail}</span>
                    </div>
                    {quote.customerPhone && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Téléphone:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{quote.customerPhone}</span>
                      </div>
                    )}
                    {quote.preferredDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Date souhaitée:</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {toLocaleDateStringSafely(quote.preferredDate)}
                        </span>
                      </div>
                    )}
                    {quote.estimatedPrice && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Prix estimé:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{quote.estimatedPrice} FCFA</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {/* Boutons de statut */}
                    {quote.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateQuoteStatus(quote.id, 'in_progress')}
                          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Traiter
                        </button>
                        <button
                          onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                          className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {quote.status === 'in_progress' && (
                      <button
                        onClick={() => updateQuoteStatus(quote.id, 'sent')}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Envoyer
                      </button>
                    )}
                    
                    {/* Boutons CRUD */}
                    <button
                      onClick={() => openEditModal(quote)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(quote)}
                      className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Suppr
                    </button>
                    
                    <span className="text-xs text-slate-500 dark:text-slate-400 self-center ml-auto">
                      {toLocaleDateStringSafely(quote.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vue tableau */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuotes(filteredQuotes.map(q => q.id))
                          } else {
                            setSelectedQuotes([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Date souhaitée
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Prix estimé
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Créé le
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-600"
                          checked={selectedQuotes.includes(quote.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuotes([...selectedQuotes, quote.id])
                            } else {
                              setSelectedQuotes(selectedQuotes.filter(id => id !== quote.id))
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {quote.customerName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {quote.customerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {quote.service}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusIcon(quote.status)} {getStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {toLocaleDateStringSafely(quote.preferredDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {quote.estimatedPrice ? `${quote.estimatedPrice} FCFA` : 'À définir'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {toLocaleDateStringSafely(quote.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Boutons de statut */}
                          {quote.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateQuoteStatus(quote.id, 'in_progress')}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                              >
                                Traiter
                              </button>
                              <button
                                onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                              >
                                Refuser
                              </button>
                            </>
                          )}
                          {quote.status === 'in_progress' && (
                            <button
                              onClick={() => updateQuoteStatus(quote.id, 'sent')}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                            >
                              Envoyer
                            </button>
                          )}
                          
                          {/* Boutons CRUD */}
                          <button
                            onClick={() => openEditModal(quote)}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            title="Modifier le devis"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(quote)}
                            className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                            title="Supprimer le devis"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message si aucun devis */}
        {filteredQuotes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Aucun devis trouvé
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc')
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre premier devis'
              }
            </p>
            {!Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc') && (
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium">
                Créer un devis
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Nouveau devis */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Nouveau devis
                </h3>
                <button
                  onClick={() => setShowNewQuoteModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmitNewQuote} className="space-y-6">
                {/* Section Informations client */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informations client
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nom du client *
                      </label>
                      <input
                        type="text"
                        value={newQuoteForm.customerName}
                        onChange={(e) => handleFormChange('customerName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Nom complet du client"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newQuoteForm.customerEmail}
                        onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="email@exemple.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={newQuoteForm.customerPhone}
                        onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="+33 X XX XX XX XX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nombre de personnes *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newQuoteForm.numberOfPeople}
                        onChange={(e) => handleFormChange('numberOfPeople', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Ex: 4"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section Services et durée */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Services demandés
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Services (sélection multiple) *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableServices.map((service) => (
                          <label key={service.id} className="flex items-center gap-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newQuoteForm.services.includes(service.id)}
                              onChange={(e) => handleServiceChange(service.id, e.target.checked)}
                              className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-lg">{service.icon}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {service.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Durée (en jours) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={newQuoteForm.duration}
                          onChange={(e) => handleFormChange('duration', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                          placeholder="Ex: 3"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Date de début souhaitée
                        </label>
                        <input
                          type="date"
                          value={newQuoteForm.startDate}
                          onChange={(e) => handleFormChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Itinéraire */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Itinéraire
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Point de départ *
                      </label>
                      <input
                        type="text"
                        value={newQuoteForm.departure}
                        onChange={(e) => handleFormChange('departure', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Adresse, ville ou aéroport de départ"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Destination *
                      </label>
                      <input
                        type="text"
                        value={newQuoteForm.destination}
                        onChange={(e) => handleFormChange('destination', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Adresse, ville ou aéroport de destination"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section Bagages et paiement */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Bagages et paiement
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nombre de valises
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={newQuoteForm.cabinBaggage}
                            onChange={(e) => handleFormChange('cabinBaggage', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Cabine"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Bagages cabine</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={newQuoteForm.checkedBaggage}
                            onChange={(e) => handleFormChange('checkedBaggage', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Soute"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Bagages soute</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Mode de paiement souhaité
                      </label>
                      <select 
                        value={newQuoteForm.paymentMode}
                        onChange={(e) => handleFormChange('paymentMode', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Sélectionner</option>
                        <option value="cash">Espèces</option>
                        <option value="card">Carte bancaire</option>
                        <option value="transfer">Virement bancaire</option>
                        <option value="check">Chèque</option>
                        <option value="paypal">PayPal</option>
                        <option value="deferred">Paiement différé</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section Prix */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Prix estimé
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Prix du devis (FCFA)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={newQuoteForm.estimatedPrice}
                          onChange={(e) => handleFormChange('estimatedPrice', e.target.value)}
                          className="w-full px-3 py-2 pr-16 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                          placeholder="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">FCFA</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Laissez vide si le prix n'est pas encore déterminé
                      </p>
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <p className="mb-2">💡 <strong>Conseils tarifaires :</strong></p>
                        <ul className="text-xs space-y-1">
                          <li>• Transport standard : 300-600 FCFA/km</li>
                          <li>• Transport VIP : 900-1500 FCFA/km</li>
                          <li>• Transfert aéroport : tarif forfaitaire</li>
                          <li>• Location journée : 120.000-300.000 FCFA/jour</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Section Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description complémentaire
                  </label>
                  <textarea
                    rows={4}
                    value={newQuoteForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Informations supplémentaires, exigences particulières, remarques..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewQuoteModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
                  >
                    Créer le devis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de devis */}
      {showEditQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Modifier le devis #{selectedQuote?.id}
                </h2>
                <button
                  onClick={() => {
                    setShowEditQuoteModal(false)
                    setSelectedQuote(null)
                    resetEditForm()
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleEditQuote} className="space-y-6">
                {/* Section Informations client */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informations client
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={editQuoteForm.customerName}
                        onChange={(e) => handleEditFormChange('customerName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Nom et prénom du client"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={editQuoteForm.customerEmail}
                        onChange={(e) => handleEditFormChange('customerEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="email@exemple.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={editQuoteForm.customerPhone}
                        onChange={(e) => handleEditFormChange('customerPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nombre de personnes *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={editQuoteForm.numberOfPeople}
                        onChange={(e) => handleEditFormChange('numberOfPeople', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Nombre de voyageurs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Services */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Services demandés *
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableServices.map((service) => (
                      <label key={service.id} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editQuoteForm.services.includes(service.id)}
                          onChange={(e) => handleEditServiceChange(service.id, e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-lg">{service.icon}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {service.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Section Durée et dates */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Planning et durée *
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Durée du voyage (en jours) *
                      </label>
                      <select
                        required
                        value={editQuoteForm.duration}
                        onChange={(e) => handleEditFormChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Sélectionner la durée</option>
                        <option value="1">1 jour</option>
                        <option value="2">2 jours</option>
                        <option value="3">3 jours</option>
                        <option value="4">4 jours</option>
                        <option value="5">5 jours</option>
                        <option value="7">1 semaine</option>
                        <option value="14">2 semaines</option>
                        <option value="21">3 semaines</option>
                        <option value="30">1 mois</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Date de début souhaitée
                      </label>
                      <input
                        type="date"
                        value={editQuoteForm.startDate}
                        onChange={(e) => handleEditFormChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Itinéraire */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Itinéraire *
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Lieu de départ *
                      </label>
                      <input
                        type="text"
                        required
                        value={editQuoteForm.departure}
                        onChange={(e) => handleEditFormChange('departure', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Adresse ou ville de départ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Destination *
                      </label>
                      <input
                        type="text"
                        required
                        value={editQuoteForm.destination}
                        onChange={(e) => handleEditFormChange('destination', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Adresse ou ville de destination"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Bagages et paiement */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Bagages et paiement
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nombre de valises
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editQuoteForm.cabinBaggage}
                            onChange={(e) => handleEditFormChange('cabinBaggage', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Cabine"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Bagages cabine</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editQuoteForm.checkedBaggage}
                            onChange={(e) => handleEditFormChange('checkedBaggage', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Soute"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Bagages soute</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Mode de paiement souhaité
                      </label>
                      <select 
                        value={editQuoteForm.paymentMode}
                        onChange={(e) => handleEditFormChange('paymentMode', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Sélectionner</option>
                        <option value="cash">Espèces</option>
                        <option value="card">Carte bancaire</option>
                        <option value="transfer">Virement bancaire</option>
                        <option value="check">Chèque</option>
                        <option value="paypal">PayPal</option>
                        <option value="deferred">Paiement différé</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section Prix */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Prix estimé
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Prix du devis (FCFA)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editQuoteForm.estimatedPrice}
                          onChange={(e) => handleEditFormChange('estimatedPrice', e.target.value)}
                          className="w-full px-3 py-2 pr-16 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                          placeholder="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">FCFA</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Laissez vide si le prix n'est pas encore déterminé
                      </p>
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <p className="mb-2">💰 <strong>Gestion des prix :</strong></p>
                        <ul className="text-xs space-y-1">
                          <li>• Prix en Francs CFA (FCFA)</li>
                          <li>• Modifier selon les négociations</li>
                          <li>• Prix affiché au client sur le devis</li>
                          <li>• Validation automatique du format</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Statut */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Statut du devis
                  </h4>
                  
                  <select 
                    value={editQuoteForm.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="pending">En attente</option>
                    <option value="in_progress">En traitement</option>
                    <option value="sent">Envoyé</option>
                    <option value="accepted">Accepté</option>
                    <option value="rejected">Refusé</option>
                  </select>
                </div>

                {/* Section Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description complémentaire
                  </label>
                  <textarea
                    rows={4}
                    value={editQuoteForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Informations supplémentaires, exigences particulières, remarques..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditQuoteModal(false)
                      setSelectedQuote(null)
                      resetEditForm()
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Modification...' : 'Modifier le devis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Confirmer la suppression
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Cette action ne peut pas être annulée
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-700 dark:text-slate-300">
                  Êtes-vous sûr de vouloir supprimer le devis de{' '}
                  <span className="font-semibold">{selectedQuote.customerName}</span> ?
                </p>
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Service:</strong> {selectedQuote.service}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Date:</strong> {toLocaleDateStringSafely(selectedQuote.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setSelectedQuote(null)
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteQuote}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {showQuoteDetailsModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Détails du devis
              </h3>
              <button
                onClick={() => {
                  setShowQuoteDetailsModal(false)
                  setSelectedQuote(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Informations Client
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.clientName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedQuote.clientEmail}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={selectedQuote.clientPhone}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de création
                  </label>
                  <input
                    type="text"
                    value={formatDateSafely(selectedQuote.createdAt)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>

              {/* Quote Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Détails du trajet
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Point de départ
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.fromAddress}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.toAddress}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date de voyage
                    </label>
                    <input
                      type="text"
                      value={formatDateSafely((selectedQuote as any).travelDate || selectedQuote.preferredDate, 'dd/MM/yyyy')}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Heure de voyage
                    </label>
                    <input
                      type="text"
                      value={selectedQuote.travelTime}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de passagers
                    </label>
                    <input
                      type="text"
                      value={selectedQuote.passengers}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distance
                    </label>
                    <input
                      type="text"
                      value={`${selectedQuote.distance} km`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Informations tarifaires
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix estimé
                  </label>
                  <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {selectedQuote.estimatedPrice.toLocaleString()} FCFA
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedQuote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedQuote.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedQuote.status === 'pending' ? 'En attente' :
                       selectedQuote.status === 'approved' ? 'Approuvé' :
                       'Rejeté'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de véhicule
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.vehicleType}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            {selectedQuote.specialRequirements && (
              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Exigences particulières
                </h4>
                <textarea
                  value={selectedQuote.specialRequirements}
                  readOnly
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none"
                />
              </div>
            )}

            {/* Admin Notes (Editable) */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Notes administratives
              </h4>
              <textarea
                value={selectedQuote.adminNotes || ''}
                onChange={(e) => setSelectedQuote({
                  ...selectedQuote,
                  adminNotes: e.target.value
                })}
                placeholder="Ajoutez des notes administratives..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {selectedQuote.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleQuoteAction(selectedQuote.id, 'approved')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Traitement...' : 'Approuver le devis'}
                  </button>
                  <button
                    onClick={() => handleQuoteAction(selectedQuote.id, 'rejected')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Traitement...' : 'Rejeter le devis'}
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  // Save admin notes if modified
                  if (selectedQuote.adminNotes !== quotes.find(q => q.id === selectedQuote.id)?.adminNotes) {
                    // TODO: Implement save admin notes API call
                    console.log('Saving admin notes:', selectedQuote.adminNotes)
                  }
                  setShowQuoteDetailsModal(false)
                  setSelectedQuote(null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder et fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
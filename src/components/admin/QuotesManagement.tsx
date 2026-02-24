"use client";

import { useState, useEffect } from "react";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { FilterBar } from "@/components/ui/FilterBar";
import { useNotification } from "@/hooks/useNotification";
import { usePermissions } from "@/hooks/usePermissions";

interface Quote {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  service: string;
  preferredDate: string | null;
  message: string;
  status: 'pending' | 'in_progress' | 'sent' | 'accepted' | 'rejected' | 'expired';
  adminNotes: string | null;
  estimatedPrice: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export function QuotesManagement() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const { notifications, showSuccess, showError, removeNotification } = useNotification();
  const { canDelete } = usePermissions();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedQuotes, setPaginatedQuotes] = useState<Quote[]>([]);
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    status: 'pending' as 'pending' | 'in_progress' | 'sent' | 'accepted' | 'rejected' | 'expired',
    adminNotes: '',
    estimatedPrice: '',
    assignedTo: ''
  });

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, filters]);

  useEffect(() => {
    // Apply pagination to filtered quotes
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedQuotes(filteredQuotes.slice(startIndex, endIndex));
  }, [filteredQuotes, currentPage, itemsPerPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && !target.closest('[data-dropdown-container]')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      const result = await response.json();
      
      if (result.success) {
        setQuotes(result.data);
      } else {
        showError('Erreur lors du chargement des demandes de devis', 'Erreur de chargement');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de devis:', error);
      showError('Erreur lors du chargement des demandes de devis', 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quotes];

    if (filters.status) {
      filtered = filtered.filter(quote => quote.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.customerName.toLowerCase().includes(searchLower) ||
        quote.customerEmail.toLowerCase().includes(searchLower) ||
        quote.service.toLowerCase().includes(searchLower) ||
        quote.message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredQuotes(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingQuote) return;

    try {
      const response = await fetch(`/api/quotes/${editingQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await fetchQuotes();
        showSuccess('Demande de devis mise à jour avec succès', 'Mise à jour réussie');
        setIsModalOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        showError(`Erreur: ${error.error}`, 'Échec de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showError('Une erreur est survenue lors de la mise à jour', 'Erreur technique');
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchQuotes();
        showSuccess('Demande de devis supprimée avec succès', 'Suppression réussie');
      } else {
        const error = await response.json();
        showError(`Erreur: ${error.error}`, 'Échec de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Une erreur est survenue lors de la suppression', 'Erreur technique');
    }
  };

  const resetForm = () => {
    setFormData({
      status: 'pending',
      adminNotes: '',
      estimatedPrice: '',
      assignedTo: ''
    });
  };

  const openEditModal = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      status: quote.status,
      adminNotes: quote.adminNotes || '',
      estimatedPrice: quote.estimatedPrice || '',
      assignedTo: quote.assignedTo || ''
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingQuote(null);
    resetForm();
    setIsModalOpen(true);
  };

  const toggleDropdown = (quoteId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(prevId => prevId === quoteId ? null : quoteId);
  };

  const handleSendQuote = async (quoteId: number) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchQuotes();
        showSuccess('Le devis a été envoyé par email au client', 'Envoi réussi');
      } else {
        const error = await response.json();
        showError(`Erreur: ${error.error}`, 'Échec de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      showError('Une erreur est survenue lors de l\'envoi du devis', 'Erreur technique');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'sent': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ En attente';
      case 'in_progress': return '🔄 En cours';
      case 'sent': return '📤 Envoyé';
      case 'accepted': return '✅ Accepté';
      case 'rejected': return '❌ Rejeté';
      case 'expired': return '⏰ Expiré';
      default: return '❓ Inconnu';
    }
  };

  const getFilterCounts = () => {
    const statusCounts = quotes.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { statusCounts };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Chargement des demandes de devis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion demandes de devis
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nouvelle demande
        </button>
      </div>

      {/* Barre de filtres */}
      <FilterBar
        filters={{
          status: {
            label: 'Statut',
            options: [
              { value: '', label: 'Tous les statuts' },
              { value: 'pending', label: '⏳ En attente', count: getFilterCounts().statusCounts.pending },
              { value: 'in_progress', label: '🔄 En cours', count: getFilterCounts().statusCounts.in_progress },
              { value: 'sent', label: '📤 Envoyé', count: getFilterCounts().statusCounts.sent },
              { value: 'accepted', label: '✅ Accepté', count: getFilterCounts().statusCounts.accepted },
              { value: 'rejected', label: '❌ Rejeté', count: getFilterCounts().statusCounts.rejected },
              { value: 'expired', label: '⏰ Expiré', count: getFilterCounts().statusCounts.expired }
            ],
            value: filters.status,
            onChange: (value) => handleFilterChange('status', value)
          },
          search: {
            label: 'Recherche',
            placeholder: 'Nom, email, service...',
            value: filters.search,
            onChange: (value) => handleFilterChange('search', value),
            type: 'search'
          }
        }}
        onClearAll={() => {
          setFilters({ status: '', search: '' });
        }}
        activeFiltersCount={(filters.status ? 1 : 0) + (filters.search ? 1 : 0)}
      />

      {/* Tableau des demandes de devis */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date souhaitée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prix estimé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {quote.customerName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {quote.customerEmail}
                    </div>
                    {quote.customerPhone && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {quote.customerPhone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {quote.service}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {quote.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {quote.preferredDate ? new Date(quote.preferredDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {quote.estimatedPrice ? `${quote.estimatedPrice} FCFA` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative flex justify-end" data-dropdown-container>
                      <button
                        onClick={(e) => toggleDropdown(quote.id, e)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        type="button"
                      >
                        Actions...
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Menu déroulant */}
                      {openDropdownId === quote.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                          <div className="py-1">
                            {/* Option Modifier */}
                            <button
                              onClick={() => {
                                openEditModal(quote);
                                setOpenDropdownId(null);
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 w-full text-left transition-colors duration-200"
                            >
                              Modifier
                            </button>

                            {/* Option Envoyer le devis */}
                            {quote.status !== 'sent' && quote.estimatedPrice && (
                              <button
                                onClick={() => {
                                  handleSendQuote(quote.id);
                                  setOpenDropdownId(null);
                                }}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 w-full text-left transition-colors duration-200"
                              >
                                📤 Envoyer le devis
                              </button>
                            )}

                            {/* Option Supprimer - Seulement si autorisé */}
                            {canDelete('quotes') && (
                              <>
                                <div className="border-t border-gray-200 dark:border-gray-600"></div>
                                <button
                                  onClick={() => {
                                    handleDeleteQuote(quote.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors duration-200"
                                >
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredQuotes.length > 0 && (
          <div className="bg-white dark:bg-slate-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredQuotes.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredQuotes.length / itemsPerPage)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' '}à{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredQuotes.length)}
                    </span>
                    {' '}sur{' '}
                    <span className="font-medium">{filteredQuotes.length}</span>
                    {' '}devis
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Page précédente</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Pages numbers */}
                    {Array.from({ length: Math.ceil(filteredQuotes.length / itemsPerPage) }, (_, i) => i + 1).map((page) => {
                      const isCurrentPage = page === currentPage;
                      const showPage = (
                        page === 1 || 
                        page === Math.ceil(filteredQuotes.length / itemsPerPage) ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                      
                      if (!showPage) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredQuotes.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(filteredQuotes.length / itemsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Page suivante</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingQuote ? 'Modifier la demande de devis' : 'Nouvelle demande de devis'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="pending">⏳ En attente</option>
                  <option value="in_progress">🔄 En cours</option>
                  <option value="sent">📤 Envoyé</option>
                  <option value="accepted">✅ Accepté</option>
                  <option value="rejected">❌ Rejeté</option>
                  <option value="expired">⏰ Expiré</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prix estimé (FCFA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedPrice}
                  onChange={(e) => handleInputChange('estimatedPrice', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes administrateur
                </label>
                <textarea
                  value={formData.adminNotes}
                  onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Notes internes..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingQuote ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

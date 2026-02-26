"use client";

import { useState, useEffect } from "react";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { FilterBar } from "@/components/ui/FilterBar";
import { useNotification } from "@/hooks/useNotification";
import { usePermissions } from "@/hooks/usePermissions";
import {
  MagnifyingGlass as Search,
  Plus,
  Clock,
  Coins,
  User,
  Envelope as Mail,
  Phone,
  ArrowUpRight,
  CheckSquare,
  XCircle,
  PaperPlaneRight as Send,
  DotsThree as MoreHorizontal,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  FileText,
  Calendar
} from "@phosphor-icons/react"
import { StatusBadge } from '@/components/ui/StatusBadge';

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

  const getFilterCounts = () => {
    const statusCounts = quotes.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { statusCounts };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"
          style={{ borderColor: 'var(--color-gold) transparent transparent transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn p-2 lg:p-0">
      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Demandes de Devis</h2>
            <p className="text-xs text-slate-500 mt-1">Convertissez vos prospects en clients</p>
          </div>

          <div className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Rechercher client, service..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/10">
              <Plus size={16} />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>

        {[
          { label: 'Attente', value: getFilterCounts().statusCounts.pending || 0, color: 'var(--color-status-pending)', icon: <Clock size={16} /> },
          { label: 'En Cours', value: getFilterCounts().statusCounts.in_progress || 0, color: 'var(--color-status-inprogress)', icon: <Send size={16} /> },
          { label: 'Acceptés', value: getFilterCounts().statusCounts.accepted || 0, color: 'var(--color-status-confirmed)', icon: <CheckSquare size={16} /> },
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

      {/* Main Table Card */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.01]">
          {['', 'pending', 'in_progress', 'sent', 'accepted'].map((st) => (
            <button
              key={st}
              onClick={() => handleFilterChange('status', st)}
              className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all ${filters.status === st ? 'bg-gold text-black' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}>
              {st === '' ? 'Tout' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prospect</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service & Intention</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logistique</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Estimation</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors">{quote.customerName}</p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Mail size={10} /> {quote.customerEmail}</span>
                        {quote.customerPhone && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={10} /> {quote.customerPhone}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[200px]">
                      <p className="text-xs font-bold text-slate-300 mb-1">{quote.service}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{quote.message}"</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{quote.preferredDate ? new Date(quote.preferredDate).toLocaleDateString('fr-FR') : 'Date libre'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock size={12} />
                        <span className="font-mono">{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {quote.estimatedPrice ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-mono text-xs font-bold">
                        <Coins size={12} />
                        {parseInt(quote.estimatedPrice).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter italic">À chiffrer</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge statut={quote.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => openEditModal(quote)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        title="Détails / Éditer"
                      >
                        <FileText size={16} />
                      </button>
                      {quote.estimatedPrice && quote.status !== 'sent' && (
                        <button
                          onClick={() => handleSendQuote(quote.id)}
                          className="p-1.5 rounded-lg hover:bg-gold/10 text-slate-400 hover:text-gold transition-colors"
                          title="Envoyer le devis"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      {canDelete('quotes') && (
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
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

          {paginatedQuotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-slate-600">
                <FileText size={32} />
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Aucune demande de devis à afficher</p>
            </div>
          )}
        </div>

        {/* Improved Pagination */}
        {filteredQuotes.length > itemsPerPage && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Page {currentPage} sur {Math.ceil(filteredQuotes.length / itemsPerPage)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 disabled:opacity-30 hover:text-white hover:bg-white/10 transition-all">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredQuotes.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredQuotes.length / itemsPerPage)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 disabled:opacity-30 hover:text-white hover:bg-white/10 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Redesigned Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fadeIn p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative animate-slideUp"
            style={{ backgroundColor: 'var(--color-obsidian)' }}>

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-white leading-none">Traitement Dossier</h3>
                <p className="text-xs text-slate-500 mt-2">Référence : Q-{editingQuote?.id || 'NEW'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Statut du Dossier</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white cursor-pointer"
                  >
                    <option value="pending">⏳ En attente</option>
                    <option value="in_progress">🔄 En cours</option>
                    <option value="sent">📤 Envoyé</option>
                    <option value="accepted">✅ Accepté</option>
                    <option value="rejected">❌ Rejeté</option>
                    <option value="expired">⏰ Expiré </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Chiffrage Estimé (FCFA)</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={formData.estimatedPrice}
                      onChange={(e) => handleInputChange('estimatedPrice', e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                      placeholder="Montant total..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Notes Administrateur</label>
                <textarea
                  value={formData.adminNotes}
                  onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white resize-none"
                  placeholder="Notes internes pour l'équipe..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gold text-black py-3 rounded-2xl font-bold text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-gold/20"
                >
                  {editingQuote ? 'Mettre à jour le Dossier' : 'Générer Demande'}
                </button>
                {editingQuote?.estimatedPrice && editingQuote.status !== 'sent' && (
                  <button
                    type="button"
                    onClick={() => handleSendQuote(editingQuote.id)}
                    className="px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center"
                    title="Envoyer Devis Directement"
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications overlayed nicely */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

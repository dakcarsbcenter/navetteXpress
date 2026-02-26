"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { SelectDriver, InsertDriver } from '@/schema';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
  MagnifyingGlass as Search,
  Plus,
  Trash as Trash2,
  PencilSimple as Edit2,
  Phone,
  Envelope as Mail,
  FileText,
  User,
  ShieldCheck,
  ShieldWarning as ShieldAlert
} from "@phosphor-icons/react";
import { StatusBadge } from '@/components/ui/StatusBadge';

type DriverWithDetails = SelectDriver;

export function DriversManager() {
  const { data: session, status } = useSession();
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Formulaire état
  const [formData, setFormData] = useState<Partial<InsertDriver>>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    image: '',
    isActive: true,
  });

  useEffect(() => {
    // Only fetch drivers if user is authenticated and has admin role
    if (status === 'authenticated' && (session?.user as unknown as { role?: string })?.role === 'admin') {
      fetchDrivers();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');

      if (!response.ok) {
        console.error('Erreur HTTP:', response.status, response.statusText);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setDrivers(result.data);
      } else {
        console.error('Erreur lors du chargement des chauffeurs:', result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingDriver
        ? `/api/admin/drivers/${editingDriver.id}`
        : '/api/admin/drivers';

      const method = editingDriver ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchDrivers();
        resetForm();
        alert(editingDriver ? 'Chauffeur modifié avec succès!' : 'Chauffeur créé avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTargetId == null) return;
    try {
      const response = await fetch(`/api/admin/drivers/${deleteTargetId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await fetchDrivers();
        alert('Chauffeur supprimé avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      image: '',
      isActive: true,
    });
    setEditingDriver(null);
    setShowAddForm(false);
  };

  const startEdit = (driver: DriverWithDetails) => {
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      image: driver.image || '',
      isActive: driver.isActive,
    });
    setEditingDriver(driver);
    setShowAddForm(true);
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone && driver.phone.includes(searchTerm)) ||
    (driver.licenseNumber && driver.licenseNumber.includes(searchTerm))
  );

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <h3 className="text-lg font-semibold text-white mb-2">Accès restreint</h3>
          <p className="text-slate-400 text-sm">Seuls les administrateurs peuvent accéder à cette gestion.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"
          style={{ borderColor: 'var(--color-gold) transparent transparent transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Gestion des Chauffeurs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pilotez votre équipe de transporteurs</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/10 outline-none transition-all focus:border-gold/50"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: drivers.length, icon: <User size={18} />, color: 'var(--color-gold)' },
            { label: 'Actifs', value: drivers.filter(d => d.isActive).length, icon: <ShieldCheck size={18} />, color: '#10B981' },
            { label: 'Indispo', value: drivers.filter(d => !d.isActive).length, icon: <ShieldAlert size={18} />, color: '#EF4444' },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center"
              style={{ backgroundColor: 'var(--color-dash-card)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Form (Modal-like overlay or inline card) */}
      {showAddForm && (
        <div className="p-6 rounded-2xl border border-gold/20 bg-gold/5 animate-slideUp">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">
              {editingDriver ? 'Modifier le Profil' : 'Enregistrer un Chauffeur'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-white">Annuler</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nom Complet</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Professionnel</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Numéro de Permis</label>
                <input
                  type="text"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Photo URL (Optionnel)</label>
                <input
                  type="url"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-gold' : 'bg-white/10'}`} />
                  <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-4' : ''}`} />
                </div>
                <span className="ml-3 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  Chauffeur Actif et Disponible
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-gold text-black px-8 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-gold/10"
                >
                  {editingDriver ? 'Mettre à jour' : 'Confirmer Registration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Drivers Table Card */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-white">Équipage ({filteredDrivers.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identité</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documents</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center overflow-hidden border border-white/5">
                        {driver.image ? (
                          <Image src={driver.image} alt={driver.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <span className="text-gold font-bold text-xs" style={{ color: 'var(--color-gold)' }}>
                            {driver.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors">{driver.name}</p>
                        <p className="text-[10px] text-slate-500">ID: DX-{driver.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Mail size={12} className="text-slate-500" />
                        <span>{driver.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Phone size={12} className="text-slate-500" />
                        <span>{driver.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 w-fit">
                      <FileText size={12} className="text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-300">{driver.licenseNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge statut={driver.isActive ? 'confirmed' : 'cancelled'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(driver)}
                        className="p-1.5 rounded-lg hover:bg-gold/20 text-slate-400 hover:text-gold transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(parseInt(driver.id))}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDrivers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-slate-600">
                <Search size={32} />
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Aucun chauffeur ne correspond à votre recherche</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null); }}
        title="Désactivation Chauffeur"
        message="Êtes-vous certain de vouloir révoquer les accès de ce chauffeur ? Cette action pourra affecter les courses en cours."
        type="error"
        confirmText="Révoquer définitivement"
        onConfirm={handleDelete}
        showCancel={true}
        cancelText="Conserver"
      />
    </div>
  );
}



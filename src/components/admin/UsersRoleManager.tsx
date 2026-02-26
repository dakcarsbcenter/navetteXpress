"use client";

import { useState, useEffect } from 'react';
import {
  MagnifyingGlass as Search,
  Plus,
  Shield,
  ShieldCheck,
  ShieldWarning as ShieldAlert,
  Users,
  User,
  Info,
  Calendar,
  DotsThree as MoreHorizontal,
  XCircle,
  Crown,
  Briefcase,
  Car,
  Envelope as Mail,
  Fingerprint,
  Trash as Trash2,
  PencilSimple as Edit2
} from "@phosphor-icons/react";

export function UsersRoleManager() {
  const [userRoles, setUserRoles] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulaire état
  const [formData, setFormData] = useState({
    clerkUserId: '',
    role: 'driver' as 'driver' | 'admin' | 'manager' | 'customer',
  });

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const result = await response.json();

      if (result.success) {
        setUserRoles(result.data);
      } else {
        console.error('Erreur lors du chargement des rôles utilisateurs:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUserRoles();
        resetForm();
        alert('Rôle utilisateur assigné avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setFormData({
      clerkUserId: '',
      role: 'customer',
    });
    setShowAddForm(false);
  };

  const getRoleStyle = (role: string) => {
    const styles = {
      admin: { label: 'Admin', color: '#EF4444', icon: <Crown size={12} />, bg: 'rgba(239, 68, 68, 0.1)' },
      manager: { label: 'Gestionnaire', color: '#3B82F6', icon: <Briefcase size={12} />, bg: 'rgba(59, 130, 246, 0.1)' },
      driver: { label: 'Chauffeur', color: '#10B981', icon: <Car size={12} />, bg: 'rgba(16, 185, 129, 0.1)' },
      customer: { label: 'Client', color: '#A78BFA', icon: <User size={12} />, bg: 'rgba(167, 139, 250, 0.1)' },
    };
    return styles[role as keyof typeof styles] || styles.driver;
  };

  const filteredUserRoles = userRoles.filter(userRole =>
    userRole.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = {
    total: userRoles.length,
    admin: userRoles.filter(u => u.role === 'admin').length,
    manager: userRoles.filter(u => u.role === 'manager').length,
    driver: userRoles.filter(u => u.role === 'driver').length,
    customer: userRoles.filter(u => u.role === 'customer').length,
  };

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
      {/* Header & Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={20} className="text-gold" />
              Contrôle des Accès
            </h2>
            <p className="text-xs text-slate-500 mt-1">Gérez les privilèges et rôles de sécurité sur la plateforme</p>
          </div>

          <div className="mt-8 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Filtrer ID, rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-gold/10">
              <Plus size={16} />
              {showAddForm ? 'Fermer' : 'Nouvelle Assignation'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Admins', value: roleStats.admin, color: '#EF4444', icon: <Crown size={14} /> },
            { label: 'Managers', value: roleStats.manager, color: '#3B82F6', icon: <Briefcase size={14} /> },
            { label: 'Drivers', value: roleStats.driver, color: '#10B981', icon: <Car size={14} /> },
            { label: 'Customers', value: roleStats.customer, color: '#A78BFA', icon: <Users size={14} /> },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--color-dash-card)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <h3 className="text-lg font-bold text-white font-mono">{stat.value}</h3>
              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Access Assignment Form */}
      {showAddForm && (
        <div className="p-8 rounded-2xl border border-gold/20 bg-gold/5 animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Assignation de Privilèges</h3>
              <p className="text-xs text-slate-400">Ajoutez une couche de sécurité Clerk à un utilisateur</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Clerk User Identifier</label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-3 text-slate-500" />
                <input
                  type="text"
                  value={formData.clerkUserId}
                  onChange={(e) => setFormData({ ...formData, clerkUserId: e.target.value })}
                  placeholder="user_2abc123..."
                  required
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Niveau d'Autorité</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white cursor-pointer"
              >
                <option value="customer">👤 Client</option>
                <option value="driver">🚗 Chauffeur</option>
                <option value="manager">👨‍💼 Gestionnaire</option>
                <option value="admin">👑 Administrateur</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Ignorer
              </button>
              <button
                type="submit"
                className="btn-gold px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-gold/20"
              >
                Confirmer l'Assignation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registry Table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">Registre des Autorités ({filteredUserRoles.length})</h3>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-slate-500 uppercase">Live Sync</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identifiant Clerk</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Rôle Attribué</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Protection</th>
              </tr>
            </thead>
            <tbody>
              {filteredUserRoles.map((userRole) => {
                const style = getRoleStyle(userRole.role);
                return (
                  <tr key={userRole.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-gold transition-colors">
                          <Fingerprint size={16} />
                        </div>
                        <span className="font-mono text-xs text-slate-300 tracking-tighter">{userRole.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                          style={{ backgroundColor: style.bg, color: style.color }}>
                          {style.icon}
                          {style.label.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-500 transition-colors">
                          <ShieldCheck size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">Actif</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUserRoles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500 text-sm font-medium italic">Aucun enregistrement d'autorité trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Matrix Reference Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Shield size={20} />, title: "Admin Layer", desc: "Contrôle total des opérations, finances et accès système.", color: "#EF4444" },
          { icon: <Briefcase size={20} />, title: "Manager Layer", desc: "Coordination des ressources, flotte et planning équipage.", color: "#3B82F6" },
          { icon: <Car size={20} />, title: "Driver Layer", desc: "Accès restreint aux missions assignées et trajet personnel.", color: "#10B981" },
        ].map((guide, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
            style={{ backgroundColor: 'var(--color-dash-card)' }}>
            <div className="mb-4 text-slate-400" style={{ color: guide.color }}>{guide.icon}</div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">{guide.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{guide.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}







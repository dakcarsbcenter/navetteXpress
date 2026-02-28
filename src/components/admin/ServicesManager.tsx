'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, PencilSimple, Trash, ToggleLeft, ToggleRight,
    FloppyDisk, X, ArrowUp, ArrowDown, MagnifyingGlass,
    Spinner, CheckCircle
} from '@phosphor-icons/react';

/* ─── Types ──────────────────────────────────────────────────── */
interface Service {
    id: number;
    name: string;
    description: string;
    icon: string;
    slug: string;
    features: string[] | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

type FormState = {
    name: string;
    description: string;
    icon: string;
    slug: string;
    features: string[];
    sortOrder: number;
    isActive: boolean;
};

const EMPTY_FORM: FormState = {
    name: '', description: '', icon: '✈️', slug: '', features: [], sortOrder: 0, isActive: true,
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function toSlug(s: string) {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const POPULAR_ICONS = ['✈️', '🚗', '🚐', '🏛️', '👑', '⏰', '📝', '🚁', '🎭', '🌟', '🎯', '💼', '🛡️', '🌍', '🏖️', '🎪'];

/* ─── Component ───────────────────────────────────────────────── */
export function ServicesManager() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
    const [newFeature, setNewFeature] = useState('');

    /* ── Fetch ── */
    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/services');
            const json = await res.json();
            if (json.success) setServices(json.data);
            else setError(json.error || 'Erreur de chargement');
        } catch {
            setError('Impossible de contacter le serveur');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    /* ── Auto-slug ── */
    const handleNameChange = (name: string) => {
        setForm(f => ({ ...f, name, slug: editingId ? f.slug : toSlug(name) }));
    };

    /* ── Open modal ── */
    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowModal(true);
        setNewFeature('');
    };

    const openEdit = (s: Service) => {
        setForm({
            name: s.name,
            description: s.description,
            icon: s.icon,
            slug: s.slug,
            features: s.features || [],
            sortOrder: s.sortOrder,
            isActive: s.isActive,
        });
        setEditingId(s.id);
        setShowModal(true);
        setNewFeature('');
    };

    /* ── Feature Helpers ── */
    const addFeature = () => {
        if (!newFeature.trim()) return;
        if (form.features.includes(newFeature.trim())) return;
        setForm(f => ({ ...f, features: [...f.features, newFeature.trim()] }));
        setNewFeature('');
    };

    const removeFeature = (idx: number) => {
        setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
    };

    /* ── Save ── */
    const handleSave = async () => {
        if (!form.name.trim() || !form.description.trim() || !form.slug.trim()) {
            setError('Nom, description et slug sont requis.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!json.success) { setError(json.error || 'Erreur'); return; }
            setShowModal(false);
            await fetchServices();
        } catch {
            setError('Erreur réseau.');
        } finally {
            setSaving(false);
        }
    };

    /* ── Toggle active ── */
    const toggleActive = async (s: Service) => {
        try {
            const res = await fetch(`/api/admin/services/${s.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !s.isActive }),
            });
            const json = await res.json();
            if (json.success) {
                setServices(prev => prev.map(x => x.id === s.id ? json.data : x));
            }
        } catch { /* ignore */ }
    };

    /* ── Delete ── */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/services/${deleteTarget.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                setDeleteTarget(null);
                await fetchServices();
            } else {
                setError(json.error);
            }
        } catch {
            setError('Erreur réseau.');
        } finally {
            setSaving(false);
        }
    };

    /* ── Reorder ── */
    const moveService = async (s: Service, dir: -1 | 1) => {
        const sorted = [...services].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = sorted.findIndex(x => x.id === s.id);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;

        const swap = sorted[swapIdx];
        const newOrder1 = swap.sortOrder;
        const newOrder2 = s.sortOrder;

        // Swap optimistically
        setServices(prev => prev.map(x => {
            if (x.id === s.id) return { ...x, sortOrder: newOrder1 };
            if (x.id === swap.id) return { ...x, sortOrder: newOrder2 };
            return x;
        }));

        await Promise.all([
            fetch(`/api/admin/services/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: newOrder1 }) }),
            fetch(`/api/admin/services/${swap.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: newOrder2 }) }),
        ]);
    };

    /* ── Filtered list ── */
    const filtered = [...services]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        .filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.slug.toLowerCase().includes(search.toLowerCase())
        );

    /* ─────────────────────── RENDER ─────────────────────────── */
    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Gestion des Services</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {services.filter(s => s.isActive).length} actif(s) · {services.length} au total
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'var(--color-gold)', color: 'var(--color-midnight)' }}
                >
                    <Plus size={16} weight="bold" />
                    Nouveau service
                </button>
            </div>

            {/* ── Search ── */}
            <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un service..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-gold/40 transition-colors"
                    style={{ '--color-gold': 'var(--color-gold)' } as React.CSSProperties}
                />
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <X size={16} className="shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
                </div>
            )}

            {/* ── Table ── */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size={28} className="animate-spin text-gold" style={{ color: 'var(--color-gold)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-600">
                    <p className="text-sm">Aucun service trouvé.</p>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold w-10">#</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">Service</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold hidden md:table-cell">Slug</th>
                                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-widest text-slate-500 font-bold border-l border-white/5">Points forts</th>
                                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-widest text-slate-500 font-bold">Statut</th>
                                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ordre</th>
                                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filtered.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                                    {/* Icône + ordre */}
                                    <td className="px-4 py-3 text-xl text-center">{s.icon}</td>

                                    {/* Nom + description */}
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-white">{s.name}</p>
                                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{s.description}</p>
                                    </td>

                                    {/* Slug */}
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <code className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">{s.slug}</code>
                                    </td>

                                    {/* Features count */}
                                    <td className="px-4 py-3 text-center border-l border-white/5">
                                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                                            {s.features?.length || 0} points
                                        </span>
                                    </td>

                                    {/* Toggle actif */}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => toggleActive(s)}
                                            title={s.isActive ? 'Désactiver' : 'Activer'}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                                            style={{
                                                background: s.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: s.isActive ? '#10B981' : '#EF4444',
                                                border: `1px solid ${s.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                            }}
                                        >
                                            {s.isActive
                                                ? <><ToggleRight size={14} weight="fill" /> Actif</>
                                                : <><ToggleLeft size={14} /> Inactif</>
                                            }
                                        </button>
                                    </td>

                                    {/* Ordre */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => moveService(s, -1)}
                                                disabled={idx === 0}
                                                className="p-1 rounded text-slate-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <span className="text-[11px] font-mono text-slate-500 w-5 text-center">{s.sortOrder}</span>
                                            <button
                                                onClick={() => moveService(s, 1)}
                                                disabled={idx === filtered.length - 1}
                                                className="p-1 rounded text-slate-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(s)}
                                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                                title="Modifier"
                                            >
                                                <PencilSimple size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(s)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══════ MODAL CRÉATION / ÉDITION ═══════ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto dash-scroll"
                        style={{ backgroundColor: 'var(--color-dash-bg)' }}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">
                                {editingId ? 'Modifier le service' : 'Nouveau service'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Colonne Gauche: Infos de base */}
                            <div className="space-y-4">
                                {/* Icônes rapides */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Icône</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {POPULAR_ICONS.map(ic => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, icon: ic }))}
                                                className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-gold/20 ring-2 ring-gold/50' : 'bg-white/5 hover:bg-white/10'}`}
                                                style={{ '--color-gold': 'var(--color-gold)' } as React.CSSProperties}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        value={form.icon}
                                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                                        placeholder="Emoji ou texte..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold/40 transition-colors"
                                    />
                                </div>

                                {/* Nom */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Nom *</label>
                                    <input
                                        value={form.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="Transfert Aéroport"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold/40 transition-colors"
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Slug *</label>
                                    <input
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
                                        placeholder="transfert-aeroport"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-gold/40 transition-colors"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Description *</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Description courte..."
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold/40 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            {/* Colonne Droite: Points forts */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Points forts (Highlights)</label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            value={newFeature}
                                            onChange={e => setNewFeature(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                            placeholder="Ex: WiFi gratuit..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
                                        />
                                        <button
                                            type="button"
                                            onClick={addFeature}
                                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gold transition-colors"
                                        >
                                            <Plus size={18} weight="bold" />
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 dash-scroll">
                                        {form.features.length === 0 ? (
                                            <p className="text-[11px] text-slate-600 italic py-4 text-center">Aucun point fort ajouté.</p>
                                        ) : (
                                            form.features.map((feat, i) => (
                                                <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5 group/feat">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <CheckCircle size={14} className="text-gold shrink-0" weight="fill" />
                                                        <span className="text-xs text-white truncate">{feat}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFeature(i)}
                                                        className="text-slate-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Ordre + Statut */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Ordre</label>
                                        <input
                                            type="number"
                                            value={form.sortOrder}
                                            onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold/40 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Statut</label>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all"
                                            style={{
                                                background: form.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.1)',
                                                color: form.isActive ? '#10B981' : '#6b7280',
                                                borderColor: form.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(100,100,100,0.2)',
                                            }}
                                        >
                                            {form.isActive ? <><ToggleRight size={16} weight="fill" /> Actif</> : <><ToggleLeft size={16} /> Inactif</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400">{error}</p>}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); setError(null); }}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60 shadow-lg shadow-gold/10"
                                style={{ background: 'var(--color-gold)', color: 'var(--color-midnight)' }}
                            >
                                {saving ? <Spinner size={18} className="animate-spin" /> : <FloppyDisk size={18} weight="bold" />}
                                {editingId ? 'Enregistrer les modifications' : 'Créer le service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL SUPPRESSION ═══════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-sm rounded-2xl border border-red-500/20 shadow-2xl p-6 space-y-5"
                        style={{ backgroundColor: 'var(--color-dash-bg)' }}
                    >
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <Trash size={24} className="text-red-400" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">Supprimer ce service ?</h3>
                            <p className="text-sm text-slate-400">
                                <span className="text-white font-semibold">{deleteTarget.name}</span> sera supprimé définitivement.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-bold transition-all"
                            >
                                {saving ? <Spinner size={16} className="animate-spin" /> : <Trash size={16} />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

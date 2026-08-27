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
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const POPULAR_ICONS = ['✈️', '🚗', '🚐', '🏛️', '👑', '⏰', '📝', '🚁', '🎭', '🌟', '🎯', '💼', '🛡️', '🌍', '🏖️', '🎪'];

const inputStyle: React.CSSProperties = {
    width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px',
};

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

            {/* ── Header ── */}
            <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
                        Catalogue
                    </span>
                    <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                        Services proposés.
                    </h2>
                    <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
                        {services.filter(s => s.isActive).length} actif(s) · {services.length} au total
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2"
                    style={{ height: '40px', padding: '0 18px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    <Plus size={16} weight="bold" />
                    Nouveau service
                </button>
            </section>

            {/* ── Search ── */}
            <div style={{ position: 'relative', maxWidth: '360px' }}>
                <MagnifyingGlass size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un service..."
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                />
            </div>

            {/* ── Error ── */}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '4px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', color: '#B8493C', fontSize: '13px' }}>
                    <X size={16} style={{ flexShrink: 0 }} />
                    {error}
                    <button type="button" onClick={() => setError(null)} style={{ marginLeft: 'auto', color: '#B8493C' }}><X size={14} /></button>
                </div>
            )}

            {/* ── Table ── */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: '#E2DACD', borderTopColor: '#1F5245' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6E6A63', fontSize: '13px' }}>
                    Aucun service trouvé.
                </div>
            ) : (
                <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                                    <th style={{ padding: '12px 16px', width: '40px' }} />
                                    <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Service</th>
                                    <th className="hidden md:table-cell" style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Slug</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Points forts</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Statut</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Ordre</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s, idx) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #F0EAE0' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '20px', textAlign: 'center' }}>{s.icon}</td>

                                        <td style={{ padding: '12px 16px' }}>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#12100E' }}>{s.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6E6A63' }} className="line-clamp-1">{s.description}</p>
                                        </td>

                                        <td className="hidden md:table-cell" style={{ padding: '12px 16px' }}>
                                            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#3d3a35', backgroundColor: '#F7F3EC', padding: '2px 8px', borderRadius: '2px' }}>{s.slug}</code>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6E6A63', backgroundColor: '#F7F3EC', padding: '3px 9px', borderRadius: '2px' }}>
                                                {s.features?.length || 0} points
                                            </span>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(s)}
                                                title={s.isActive ? 'Désactiver' : 'Activer'}
                                                className="inline-flex items-center gap-1.5"
                                                style={{
                                                    height: '26px', padding: '0 10px', borderRadius: '2px', cursor: 'pointer',
                                                    fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                                                    backgroundColor: s.isActive ? 'rgba(31,82,69,.10)' : 'rgba(110,106,99,.12)',
                                                    color: s.isActive ? '#1F5245' : '#6E6A63',
                                                }}
                                            >
                                                {s.isActive
                                                    ? <><ToggleRight size={14} weight="fill" /> Actif</>
                                                    : <><ToggleLeft size={14} /> Inactif</>
                                                }
                                            </button>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => moveService(s, -1)}
                                                    disabled={idx === 0}
                                                    style={{ padding: '4px', color: '#6E6A63', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                                                >
                                                    <ArrowUp size={14} />
                                                </button>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6E6A63', width: '20px', textAlign: 'center' }}>{s.sortOrder}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => moveService(s, 1)}
                                                    disabled={idx === filtered.length - 1}
                                                    style={{ padding: '4px', color: '#6E6A63', cursor: idx === filtered.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === filtered.length - 1 ? 0.3 : 1 }}
                                                >
                                                    <ArrowDown size={14} />
                                                </button>
                                            </div>
                                        </td>

                                        <td style={{ padding: '12px 16px' }}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(s)}
                                                    title="Modifier"
                                                    style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: 'pointer' }}
                                                >
                                                    <PencilSimple size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(s)}
                                                    title="Supprimer"
                                                    style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#B8493C', cursor: 'pointer' }}
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
                </section>
            )}

            {/* ═══════ MODAL CRÉATION / ÉDITION ═══════ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setShowModal(false)} />
                    <div
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto dash-scroll relative"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div className="flex items-center justify-between">
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E', letterSpacing: '-0.01em' }}>
                                {editingId ? 'Modifier le service' : 'Nouveau service'}
                            </h3>
                            <button type="button" onClick={() => setShowModal(false)} style={{ color: '#6E6A63' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Colonne Gauche: Infos de base */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Icônes rapides */}
                                <div>
                                    <label style={labelStyle}>Icône</label>
                                    <div className="flex flex-wrap gap-2" style={{ marginBottom: '8px' }}>
                                        {POPULAR_ICONS.map(ic => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, icon: ic }))}
                                                className="flex items-center justify-center"
                                                style={{
                                                    width: '36px', height: '36px', fontSize: '18px', borderRadius: '3px',
                                                    border: form.icon === ic ? '1px solid #1F5245' : '1px solid #E2DACD',
                                                    backgroundColor: form.icon === ic ? 'rgba(31,82,69,.08)' : '#FFFFFF',
                                                }}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        value={form.icon}
                                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                                        placeholder="Emoji ou texte..."
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Nom *</label>
                                    <input
                                        value={form.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="Transfert Aéroport"
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Slug *</label>
                                    <input
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
                                        placeholder="transfert-aeroport"
                                        style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Description *</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Description courte..."
                                        rows={4}
                                        style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Colonne Droite: Points forts */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Points forts (Highlights)</label>
                                    <div className="flex gap-2" style={{ marginBottom: '10px' }}>
                                        <input
                                            value={newFeature}
                                            onChange={e => setNewFeature(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                            placeholder="Ex: WiFi gratuit..."
                                            style={{ ...inputStyle, flex: 1, height: '38px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={addFeature}
                                            style={{ padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#1F5245' }}
                                        >
                                            <Plus size={16} weight="bold" />
                                        </button>
                                    </div>

                                    <div className="dash-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {form.features.length === 0 ? (
                                            <p style={{ fontSize: '12px', color: '#6E6A63', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>Aucun point fort ajouté.</p>
                                        ) : (
                                            form.features.map((feat, i) => (
                                                <div key={i} className="flex items-center justify-between gap-3" style={{ padding: '10px 12px', borderRadius: '3px', border: '1px solid #E2DACD' }}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <CheckCircle size={14} style={{ color: '#1F5245', flexShrink: 0 }} weight="fill" />
                                                        <span style={{ fontSize: '12.5px', color: '#12100E' }} className="truncate">{feat}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeFeature(i)} style={{ color: '#6E6A63' }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Ordre + Statut */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label style={labelStyle}>Ordre</label>
                                        <input
                                            type="number"
                                            value={form.sortOrder}
                                            onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Statut</label>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                            className="flex items-center justify-center gap-2"
                                            style={{
                                                width: '100%', height: '42px', borderRadius: '3px', fontSize: '13px', fontWeight: 600,
                                                border: `1px solid ${form.isActive ? 'rgba(31,82,69,.35)' : '#E2DACD'}`,
                                                backgroundColor: form.isActive ? 'rgba(31,82,69,.08)' : '#F7F3EC',
                                                color: form.isActive ? '#1F5245' : '#6E6A63',
                                            }}
                                        >
                                            {form.isActive ? <><ToggleRight size={16} weight="fill" /> Actif</> : <><ToggleLeft size={16} /> Inactif</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <p style={{ margin: 0, fontSize: '12px', color: '#B8493C' }}>{error}</p>}

                        {/* Actions */}
                        <div className="flex gap-3" style={{ paddingTop: '16px', borderTop: '1px solid #E2DACD' }}>
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); setError(null); }}
                                style={{ flex: 1, height: '42px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center justify-center gap-2"
                                style={{ flex: 1, height: '42px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
                            >
                                {saving ? <Spinner size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
                                {editingId ? 'Enregistrer les modifications' : 'Créer le service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL SUPPRESSION ═══════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setDeleteTarget(null)} />
                    <div className="relative w-full max-w-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '24px', textAlign: 'center' }}>
                        <div className="mx-auto" style={{ width: '56px', height: '56px', borderRadius: '4px', backgroundColor: 'rgba(184,73,60,.10)', border: '1px solid rgba(184,73,60,.25)', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                            <Trash size={24} style={{ color: '#B8493C' }} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#12100E' }}>Supprimer ce service ?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#3d3a35' }}>
                            <strong style={{ color: '#12100E' }}>{deleteTarget.name}</strong> sera supprimé définitivement.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                style={{ flex: 1, height: '40px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={saving}
                                className="flex items-center justify-center gap-2"
                                style={{ flex: 1, height: '40px', backgroundColor: '#B8493C', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
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

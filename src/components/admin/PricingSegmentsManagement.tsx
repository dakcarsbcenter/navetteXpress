'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, PencilSimple, Trash, ToggleLeft, ToggleRight,
    FloppyDisk, X, ArrowUp, ArrowDown, MagnifyingGlass,
    Spinner, Tag
} from '@phosphor-icons/react';
import { ROUTE_NODE_KEYS, ROUTE_NODE_LABELS, type RouteNodeKey } from '@/lib/route-nodes';

/* ─── Types ──────────────────────────────────────────────────── */
type DotColor = 'accent' | 'ink' | 'gold';
type ZoneKey = 'dakar' | 'aibd' | 'petite-cote';

interface PricingSegment {
    id: number;
    route: string;
    distance: string;
    duree: string;
    berline: number;
    suv: number;
    dot: DotColor;
    zones: ZoneKey[] | null;
    departNode: RouteNodeKey | null;
    arriveeNode: RouteNodeKey | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

type FormState = {
    route: string;
    distance: string;
    duree: string;
    berline: string;
    suv: string;
    dot: DotColor;
    zones: ZoneKey[];
    departNode: RouteNodeKey | '';
    arriveeNode: RouteNodeKey | '';
    sortOrder: number;
    isActive: boolean;
};

const EMPTY_FORM: FormState = {
    route: '', distance: '', duree: '', berline: '', suv: '', dot: 'accent', zones: [], departNode: '', arriveeNode: '', sortOrder: 0, isActive: true,
};

const DOT_OPTIONS: { key: DotColor; label: string; color: string }[] = [
    { key: 'accent', label: 'Vert (accent)', color: '#1F5245' },
    { key: 'ink', label: 'Noir (ink)', color: '#12100E' },
    { key: 'gold', label: 'Or (gold)', color: '#B08D45' },
];

const ZONE_OPTIONS: { key: ZoneKey; label: string }[] = [
    { key: 'dakar', label: 'Depuis Dakar' },
    { key: 'aibd', label: 'Depuis AIBD' },
    { key: 'petite-cote', label: 'Petite Côte' },
];

const inputStyle: React.CSSProperties = {
    width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px',
};

const formatXof = (n: number) => `${n.toLocaleString('fr-FR')}`;

/* ─── Component ───────────────────────────────────────────────── */
export function PricingSegmentsManagement() {
    const [segments, setSegments] = useState<PricingSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PricingSegment | null>(null);

    /* ── Fetch ── */
    const fetchSegments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/pricing-segments');
            const json = await res.json();
            if (json.success) setSegments(json.data);
            else setError(json.error || 'Erreur de chargement');
        } catch {
            setError('Impossible de contacter le serveur');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSegments(); }, [fetchSegments]);

    /* ── Open modal ── */
    const openCreate = () => {
        setForm({ ...EMPTY_FORM, sortOrder: segments.length });
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (s: PricingSegment) => {
        setForm({
            route: s.route,
            distance: s.distance,
            duree: s.duree,
            berline: String(s.berline),
            suv: String(s.suv),
            dot: s.dot,
            zones: s.zones || [],
            departNode: s.departNode || '',
            arriveeNode: s.arriveeNode || '',
            sortOrder: s.sortOrder,
            isActive: s.isActive,
        });
        setEditingId(s.id);
        setShowModal(true);
    };

    const toggleZone = (zone: ZoneKey) => {
        setForm(f => ({
            ...f,
            zones: f.zones.includes(zone) ? f.zones.filter(z => z !== zone) : [...f.zones, zone],
        }));
    };

    /* ── Save ── */
    const handleSave = async () => {
        if (!form.route.trim() || !form.distance.trim() || !form.duree.trim()) {
            setError('Trajet, distance et durée sont requis.');
            return;
        }
        if (form.berline.trim() === '' || form.suv.trim() === '' || Number(form.berline) < 0 || Number(form.suv) < 0) {
            setError('Les prix berline et SUV doivent être des nombres positifs.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const url = editingId ? `/api/admin/pricing-segments/${editingId}` : '/api/admin/pricing-segments';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, berline: Number(form.berline), suv: Number(form.suv) }),
            });
            const json = await res.json();
            if (!json.success) { setError(json.error || 'Erreur'); return; }
            setShowModal(false);
            await fetchSegments();
        } catch {
            setError('Erreur réseau.');
        } finally {
            setSaving(false);
        }
    };

    /* ── Toggle active ── */
    const toggleActive = async (s: PricingSegment) => {
        try {
            const res = await fetch(`/api/admin/pricing-segments/${s.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !s.isActive }),
            });
            const json = await res.json();
            if (json.success) {
                setSegments(prev => prev.map(x => x.id === s.id ? json.data : x));
            }
        } catch { /* ignore */ }
    };

    /* ── Delete ── */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/pricing-segments/${deleteTarget.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                setDeleteTarget(null);
                await fetchSegments();
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
    const moveSegment = async (s: PricingSegment, dir: -1 | 1) => {
        const sorted = [...segments].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = sorted.findIndex(x => x.id === s.id);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;

        const swap = sorted[swapIdx];
        const newOrder1 = swap.sortOrder;
        const newOrder2 = s.sortOrder;

        setSegments(prev => prev.map(x => {
            if (x.id === s.id) return { ...x, sortOrder: newOrder1 };
            if (x.id === swap.id) return { ...x, sortOrder: newOrder2 };
            return x;
        }));

        await Promise.all([
            fetch(`/api/admin/pricing-segments/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: newOrder1 }) }),
            fetch(`/api/admin/pricing-segments/${swap.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: newOrder2 }) }),
        ]);
    };

    /* ── Filtered list ── */
    const filtered = [...segments]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        .filter(s => s.route.toLowerCase().includes(search.toLowerCase()));

    /* ─────────────────────── RENDER ─────────────────────────── */
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

            {/* ── Header ── */}
            <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
                        Référentiel
                    </span>
                    <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                        Tarifs par segment.
                    </h2>
                    <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
                        {segments.filter(s => s.isActive).length} actif(s) · {segments.length} au total — affichés sur la page /tarifs
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2"
                    style={{ height: '40px', padding: '0 18px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    <Plus size={16} weight="bold" />
                    Nouveau segment
                </button>
            </section>

            {/* ── Search ── */}
            <div style={{ position: 'relative', maxWidth: '360px' }}>
                <MagnifyingGlass size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un trajet..."
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
                    Aucun segment de tarif trouvé.
                </div>
            ) : (
                <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                                    <th style={{ padding: '12px 16px', width: '30px' }} />
                                    <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Trajet</th>
                                    <th className="hidden md:table-cell" style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Distance / Durée</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Berline</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>SUV</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Statut</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Ordre</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s, idx) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #F0EAE0' }}>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                                                    backgroundColor: DOT_OPTIONS.find(d => d.key === s.dot)?.color || '#1F5245',
                                                }}
                                            />
                                        </td>

                                        <td style={{ padding: '12px 16px' }}>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#12100E' }}>{s.route}</p>
                                            {s.zones && s.zones.length > 0 && (
                                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                                                    {s.zones.join(' · ')}
                                                </p>
                                            )}
                                            {s.departNode && s.arriveeNode ? (
                                                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#1F5245' }}>
                                                    Auto-prix : {ROUTE_NODE_LABELS[s.departNode]} ↔ {ROUTE_NODE_LABELS[s.arriveeNode]}
                                                </p>
                                            ) : (
                                                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#B08D45' }}>
                                                    Auto-prix désactivé
                                                </p>
                                            )}
                                        </td>

                                        <td className="hidden md:table-cell" style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#3d3a35' }}>
                                                {s.distance} · {s.duree}
                                            </span>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#12100E' }}>
                                            {formatXof(s.berline)}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#6E6A63' }}>
                                            {formatXof(s.suv)}
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
                                                    onClick={() => moveSegment(s, -1)}
                                                    disabled={idx === 0}
                                                    style={{ padding: '4px', color: '#6E6A63', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                                                >
                                                    <ArrowUp size={14} />
                                                </button>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6E6A63', width: '20px', textAlign: 'center' }}>{s.sortOrder}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => moveSegment(s, 1)}
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
                                {editingId ? 'Modifier le segment' : 'Nouveau segment de tarif'}
                            </h3>
                            <button type="button" onClick={() => setShowModal(false)} style={{ color: '#6E6A63' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Colonne Gauche */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Trajet *</label>
                                    <input
                                        value={form.route}
                                        onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
                                        placeholder="Dakar Plateau → AIBD"
                                        style={inputStyle}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label style={labelStyle}>Départ (auto-prix)</label>
                                        <select
                                            value={form.departNode}
                                            onChange={e => setForm(f => ({ ...f, departNode: e.target.value as RouteNodeKey | '' }))}
                                            style={inputStyle}
                                        >
                                            <option value="">— Non utilisé —</option>
                                            {ROUTE_NODE_KEYS.map(key => (
                                                <option key={key} value={key}>{ROUTE_NODE_LABELS[key]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Arrivée (auto-prix)</label>
                                        <select
                                            value={form.arriveeNode}
                                            onChange={e => setForm(f => ({ ...f, arriveeNode: e.target.value as RouteNodeKey | '' }))}
                                            style={inputStyle}
                                        >
                                            <option value="">— Non utilisé —</option>
                                            {ROUTE_NODE_KEYS.map(key => (
                                                <option key={key} value={key}>{ROUTE_NODE_LABELS[key]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <p style={{ margin: '-8px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                                    Si renseignés, ce prix s&apos;affiche automatiquement dans le formulaire de réservation quand le client choisit ce couple départ/arrivée (dans un sens ou l&apos;autre).
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label style={labelStyle}>Distance *</label>
                                        <input
                                            value={form.distance}
                                            onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
                                            placeholder="47 km"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Durée *</label>
                                        <input
                                            value={form.duree}
                                            onChange={e => setForm(f => ({ ...f, duree: e.target.value }))}
                                            placeholder="55 min"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label style={labelStyle}>Prix Berline (FCFA) *</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.berline}
                                            onChange={e => setForm(f => ({ ...f, berline: e.target.value }))}
                                            placeholder="25000"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Prix SUV (FCFA) *</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.suv}
                                            onChange={e => setForm(f => ({ ...f, suv: e.target.value }))}
                                            placeholder="42000"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Ordre</label>
                                    <input
                                        type="number"
                                        value={form.sortOrder}
                                        onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Colonne Droite */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Repère (couleur)</label>
                                    <div className="flex flex-col gap-2">
                                        {DOT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, dot: opt.key }))}
                                                className="flex items-center gap-2"
                                                style={{
                                                    height: '38px', padding: '0 12px', borderRadius: '3px', textAlign: 'left',
                                                    border: form.dot === opt.key ? '1px solid #1F5245' : '1px solid #E2DACD',
                                                    backgroundColor: form.dot === opt.key ? 'rgba(31,82,69,.08)' : '#FFFFFF',
                                                    fontSize: '13px', color: '#12100E',
                                                }}
                                            >
                                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: opt.color, flexShrink: 0 }} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Zones (filtres page tarifs)</label>
                                    <div className="flex flex-col gap-2">
                                        {ZONE_OPTIONS.map(opt => (
                                            <label
                                                key={opt.key}
                                                className="flex items-center gap-2"
                                                style={{
                                                    height: '38px', padding: '0 12px', borderRadius: '3px', cursor: 'pointer',
                                                    border: form.zones.includes(opt.key) ? '1px solid #1F5245' : '1px solid #E2DACD',
                                                    backgroundColor: form.zones.includes(opt.key) ? 'rgba(31,82,69,.08)' : '#FFFFFF',
                                                    fontSize: '13px', color: '#12100E',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.zones.includes(opt.key)}
                                                    onChange={() => toggleZone(opt.key)}
                                                    style={{ accentColor: '#1F5245' }}
                                                />
                                                {opt.label}
                                            </label>
                                        ))}
                                    </div>
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
                                {editingId ? 'Enregistrer les modifications' : 'Créer le segment'}
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
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#12100E' }}>Supprimer ce segment ?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#3d3a35' }}>
                            <strong style={{ color: '#12100E' }}>{deleteTarget.route}</strong> sera supprimé définitivement.
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

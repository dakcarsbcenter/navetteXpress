'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Megaphone,
    Plus,
    ChartBar,
    Eye,
    CursorClick,
    Calendar,
    PencilSimple,
    Trash,
    CheckCircle,
    Clock,
    PauseCircle,
    XCircle,
    ArrowRight
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Ad {
    id: string;
    title: string;
    advertiser: string;
    type: string;
    placement: string;
    status: string;
    impressions: number;
    clicks: number;
    startDate: string;
    endDate: string;
}

export default function PublicitesClient({ ads: initialAds }: { ads: Ad[] }) {
    const [ads, setAds] = useState(initialAds);
    const [loading, setLoading] = useState(false);

    const stats = {
        total: ads.length,
        active: ads.filter(a => a.status === 'active').length,
        totalImpressions: ads.reduce((acc, a) => acc + (a.impressions || 0), 0),
        totalClicks: ads.reduce((acc, a) => acc + (a.clicks || 0), 0),
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle size={20} className="text-emerald-500" />;
            case 'draft': return <Clock size={20} className="text-amber-500" />;
            case 'paused': return <PauseCircle size={20} className="text-blue-500" />;
            case 'expired': return <XCircle size={20} className="text-rose-500" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Active';
            case 'draft': return 'Brouillon';
            case 'paused': return 'En pause';
            case 'expired': return 'Expirée';
            default: return status;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAds(ads.filter(a => a.id !== id));
            } else {
                alert('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Megaphone weight="fill" className="text-indigo-600" />
                        Gestion des Publicités
                    </h1>
                    <p className="text-slate-500 mt-1">Créez et gérez vos campagnes publicitaires sur le site</p>
                </div>
                <Link
                    href="/admin/publicites/nouvelle"
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-indigo-100"
                >
                    <Plus weight="bold" />
                    Nouvelle Publicité
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Megaphone size={24} weight="duotone" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-sm text-slate-500">Total publicités</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <CheckCircle size={24} weight="duotone" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
                    <div className="text-sm text-slate-500">Campagnes actives</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Eye size={24} weight="duotone" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalImpressions.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">Total impressions</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <CursorClick size={24} weight="duotone" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalClicks.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">Total clics (CTR: {stats.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) : 0}%)</div>
                </div>
            </div>

            {/* Ad List Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Publicité</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Emplacement</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Statut</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Dates</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Performance</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {ads.length > 0 ? ads.map((ad) => (
                                <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{ad.title}</div>
                                        <div className="text-sm text-slate-500">{ad.advertiser} • {ad.type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 uppercase tracking-wider">
                                            {ad.placement.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-medium text-sm">
                                            {getStatusIcon(ad.status)}
                                            <span className={ad.status === 'active' ? 'text-emerald-700' : ad.status === 'expired' ? 'text-rose-700' : 'text-slate-700'}>
                                                {getStatusLabel(ad.status)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 flex items-center gap-1">
                                            <Calendar size={14} />
                                            {format(new Date(ad.startDate), 'dd MMM', { locale: fr })} - {format(new Date(ad.endDate), 'dd MMM yyyy', { locale: fr })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">IMPRESSIONS / CLICS</div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-semibold text-slate-900">{ad.impressions || 0}</span>
                                            <span className="text-slate-300">/</span>
                                            <span className="text-sm font-semibold text-indigo-600">{ad.clicks || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/publicites/${ad.id}`}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <PencilSimple size={20} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(ad.id)}
                                                disabled={loading}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Supprimer"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Megaphone size={40} weight="thin" />
                                            <p>Aucune publicité trouvée</p>
                                            <Link href="/admin/publicites/nouvelle" className="text-indigo-600 font-medium hover:underline">
                                                Créer votre première campagne
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FloppyDisk,
    X,
    Image as ImageIcon,
    Video as VideoIcon,
    TextT,
    Cards,
    Calendar,
    MapPin,
    Link as LinkIcon,
    Info,
    ChartBar
} from '@phosphor-icons/react';
import { ImageUploader } from '@/components/ImageUploader';

interface AdFormProps {
    initialData?: any;
    isEditing?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
    mode?: 'page' | 'modal';
}

const PLACEMENTS = [
    { value: 'home_hero', label: 'Accueil — Après Hero' },
    { value: 'home_services', label: 'Accueil — Après Services' },
    { value: 'home_fleet', label: 'Accueil — Après Flotte' },
    { value: 'home_testimonials', label: 'Accueil — Après Témoignages' },
    { value: 'page_temoignages', label: 'Page Témoignages' },
    { value: 'page_flotte', label: 'Page Flotte' },
    { value: 'page_services', label: 'Page Services' },
    { value: 'client_dashboard', label: 'Dashboard Client' },
    { value: 'confirmation', label: 'Page Confirmation' },
];

const TYPES = [
    { value: 'banner_image', label: 'Bannière Image (Statique)', icon: <ImageIcon /> },
    { value: 'banner_animated', label: 'Bannière Animée (GIF/MP4)', icon: <VideoIcon /> },
    { value: 'text_sponsored', label: 'Texte Sponsorisé', icon: <TextT /> },
    { value: 'card_sponsored', label: 'Card Sponsorisée (Image + Texte)', icon: <Cards /> },
];

const STATUSES = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'En pause' },
];

export default function AdForm({ initialData, isEditing = false, onSuccess, onCancel, mode = 'page' }: AdFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        advertiser: initialData?.advertiser || '',
        type: initialData?.type || 'banner_image',
        placement: initialData?.placement || 'home_hero',
        status: initialData?.status || 'draft',
        destinationUrl: initialData?.destinationUrl || '',
        imageUrl: initialData?.imageUrl || '',
        videoUrl: initialData?.videoUrl || '',
        altText: initialData?.altText || '',
        headline: initialData?.headline || '',
        description: initialData?.description || '',
        ctaLabel: initialData?.ctaLabel || 'En savoir plus',
        width: initialData?.width || null,
        height: initialData?.height || null,
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        priceXof: initialData?.priceXof || '',
        invoiceRef: initialData?.invoiceRef || '',
        notes: initialData?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEditing ? `/api/ads/${initialData.id}` : '/api/ads';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    width: formData.width ? parseInt(formData.width.toString()) : null,
                    height: formData.height ? parseInt(formData.height.toString()) : null,
                    priceXof: formData.priceXof ? parseInt(formData.priceXof.toString()) : null,
                }),
            });

            if (res.ok) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push('/admin/dashboard?tab=ads');
                    router.refresh();
                }
            } else {
                const error = await res.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Erreur lors de l’enregistrement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Basic Info */}
            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Info weight="bold" className="text-indigo-600" />
                    Informations de base
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Titre de la campagne (interne)</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Ex: Campagne Berlines Mars 2024"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Annonceur</label>
                        <input
                            type="text"
                            name="advertiser"
                            value={formData.advertiser}
                            onChange={handleChange}
                            required
                            placeholder="Ex: Navette Xpress ou Partenaire"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Type de publicité</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                        >
                            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Emplacement</label>
                        <select
                            name="placement"
                            value={formData.placement}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                        >
                            {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Statut initial</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                        >
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
                    <LinkIcon weight="bold" className="text-indigo-600" />
                    Contenu et Liens
                </h2>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">URL de destination (au clic)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <LinkIcon size={18} />
                        </div>
                        <input
                            type="url"
                            name="destinationUrl"
                            value={formData.destinationUrl}
                            onChange={handleChange}
                            required
                            placeholder="https://..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(formData.type.includes('image') || formData.type === 'card_sponsored') && (
                        <div className="space-y-1.5">
                            <ImageUploader
                                label="Image publicitaire"
                                currentImage={formData.imageUrl}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                                folder="navette-xpress/ads"
                                required={formData.type.includes('image')}
                            />
                        </div>
                    )}
                    {formData.type === 'banner_animated' && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">URL de la vidéo (MP4/GIF)</label>
                            <input
                                type="text"
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleChange}
                                placeholder="URL de la vidéo publicitaire"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    )}
                </div>

                {(formData.type === 'text_sponsored' || formData.type === 'card_sponsored') && (
                    <div className="grid grid-cols-1 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Titre accrocheur (Headline)</label>
                            <input
                                type="text"
                                name="headline"
                                value={formData.headline}
                                onChange={handleChange}
                                placeholder="Le titre qui apparaîtra sur la publicité"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Description / Message</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Le texte descriptif de la publicité"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        {formData.type === 'card_sponsored' && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Texte du bouton (CTA)</label>
                                <input
                                    type="text"
                                    name="ctaLabel"
                                    value={formData.ctaLabel}
                                    onChange={handleChange}
                                    placeholder="Ex: Réserver, En savoir plus..."
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Scheduling & Billing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
                        <Calendar weight="bold" className="text-indigo-600" />
                        Planification
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Date de début</label>
                            <input
                                type="datetime-local"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Date de fin</label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
                        <ChartBar weight="bold" className="text-indigo-600" />
                        Facturation & Note
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Référence Facture</label>
                            <input
                                type="text"
                                name="invoiceRef"
                                value={formData.invoiceRef}
                                onChange={handleChange}
                                placeholder="Ex: F-2024-001"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Montant (XOF)</label>
                            <input
                                type="number"
                                name="priceXof"
                                value={formData.priceXof}
                                onChange={handleChange}
                                placeholder="Montant total de la campagne"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                            />
                        </div>
                    </div>
                </section>
            </div>

            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Notes Internes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Informations supplémentaires pour l'équipe admin..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </section>

            {/* Footer Actions */}
            <div className={`${mode === 'modal' ? 'mt-8 flex justify-end' : 'fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-40 flex justify-center'} gap-4`}>
                <button
                    type="button"
                    onClick={() => onCancel ? onCancel() : router.back()}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <X weight="bold" />
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 rounded-xl bg-indigo-600 border border-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                >
                    <FloppyDisk weight="bold" />
                    {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer la publicité'}
                </button>
            </div>
        </form>
    );
}

'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowSquareOut, Megaphone } from '@phosphor-icons/react';

interface Ad {
    id: string;
    title: string;
    type: 'banner_image' | 'banner_animated' | 'text_sponsored' | 'card_sponsored';
    imageUrl?: string;
    videoUrl?: string;
    altText?: string;
    headline?: string;
    description?: string;
    ctaLabel?: string;
    destinationUrl: string;
    width?: number;
    height?: number;
}

interface AdSlotProps {
    placement: string;
    className?: string;
}

export default function AdSlot({ placement, className = "" }: AdSlotProps) {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const trackedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        async function fetchAds() {
            try {
                const res = await fetch(`/api/ads?placement=${placement}`);
                if (res.ok) {
                    const data = await res.json();
                    setAds(data);
                }
            } catch (error) {
                console.error(`Erreur AdSlot [${placement}]:`, error);
            } finally {
                setLoading(false);
            }
        }
        fetchAds();
    }, [placement]);

    // Tracking d'impression
    useEffect(() => {
        if (ads.length > 0) {
            ads.forEach(ad => {
                if (!trackedRef.current.has(ad.id)) {
                    trackEvent(ad.id, 'impression');
                    trackedRef.current.add(ad.id);
                }
            });
        }
    }, [ads]);

    const trackEvent = async (id: string, type: 'impression' | 'click') => {
        try {
            await fetch(`/api/ads/${id}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
        } catch (e) {
            // Silencieux
        }
    };

    const handleAdClick = (ad: Ad) => {
        trackEvent(ad.id, 'click');
    };

    if (loading || ads.length === 0) return null;

    return (
        <div className={`w-full py-8 ${className}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col gap-6">
                    {ads.map((ad) => (
                        <div key={ad.id} className="relative group">
                            <a
                                href={ad.destinationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleAdClick(ad)}
                                className="block overflow-hidden rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                            >
                                {/* Render by type */}
                                {ad.type === 'banner_image' && ad.imageUrl && (
                                    <div className="relative w-full aspect-21/9 md:aspect-3/1">
                                        <img
                                            src={ad.imageUrl}
                                            alt={ad.altText || ad.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                )}

                                {ad.type === 'banner_animated' && (ad.videoUrl || ad.imageUrl) && (
                                    <div className="relative w-full aspect-21/9 md:aspect-3/1 bg-slate-900">
                                        {ad.videoUrl ? (
                                            <video
                                                src={ad.videoUrl}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={ad.imageUrl}
                                                alt={ad.altText || ad.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                )}

                                {ad.type === 'text_sponsored' && (
                                    <div className="bg-indigo-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Sponsorisé</span>
                                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                                    <Megaphone size={12} /> {ad.title}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">{ad.headline}</h3>
                                            <p className="text-slate-600 line-clamp-2">{ad.description}</p>
                                        </div>
                                        <div className="text-indigo-600 font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                            {ad.ctaLabel || 'En savoir plus'}
                                            <ArrowSquareOut size={20} />
                                        </div>
                                    </div>
                                )}

                                {ad.type === 'card_sponsored' && (
                                    <div className="flex flex-col md:flex-row bg-white overflow-hidden">
                                        {ad.imageUrl && (
                                            <div className="md:w-1/3 aspect-video md:aspect-square shrink-0">
                                                <img
                                                    src={ad.imageUrl}
                                                    alt={ad.altText || ad.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="p-6 flex flex-col justify-center flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Sponsorisé</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{ad.headline}</h3>
                                            <p className="text-slate-600 mb-4 line-clamp-2">{ad.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm group-hover:bg-indigo-700 transition-colors">
                                                    {ad.ctaLabel || 'Découvrir'}
                                                    <ArrowSquareOut size={16} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </a>

                            {/* Badge "Publicité" visible mais discret */}
                            <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
                                <span className="text-[8px] bg-white/80 px-1 rounded border border-slate-200 uppercase font-bold text-slate-400">Pub</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

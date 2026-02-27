import type { Metadata } from 'next';
import AdForm from '@/components/admin/ads/AdForm';
import { Megaphone, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import { requireAdminRole } from '@/utils/admin-permissions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Modifier Publicité | Navette Xpress',
    robots: { index: false },
};

async function getAd(id: string) {
    const url = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/ads/${id}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

export default async function ModifierPublicitePage({ params }: { params: { id: string } }) {
    await requireAdminRole();
    const ad = await getAd(params.id);

    if (!ad) {
        notFound();
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <PencilSimple size={28} weight="bold" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        Modifier : {ad.title}
                    </h1>
                    <p className="text-slate-500">Mettez à jour les paramètres de votre campagne</p>
                </div>
            </div>

            <AdForm initialData={ad} isEditing={true} />
        </div>
    );
}

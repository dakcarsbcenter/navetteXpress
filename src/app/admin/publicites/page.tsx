import type { Metadata } from 'next';
import PublicitesClient from '@/components/admin/ads/PublicitesClient';
import { requireAdminRole } from '@/utils/admin-permissions';

export const metadata: Metadata = {
    title: 'Gestion Publicités | Navette Xpress',
    robots: { index: false },
};

// Récupérer toutes les pubs côté serveur
async function getAds() {
    const url = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/ads/all`;
    const res = await fetch(url, {
        cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function PublicitesPage() {
    await requireAdminRole();
    const ads = await getAds();

    return (
        <div className="p-0">
            <PublicitesClient ads={ads} />
        </div>
    );
}

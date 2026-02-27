import type { Metadata } from 'next';
import AdForm from '@/components/admin/ads/AdForm';
import { Megaphone } from '@phosphor-icons/react/dist/ssr';
import { requireAdminRole } from '@/utils/admin-permissions';

export const metadata: Metadata = {
    title: 'Nouvelle Publicité | Navette Xpress',
    robots: { index: false },
};

export default async function NouvellePublicitePage() {
    await requireAdminRole();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <Megaphone size={28} weight="bold" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nouvelle Publicité</h1>
                    <p className="text-slate-500">Configurez votre nouvelle campagne publicitaire</p>
                </div>
            </div>

            <AdForm />
        </div>
    );
}

import { requireAdminRole } from "@/utils/admin-permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navigation } from "@/components/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const userId = await requireAdminRole();
  const session = await getServerSession(authOptions);

  return (
    <div className="font-sans min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation variant="solid" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 mt-20">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Tableau de Bord Administrateur
            </h1>
            <span className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
              ADMIN - {session?.user?.name || "Administrateur"}
            </span>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Interface d&apos;administration Navette Xpress - Accès complet système
          </p>
        </div>

        <AdminDashboard />
      </div>
    </div>
  );
}


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";

// Données de démonstration pour les courses
const todayRides = [
  {
    id: 1,
    client: "M. Dubois",
    pickup: "Aéroport Charles de Gaulle",
    destination: "Hotel Plaza Athénée, Dakar",
    time: "14:30",
    status: "En cours",
    vehicle: "Mercedes Classe S",
    duration: "45 min",
    phone: "+33 6 12 34 56 78",
    price: 180,
    progress: 75
  },
  {
    id: 2,
    client: "Mme. Martin", 
    pickup: "16 Rue de la Paix, Dakar",
    destination: "Gare du Nord",
    time: "16:00",
    status: "Confirmé",
    vehicle: "BMW Série 7",
    duration: "25 min",
    phone: "+33 6 98 76 54 32",
    price: 120,
    progress: 0
  },
  {
    id: 3,
    client: "Dr. Rousseau",
    pickup: "Hôpital Pitié-Salpêtrière",
    destination: "Aéroport Orly",
    time: "18:45", 
    status: "À venir",
    vehicle: "Audi A8",
    duration: "40 min",
    phone: "+33 6 45 67 89 12",
    price: 150,
    progress: 0
  }
];

const weeklyStats = {
  totalRides: 28,
  totalHours: 156,
  earnings: 3420,
  rating: 4.9,
  completedRides: 25,
  cancelledRides: 1,
  averageRating: 4.9,
  totalDistance: 1250
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Vérification de l'authentification - seuls les utilisateurs connectés peuvent accéder
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navigation variant="solid" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Tableau de Bord
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Bonjour, {session.user.name || "Utilisateur"} 👋
                </p>
              </div>
            </div>
            <div className="sm:ml-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aujourd'hui</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
            Bienvenue dans votre espace personnel Navette Xpress. 
            Gérez vos courses et suivez vos performances en temps réel.
          </p>
        </div>

        {/* Stats Cards - Simplified */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.totalRides}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Courses cette semaine</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                +12% vs semaine dernière
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.totalHours}h</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Heures conduites</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                +8% vs semaine dernière
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.earnings}€</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Revenus</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                +15% vs semaine dernière
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.rating}/5</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Note moyenne</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Excellent
              </div>
            </div>
          </div>
        </div>

        {/* Today's Rides - Simplified */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Courses d&apos;aujourd&apos;hui
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {todayRides.length} courses programmées
                </p>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-slate-600 dark:text-slate-400">Total estimé</div>
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {todayRides.reduce((sum, ride) => sum + ride.price, 0)}€
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {todayRides.map((ride, index) => (
              <div 
                key={ride.id}
                className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Time & Status */}
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{ride.time}</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ride.status === 'En cours' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : ride.status === 'Confirmé'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                    }`}>
                      {ride.status}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {ride.client.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{ride.client}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{ride.phone}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="text-sm">
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Départ</div>
                    <div className="text-slate-900 dark:text-white font-medium truncate">{ride.pickup}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">Arrivée</div>
                    <div className="text-slate-900 dark:text-white font-medium truncate">{ride.destination}</div>
                  </div>

                  {/* Vehicle & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Véhicule</div>
                      <div className="font-medium text-slate-900 dark:text-white text-sm">{ride.vehicle}</div>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{ride.price}€</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                        Détails
                      </button>
                      <a 
                        href={`tel:${ride.phone}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        Appeler
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Simplified */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Planning</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Consultez votre planning de la semaine
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Voir le Planning
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Véhicule</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Signaler un problème véhicule
            </p>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Rapport Véhicule
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Statistiques</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Analysez vos performances
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Voir Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

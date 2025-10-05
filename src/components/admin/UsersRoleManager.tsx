"use client";

import { useState, useEffect } from 'react';

export function UsersRoleManager() {
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulaire état
  const [formData, setFormData] = useState({
    clerkUserId: '',
    role: 'driver' as 'driver' | 'admin' | 'manager' | 'customer',
  });

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const result = await response.json();
      
      if (result.success) {
        setUserRoles(result.data);
      } else {
        console.error('Erreur lors du chargement des rôles utilisateurs:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchUserRoles();
        resetForm();
        alert('Rôle utilisateur assigné avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setFormData({
      clerkUserId: '',
      role: 'customer',
    });
    setShowAddForm(false);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      driver: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      customer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
    };
    return colors[role as keyof typeof colors] || colors.driver;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      manager: 'Gestionnaire',
      driver: 'Chauffeur',
      customer: 'Client',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: '👑',
      manager: '👨‍💼',
      driver: '🚗',
      customer: '👤',
    };
    return icons[role as keyof typeof icons] || '👤';
  };

  const filteredUserRoles = userRoles.filter(userRole =>
    userRole.clerkUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = {
    total: userRoles.length,
    admin: userRoles.filter(u => u.role === 'admin').length,
    manager: userRoles.filter(u => u.role === 'manager').length,
    driver: userRoles.filter(u => u.role === 'driver').length,
    customer: userRoles.filter(u => u.role === 'customer').length,
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Gestion des Rôles Utilisateurs
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Assigner un Rôle
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher par ID utilisateur ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{roleStats.total}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{roleStats.admin}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Admins</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{roleStats.manager}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Managers</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{roleStats.driver}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Chauffeurs</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                À propos des rôles utilisateurs
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li><strong>Administrateur:</strong> Accès complet au système, peut tout gérer</li>
                <li><strong>Gestionnaire:</strong> Peut gérer les chauffeurs et véhicules</li>
                <li><strong>Chauffeur:</strong> Accès limité à son propre dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Assigner un Rôle Utilisateur
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ID Utilisateur Clerk
                </label>
                <input
                  type="text"
                  value={formData.clerkUserId}
                  onChange={(e) => setFormData({ ...formData, clerkUserId: e.target.value })}
                  placeholder="user_2abc..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  L&apos;ID utilisateur Clerk unique (commence par user_)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'driver' | 'admin' | 'manager' | 'customer' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                >
                  <option value="customer">👤 Client</option>
                  <option value="driver">🚗 Chauffeur</option>
                  <option value="manager">📊 Gestionnaire</option>
                  <option value="admin">👑 Administrateur</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Assigner le Rôle
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des rôles utilisateurs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Utilisateurs et leurs Rôles ({filteredUserRoles.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">ID Utilisateur</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Rôle</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Créé le</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Mis à jour le</th>
              </tr>
            </thead>
            <tbody>
              {filteredUserRoles.map((userRole) => (
                <tr key={userRole.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4">
                    <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {userRole.clerkUserId}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getRoleIcon(userRole.role)}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userRole.role)}`}>
                        {getRoleLabel(userRole.role)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-900 dark:text-white">
                      {new Date(userRole.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-900 dark:text-white">
                      {new Date(userRole.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUserRoles.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      </div>

      {/* Guide rapide */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Guide Rapide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Trouver l&apos;ID Clerk</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              L&apos;ID utilisateur Clerk se trouve dans le dashboard Clerk ou dans les logs d&apos;authentification.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-2xl mb-2">⚠️</div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Assigner Admin</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Soyez prudent lors de l&apos;assignation du rôle administrateur. Les admins ont un accès complet.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Mise à Jour</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Vous pouvez modifier le rôle d&apos;un utilisateur en soumettant le même ID avec un nouveau rôle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}







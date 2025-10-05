"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SelectDriver, InsertDriver } from '@/schema';

interface DriverWithDetails extends SelectDriver {
  // Ajout d'éventuelles informations supplémentaires
}

export function DriversManager() {
  const { data: session, status } = useSession();
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulaire état
  const [formData, setFormData] = useState<Partial<InsertDriver>>({
    clerkUserId: '',
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    photo: '',
    isActive: true,
  });

  useEffect(() => {
    // Only fetch drivers if user is authenticated and has admin role
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDrivers();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      
      if (!response.ok) {
        console.error('Erreur HTTP:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDrivers(result.data);
      } else {
        console.error('Erreur lors du chargement des chauffeurs:', result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDriver 
        ? `/api/admin/drivers/${editingDriver.id}`
        : '/api/admin/drivers';
      
      const method = editingDriver ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchDrivers();
        resetForm();
        alert(editingDriver ? 'Chauffeur modifié avec succès!' : 'Chauffeur créé avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/drivers/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchDrivers();
        alert('Chauffeur supprimé avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      clerkUserId: '',
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      photo: '',
      isActive: true,
    });
    setEditingDriver(null);
    setShowAddForm(false);
  };

  const startEdit = (driver: DriverWithDetails) => {
    setFormData({
      clerkUserId: driver.clerkUserId,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      photo: driver.photo || '',
      isActive: driver.isActive,
    });
    setEditingDriver(driver);
    setShowAddForm(true);
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    driver.licenseNumber.includes(searchTerm)
  );

  if (status === 'unauthenticated') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Accès refusé. Seuls les administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

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
            Gestion des Chauffeurs
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Nouveau Chauffeur
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone ou permis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{drivers.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {drivers.filter(d => d.isActive).length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Actifs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {drivers.filter(d => !d.isActive).length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Inactifs</div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {editingDriver ? 'Modifier le Chauffeur' : 'Nouveau Chauffeur'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ID Clerk (obligatoire)
                </label>
                <input
                  type="text"
                  value={formData.clerkUserId || ''}
                  onChange={(e) => setFormData({ ...formData, clerkUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Numéro de permis
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Photo (URL)
                </label>
                <input
                  type="url"
                  value={formData.photo || ''}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive || false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Chauffeur actif
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingDriver ? 'Modifier' : 'Créer'}
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

      {/* Liste des chauffeurs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Chauffeurs ({filteredDrivers.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Chauffeur</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Contact</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Permis</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Statut</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {driver.photo && (
                        <img
                          src={driver.photo}
                          alt={driver.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {driver.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          ID: {driver.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm">
                      <div className="text-slate-900 dark:text-white">{driver.email}</div>
                      <div className="text-slate-500 dark:text-slate-400">{driver.phone}</div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-900 dark:text-white">
                      {driver.licenseNumber}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    }`}>
                      {driver.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(driver)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDrivers.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Aucun chauffeur trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


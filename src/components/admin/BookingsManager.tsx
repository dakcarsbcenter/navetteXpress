"use client";

import { useState, useEffect } from 'react';
import { SelectBooking, SelectUser, SelectVehicle, InsertBooking } from '@/schema';

interface BookingWithDetails {
  booking: SelectBooking;
  driver: SelectUser | null;
  vehicle: SelectVehicle | null;
}

export function BookingsManager() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [drivers, setDrivers] = useState<SelectUser[]>([]);
  const [vehicles, setVehicles] = useState<SelectVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<SelectBooking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Formulaire état
  const [formData, setFormData] = useState<Partial<InsertBooking>>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    scheduledDateTime: new Date(),
    status: 'pending',
    driverId: undefined,
    vehicleId: undefined,
    price: '',
    notes: '',
  });

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
    fetchVehicles();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data);
      } else {
        console.error('Erreur lors du chargement des réservations:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      const result = await response.json();
      
      if (result.success) {
        setDrivers(result.data.filter((d: SelectUser) => d.isActive));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles');
      const result = await response.json();
      
      if (result.success) {
        setVehicles(result.data.map((v: { vehicle: SelectVehicle }) => v.vehicle).filter((v: SelectVehicle) => v.isActive));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBooking 
        ? `/api/admin/bookings/${editingBooking.id}`
        : '/api/admin/bookings';
      
      const method = editingBooking ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          driverId: formData.driverId || null,
          vehicleId: formData.vehicleId || null,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchBookings();
        resetForm();
        alert(editingBooking ? 'Réservation modifiée avec succès!' : 'Réservation créée avec succès!');
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchBookings();
        alert('Réservation supprimée avec succès!');
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
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      pickupAddress: '',
      dropoffAddress: '',
      scheduledDateTime: new Date(),
      status: 'pending',
      driverId: undefined,
      vehicleId: undefined,
      price: '',
      notes: '',
    });
    setEditingBooking(null);
    setShowAddForm(false);
  };

  const startEdit = (booking: SelectBooking) => {
    setFormData({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      scheduledDateTime: booking.scheduledDateTime,
      status: booking.status,
      driverId: booking.driverId,
      vehicleId: booking.vehicleId,
      price: booking.price,
      notes: booking.notes || '',
    });
    setEditingBooking(booking);
    setShowAddForm(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      in_progress: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredBookings = bookings.filter(item => {
    const matchesSearch = (
      item.booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.booking.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.booking.dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.driver?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || item.booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            Gestion des Réservations
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Nouvelle Réservation
          </button>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Rechercher par client, adresse ou chauffeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{bookings.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.booking.status === 'pending').length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {bookings.filter(b => b.booking.status === 'confirmed').length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Confirmé</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.booking.status === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">En cours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {bookings.filter(b => b.booking.status === 'completed').length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Terminé</div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {editingBooking ? 'Modifier la Réservation' : 'Nouvelle Réservation'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email du client
                </label>
                <input
                  type="email"
                  value={formData.customerEmail || ''}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Téléphone du client
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Adresse de prise en charge
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress || ''}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Adresse de destination
                </label>
                <input
                  type="text"
                  value={formData.dropoffAddress || ''}
                  onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date et heure prévue
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDateTime ? 
                    new Date(formData.scheduledDateTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, scheduledDateTime: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Statut
                </label>
                <select
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'assigned' | 'approved' | 'rejected' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prix (FCFA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Chauffeur assigné
                </label>
                <select
                  value={formData.driverId || ''}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Aucun chauffeur assigné</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Véhicule assigné
                </label>
                <select
                  value={formData.vehicleId || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Aucun véhicule assigné</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingBooking ? 'Modifier' : 'Créer'}
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

      {/* Liste des réservations */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Réservations ({filteredBookings.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Client</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Trajet</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Date/Heure</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Chauffeur</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Statut</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Prix</th>
                <th className="pb-3 text-slate-600 dark:text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((item) => (
                <tr key={item.booking.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {item.booking.customerName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {item.booking.customerEmail}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {item.booking.customerPhone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm">
                      <div className="text-slate-900 dark:text-white truncate max-w-xs" title={item.booking.pickupAddress}>
                        📍 {item.booking.pickupAddress}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 truncate max-w-xs" title={item.booking.dropoffAddress}>
                        🏁 {item.booking.dropoffAddress}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {new Date(item.booking.scheduledDateTime).toLocaleString('fr-FR')}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm">
                      {item.driver ? (
                        <>
                          <div className="text-slate-900 dark:text-white">{item.driver.name}</div>
                          {item.vehicle && (
                            <div className="text-slate-500 dark:text-slate-400">
                              {item.vehicle.make} {item.vehicle.model}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Non assigné</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.booking.status)}`}>
                      {getStatusLabel(item.booking.status)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-900 dark:text-white">
                      {item.booking.price ? `${item.booking.price} FCFA` : '-'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item.booking)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(item.booking.id)}
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
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Aucune réservation trouvée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}









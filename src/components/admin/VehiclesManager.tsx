"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SelectVehicle, SelectDriver, InsertVehicle } from '@/schema';
import { ImageUploader } from '@/components/ImageUploader';
import DeleteVehicleModal from '@/components/admin/DeleteVehicleModal';
import {
  MagnifyingGlass as Search,
  Plus,
  Trash as Trash2,
  PencilSimple as Edit2,
  Car,
  Users,
  Gear as Settings,
  ShieldCheck,
  FileText,
  DeviceMobile as Smartphone,
  Gauge
} from "@phosphor-icons/react";
import { StatusBadge } from '@/components/ui/StatusBadge';

interface VehicleWithDriver {
  vehicle: SelectVehicle;
  driver: SelectDriver | null;
}

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [drivers, setDrivers] = useState<SelectDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<SelectVehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; vehicle: SelectVehicle | null }>({ open: false, vehicle: null });

  // Formulaire état
  const [formData, setFormData] = useState<Partial<InsertVehicle>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    capacity: 4,
    photo: '',
    category: '',
    description: '',
    features: '',
    vehicleType: 'sedan',
    driverId: null,
    isActive: true,
  });

  // État pour gérer les features comme tableau temporaire
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  // Fonction pour gérer l'upload d'image Cloudinary
  const handleImageUpload = (url: string) => {
    console.log('✅ Image uploadée vers Cloudinary:', url);
    setFormData(prev => ({ ...prev, photo: url }));
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles');
      const result = await response.json();

      if (result.success) {
        setVehicles(result.data);
      } else {
        console.error('Erreur lors du chargement des véhicules:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      const result = await response.json();

      if (result.success) {
        setDrivers(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation de l'image
    if (!formData.photo) {
      alert('⚠️ Veuillez uploader une photo du véhicule');
      return;
    }

    try {
      // Convertir featuresList en JSON string
      const dataToSend = {
        ...formData,
        features: JSON.stringify(featuresList),
      };

      const url = editingVehicle
        ? `/api/admin/vehicles/${editingVehicle.id}`
        : '/api/admin/vehicles';

      const method = editingVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (result.success) {
        await fetchVehicles();
        resetForm();
        const isCloudinary = formData.photo.includes('cloudinary.com');
        const message = editingVehicle
          ? `✅ Véhicule modifié avec succès! ${isCloudinary ? '📸 Image optimisée par Cloudinary' : ''}`
          : `✅ Véhicule créé avec succès! ${isCloudinary ? '📸 Image optimisée par Cloudinary' : ''}`;
        alert(message);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/vehicles/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchVehicles();
        // suppression réussie
      } else {
        console.error('Erreur: ', result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setDeleteConfirm({ open: false, vehicle: null });
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plateNumber: '',
      capacity: 4,
      photo: '',
      category: '',
      description: '',
      features: '',
      vehicleType: 'sedan',
      driverId: null,
      isActive: true,
    });
    setFeaturesList([]);
    setNewFeature('');
    setEditingVehicle(null);
    setShowAddForm(false);
  };

  const startEdit = (vehicle: SelectVehicle) => {
    // Parser les features si elles existent
    let parsedFeatures: string[] = [];
    if (vehicle.features) {
      try {
        parsedFeatures = JSON.parse(vehicle.features);
      } catch {
        parsedFeatures = [];
      }
    }

    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category || '',
      description: vehicle.description || '',
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      capacity: vehicle.capacity,
      photo: vehicle.photo || '',
      vehicleType: vehicle.vehicleType,
      driverId: vehicle.driverId,
      isActive: vehicle.isActive,
    });
    setFeaturesList(parsedFeatures);
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  // Gérer l'ajout d'une feature
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeaturesList([...featuresList, newFeature.trim()]);
      setNewFeature('');
    }
  };

  // Supprimer une feature
  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  const filteredVehicles = vehicles.filter(item => {
    if (!item || !item.vehicle) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      item.vehicle.make?.toLowerCase().includes(searchLower) ||
      item.vehicle.model?.toLowerCase().includes(searchLower) ||
      item.vehicle.plateNumber?.toLowerCase().includes(searchLower) ||
      item.driver?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"
          style={{ borderColor: 'var(--color-gold) transparent transparent transparent' }}></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Gestion de la Flotte</h2>
                <p className="text-xs text-slate-500 mt-0.5">Contrôlez et assignez vos véhicules</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <Plus size={16} />
                <span>Ajouter</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher marque, plaque, chauffeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/10 outline-none transition-all focus:border-gold/50"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            {[
              { label: 'Véhicules', value: vehicles.length, icon: <Car size={18} />, color: 'var(--color-gold)' },
              { label: 'En service', value: vehicles.filter(v => v?.vehicle?.isActive).length, icon: <ShieldCheck size={18} />, color: '#10B981' },
              { label: 'Cap. Moy', value: Math.round(vehicles.reduce((acc, v) => acc + (v?.vehicle?.capacity || 0), 0) / (vehicles.length || 1)), icon: <Users size={18} />, color: '#3B82F6' },
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center"
                style={{ backgroundColor: 'var(--color-dash-card)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire (Nouveau/Modif) */}
        {showAddForm && (
          <div className="p-6 rounded-2xl border border-gold/20 bg-gold/5 animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingVehicle ? 'Mise à jour du Véhicule' : 'Enregistrer une Unité'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">Annuler</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Marque</label>
                  <input
                    type="text"
                    value={formData.make || ''}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Modèle</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Année</label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Immatriculation</label>
                  <input
                    type="text"
                    value={formData.plateNumber || ''}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                    placeholder="EX-123-AB"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Capacité</label>
                  <input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Type</label>
                  <select
                    value={formData.vehicleType || 'sedan'}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white cursor-pointer"
                  >
                    <option value="sedan">Berline</option>
                    <option value="luxury">Luxe</option>
                    <option value="suv">SUV</option>
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Chauffeur Assigné</label>
                  <select
                    value={formData.driverId || ''}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value ? e.target.value : null })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white cursor-pointer"
                  >
                    <option value="">Non assigné</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Équipements</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Ajouter (Wi-Fi, AC...)"
                      className="flex-1 px-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 bg-white/5 text-white"
                    />
                    <button type="button" onClick={handleAddFeature} className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">+</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {featuresList.map((f, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-gold/10 text-gold text-[10px] font-bold flex items-center gap-1">
                        {f} <button type="button" onClick={() => handleRemoveFeature(i)} className="hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Visuel du véhicule</label>
                  <ImageUploader
                    onUploadComplete={handleImageUpload}
                    currentImage={formData.photo}
                    className="rounded-xl border border-dashed border-white/10 bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isActive || false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-gold' : 'bg-white/10'}`} />
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="ml-3 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                    Véhicule opérationnel
                  </span>
                </label>

                <button
                  type="submit"
                  className="bg-gold text-black px-8 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-gold/10"
                >
                  {editingVehicle ? 'Enregistrer les modifications' : 'Confirmer Registration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-sm font-semibold text-white">État de la flotte ({filteredVehicles.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Véhicule</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Plaque</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilote Assigné</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Config</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((item) => (
                  <tr key={item.vehicle.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.vehicle.photo ? (
                          <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-white/5">
                            <Image src={item.vehicle.photo} alt={item.vehicle.make} fill className="object-cover" sizes="64px" />
                          </div>
                        ) : (
                          <div className="w-16 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                            <Car size={16} className="text-slate-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                            {item.vehicle.make} {item.vehicle.model}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.vehicle.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-[11px] bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-300">
                        {item.vehicle.plateNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.driver ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold border border-gold/20">
                            {item.driver.name.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-300">{item.driver.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <div className="flex items-center gap-1" title="Capacité">
                          <Users size={12} />
                          <span className="text-xs font-mono">{item.vehicle.capacity}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge statut={item.vehicle.isActive ? 'confirmed' : 'cancelled'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(item.vehicle)}
                          className="p-1.5 rounded-lg hover:bg-gold/20 text-slate-400 hover:text-gold transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, vehicle: item.vehicle })}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteVehicleModal
        isOpen={deleteConfirm.open}
        vehicle={deleteConfirm.vehicle as any}
        onCancel={() => setDeleteConfirm({ open: false, vehicle: null })}
        onConfirm={() => handleDelete(deleteConfirm.vehicle!.id)}
      />
    </>
  );
}









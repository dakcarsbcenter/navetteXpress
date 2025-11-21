"use client";

import { useState, useEffect } from "react";
import { X, Phone, MapPin, Clock, User, Car } from "lucide-react";

interface BookingDetails {
  id: number;
  client: string;
  pickup: string;
  destination: string;
  time: string;
  status: string;
  vehicle: string;
  duration: string;
  phone: string;
  price: number;
  progress: number;
}

interface BookingDetailsModalProps {
  bookingId: number;
  onClose: () => void;
}

export function BookingDetailsModal({ bookingId, onClose }: BookingDetailsModalProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulation d'un appel API avec les données de démonstration
        const demoBookings: BookingDetails[] = [
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

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const foundBooking = demoBookings.find(b => b.id === bookingId);
        if (foundBooking) {
          setBooking(foundBooking);
        } else {
          setError("Réservation non trouvée");
        }
      } catch (err) {
        setError("Erreur lors du chargement des détails");
        console.error("Error fetching booking details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleCallClient = () => {
    if (booking?.phone) {
      window.location.href = `tel:${booking.phone}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Détails de la réservation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Chargement...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-600 dark:text-red-400">{error}</div>
            </div>
          )}

          {booking && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  booking.status === 'En cours' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                    : booking.status === 'Confirmé'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                }`}>
                  {booking.status}
                </span>
              </div>

              {/* Client Information */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Informations Client</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Nom du client</div>
                    <div className="font-medium text-slate-900 dark:text-white">{booking.client}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Téléphone</div>
                    <div className="font-medium text-slate-900 dark:text-white">{booking.phone}</div>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-linear-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Détails du Trajet</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Point de départ</div>
                    <div className="font-medium text-slate-900 dark:text-white">{booking.pickup}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Destination</div>
                    <div className="font-medium text-slate-900 dark:text-white">{booking.destination}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Heure de prise en charge</div>
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {booking.time}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Durée estimée</div>
                      <div className="font-medium text-slate-900 dark:text-white">{booking.duration}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Pricing */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-linear-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Véhicule & Tarification</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Véhicule assigné</div>
                    <div className="font-medium text-slate-900 dark:text-white">{booking.vehicle}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Prix total</div>
                    <div className="font-bold text-xl text-orange-600 dark:text-orange-400">{booking.price} FCFA</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar (if applicable) */}
              {booking.progress > 0 && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Progression de la course</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{booking.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${booking.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {booking && (
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCallClient}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Appeler le client
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

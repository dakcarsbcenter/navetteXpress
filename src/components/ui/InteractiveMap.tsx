"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Coordonnées de Dakar, Sénégal (Plateau)
const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467];
const DEFAULT_ZOOM = 13;

interface InteractiveMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  showMarker?: boolean;
  markerTitle?: string;
  markerDescription?: string;
}

// Composant dynamique pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function InteractiveMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "",
  height = "400px",
  showMarker = true,
  markerTitle = "NavetteXpress",
  markerDescription = "Avenue Léopold Sédar Senghor, Plateau, Dakar, Sénégal"
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        className={`bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-2">🗺️</div>
          <p>Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showMarker && (
          <Marker position={center}>
            <Popup>
              <div className="text-center p-2">
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  {markerTitle}
                </h3>
                <p className="text-slate-600 mb-3">
                  {markerDescription}
                </p>
                <div className="space-y-1 text-sm text-slate-500">
                  <p>📞 +221 78 131 91 91</p>
                  <p>📧 contact@navettexpress.sn</p>
                  <p>🕒 Service 24h/24, 7j/7</p>
                </div>
                <div className="mt-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${center[0]},${center[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Itinéraire
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

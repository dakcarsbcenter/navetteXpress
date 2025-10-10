/**
 * Icônes Custom Premium NavetteXpress
 * Design moderne, minimaliste et élégant
 * Optimisées pour la nouvelle palette de couleurs
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: 'primary' | 'secondary' | 'neutral' | 'white';
}

const colorMap = {
  primary: '#FF7E38',
  secondary: '#0F5B8A', 
  neutral: '#1E293B',
  white: '#FFFFFF'
};

// =============================================================================
// 🚗 VÉHICULES PREMIUM
// =============================================================================

export const LuxuryCarIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path
      d="M5 11L6.5 6.5H17.5L19 11M5 11V16C5 16.55 5.45 17 6 17H7C7.55 17 8 16.55 8 16V15H16V16C16 16.55 16.45 17 17 17H18C18.55 17 19 16.55 19 16V11M5 11H19M8 13H9M15 13H16"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Détails premium - étoiles de luxe */}
    <circle cx="7" cy="8" r="1" fill={colorMap[color]} opacity="0.6"/>
    <circle cx="17" cy="8" r="1" fill={colorMap[color]} opacity="0.6"/>
  </svg>
);

export const VanIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path
      d="M3 10L4 6H16L17 10M3 10V16C3 16.55 3.45 17 4 17H5C5.55 17 6 16.55 6 16V15H14V16C14 16.55 14.45 17 15 17H16C16.55 17 17 16.55 17 16V10M3 10H17"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Fenêtres passagers */}
    <rect x="18" y="8" width="3" height="4" rx="0.5" stroke={colorMap[color]} strokeWidth="1.2"/>
    <line x1="19.5" y1="9" x2="19.5" y2="11" stroke={colorMap[color]} strokeWidth="1"/>
  </svg>
);

// =============================================================================
// ✈️ TRANSPORT AÉROPORT
// =============================================================================

export const AirportIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'secondary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Tour de contrôle stylisée */}
    <path
      d="M8 20V16H16V20M8 16V12C8 11.45 8.45 11 9 11H15C15.55 11 16 11.45 16 12V16"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Avion moderne */}
    <path
      d="M12 4L14 6L18 5L20 7L16 9L12 8L8 9L4 7L6 5L10 6L12 4Z"
      fill={colorMap[color]}
      opacity="0.8"
    />
    {/* Piste */}
    <line x1="2" y1="20" x2="22" y2="20" stroke={colorMap[color]} strokeWidth="2"/>
  </svg>
);

// =============================================================================
// 👨‍✈️ CHAUFFEUR PRIVÉ
// =============================================================================

export const PrivateDriverIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Personnage avec casquette */}
    <circle cx="12" cy="8" r="3" stroke={colorMap[color]} strokeWidth="1.5"/>
    {/* Casquette professionnelle */}
    <path
      d="M9 6.5C9 5.67 10.34 5 12 5C13.66 5 15 5.67 15 6.5"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Corps professionnel */}
    <path
      d="M6 21V19C6 16.79 7.79 15 10 15H14C16.21 15 18 16.79 18 19V21"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Insigne de qualité */}
    <circle cx="16" cy="10" r="2" fill={colorMap[color]} opacity="0.3"/>
    <path d="M15.5 10L16 10.5L16.5 10" stroke={colorMap[color]} strokeWidth="1"/>
  </svg>
);

// =============================================================================
// 📍 SUIVI TEMPS RÉEL
// =============================================================================

export const RealTimeTrackingIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'secondary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Position centrale */}
    <circle cx="12" cy="12" r="3" fill={colorMap[color]}/>
    
    {/* Ondes de signal */}
    <circle cx="12" cy="12" r="6" stroke={colorMap[color]} strokeWidth="1.5" opacity="0.6"/>
    <circle cx="12" cy="12" r="9" stroke={colorMap[color]} strokeWidth="1.5" opacity="0.3"/>
    
    {/* Flèche directionnelle */}
    <path
      d="M12 3L13 2L12 1L11 2L12 3Z"
      fill={colorMap[color]}
    />
  </svg>
);

// =============================================================================
// 🛡️ SÉCURITÉ PREMIUM
// =============================================================================

export const SafetyFirstIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Bouclier élégant */}
    <path
      d="M12 2L4 6V12C4 16.55 7.84 20.74 12 22C16.16 20.74 20 16.55 20 12V6L12 2Z"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Coche de sécurité */}
    <path
      d="M9 12L11 14L15 10"
      stroke={colorMap[color]}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// =============================================================================
// 🧳 SERVICE BAGAGES
// =============================================================================

export const LuggageServiceIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'neutral' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Valise principale */}
    <rect 
      x="6" 
      y="10" 
      width="10" 
      height="8" 
      rx="1" 
      stroke={colorMap[color]} 
      strokeWidth="1.5"
    />
    {/* Poignée */}
    <path
      d="M9 10V8C9 7.45 9.45 7 10 7H12C12.55 7 13 7.45 13 8V10"
      stroke={colorMap[color]}
      strokeWidth="1.5"
    />
    {/* Valise d'appoint */}
    <rect 
      x="16" 
      y="12" 
      width="4" 
      height="6" 
      rx="0.5" 
      stroke={colorMap[color]} 
      strokeWidth="1.2" 
      opacity="0.6"
    />
    {/* Roues */}
    <circle cx="8" cy="19" r="1" fill={colorMap[color]} opacity="0.8"/>
    <circle cx="14" cy="19" r="1" fill={colorMap[color]} opacity="0.8"/>
  </svg>
);

// =============================================================================
// 📱 BOUTON RÉSERVATION MODERNE
// =============================================================================

export const BookNowIcon: React.FC<IconProps & { isLoading?: boolean }> = ({ 
  className = "", 
  size = 24, 
  color = 'white',
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        className={`${className} animate-spin`}
      >
        <circle cx="12" cy="12" r="10" stroke={colorMap[color]} strokeWidth="2" opacity="0.3"/>
        <path d="M12 2A10 10 0 0 1 22 12" stroke={colorMap[color]} strokeWidth="2"/>
      </svg>
    );
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
    >
      {/* Calendrier */}
      <rect x="3" y="4" width="18" height="15" rx="2" stroke={colorMap[color]} strokeWidth="1.5"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={colorMap[color]} strokeWidth="1.5"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke={colorMap[color]} strokeWidth="1.5"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke={colorMap[color]} strokeWidth="1.5"/>
      
      {/* Plus d'action */}
      <circle cx="17" cy="15" r="3" fill={colorMap[color]} opacity="0.9"/>
      <path d="M16 15H18M17 14V16" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
};

// =============================================================================
// 🟢 INDICATEUR DE STATUT LIVE
// =============================================================================

export const LiveStatusIcon: React.FC<{ 
  status: 'online' | 'busy' | 'offline';
  className?: string;
  size?: number;
}> = ({ status, className = "", size = 12 }) => {
  const colors = {
    online: '#10B981',
    busy: '#F59E0B', 
    offline: '#64748B'
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div 
        className="w-full h-full rounded-full"
        style={{ backgroundColor: colors[status] }}
      />
      {status === 'online' && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: colors[status] }}
        />
      )}
    </div>
  );
};

// =============================================================================
// 🇸🇳 ICÔNE TERANGA (HOSPITALITÉ SÉNÉGALAISE)
// =============================================================================

export const TerrangaIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Cœur central */}
    <path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      fill={colorMap[color]}
      opacity="0.2"
    />
    {/* Mains accueillantes */}
    <path
      d="M8 10C8 10 9.5 11.5 12 11.5S16 10 16 10"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// =============================================================================
// 📞 CONTACT & COMMUNICATION
// =============================================================================

export const PhoneIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path
      d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59344 1.99522 8.06477 2.16708 8.43928 2.48353C8.81379 2.79999 9.067 3.23945 9.15999 3.72C9.33644 4.68007 9.6248 5.61273 10.02 6.49C10.1856 6.88793 10.2411 7.32411 10.1823 7.75113C10.1235 8.17814 9.95221 8.57989 9.68999 8.91L8.52999 10.07C9.84777 12.592 11.408 14.1522 13.93 15.47L15.09 14.31C15.4101 14.0478 15.8119 13.8765 16.2389 13.8177C16.6659 13.7589 17.1021 13.8144 17.5 13.98C18.3773 14.3752 19.3099 14.6636 20.27 14.84C20.7556 14.9330 21.1981 15.1902 21.5148 15.5698C21.8315 15.9494 22.0023 16.4249 21.9999 16.92L22 16.92Z"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EmailIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path
      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 6L12 13L2 6"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LocationIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path
      d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="10"
      r="3"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = 'primary' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 6V12L16 14"
      stroke={colorMap[color]}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Export par défaut
export const NavetteXpressIcons = {
  LuxuryCarIcon,
  VanIcon,
  AirportIcon,
  PrivateDriverIcon,
  RealTimeTrackingIcon,
  SafetyFirstIcon,
  LuggageServiceIcon,
  BookNowIcon,
  LiveStatusIcon,
  TerrangaIcon,
  PhoneIcon,
  EmailIcon,
  LocationIcon,
  ClockIcon
};
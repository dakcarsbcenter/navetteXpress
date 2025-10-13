import { Menu, Phone } from 'lucide-react';

/**
 * Iconographie Moderne NavetteXpress - Propositions d'Upgrade
 * 
 * PHILOSOPHIE DESIGN:
 * - Minimaliste et élégant
 * - Cohérent avec la nouvelle palette (#FF7E38, #0F5B8A, #1E293B)
 * - Adapté au secteur transport premium
 * - Optimisé mobile et accessibilité
 */

// =============================================================================
// 🚗 TRANSPORT & VÉHICULES - ICÔNES PREMIUM CUSTOM
// =============================================================================

/**
 * Icônes métier spécifiques - À créer en SVG custom
 */
export const TransportIcons = {
  // Véhicules Premium (avec style moderne)
  LuxuryCar: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Voiture de luxe avec détails élégants */}
    </svg>
  ),
  
  Van: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Van moderne 9 places */}
    </svg>
  ),
  
  Airport: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Aéroport stylisé AIBD */}
    </svg>
  ),
  
  // Services Transport
  PrivateDriver: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Chauffeur avec casquette */}
    </svg>
  ),
  
  RealTimeTracking: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* GPS avec signal temps réel */}
    </svg>
  ),
  
  SafetyFirst: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Bouclier avec coche sécurisé */}
    </svg>
  )
};

// =============================================================================
// 🎨 UPGRADE DES ICÔNES LUCIDE EXISTANTES
// =============================================================================

/**
 * Wrapper pour styliser les icônes Lucide avec notre palette
 */
export const StyledLucideIcons = {
  // Navigation moderne
  Menu: ({ className = "", variant = "default" }: { className?: string; variant?: "default" | "primary" | "secondary" }) => {
    const variants = {
      default: "text-slate-600 dark:text-slate-300",
      primary: "text-[#FF7E38]",
      secondary: "text-[#0F5B8A]"
    };
    return <Menu className={`${variants[variant]} ${className}`} />;
  },
  
  // Communication avec style
  Phone: ({ className = "", variant = "default" }: { className?: string; variant?: "default" | "success" | "primary" }) => {
    const variants = {
      default: "text-slate-600 dark:text-slate-300",
      success: "text-[#10B981]",
      primary: "text-[#FF7E38]"
    };
    return <Phone className={`${variants[variant]} ${className}`} />;
  }
  
  // Plus d'icônes stylisées...
};

// =============================================================================
// 🌟 NOUVELLES CATÉGORIES BUSINESS
// =============================================================================

/**
 * Icônes business premium spécifiques transport
 */
export const BusinessIcons = {
  // Statuts de course
  BookingConfirmed: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Calendrier avec coche verte */}
    </svg>
  ),
  
  DriverEnRoute: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Voiture avec flèches de mouvement */}
    </svg>
  ),
  
  // Services premium
  LuggageService: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Valises élégantes empilées */}
    </svg>
  ),
  
  AirportTransfer: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Avion + voiture connectés */}
    </svg>
  ),
  
  CityTransfer: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Gratte-ciel + route */}
    </svg>
  )
};

// =============================================================================
// 🇸🇳 ICÔNES CULTURELLES SÉNÉGAL
// =============================================================================

/**
 * Icônes avec touches culturelles sénégalaises
 */
export const CulturalIcons = {
  DakarLandmark: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Monument de la Renaissance stylisé */}
    </svg>
  ),
  
  TerrangaService: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Cœur avec mains accueillantes */}
    </svg>
  ),
  
  SenegaleseFlag: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Drapeau sénégalais stylisé */}
    </svg>
  )
};

// =============================================================================
// 📱 ICÔNES INTERFACE MODERNE
// =============================================================================

/**
 * Icônes UI/UX modernes avec micro-interactions
 */
export const ModernUIIcons = {
  // Boutons d'action avec états
  BookNowButton: ({ isLoading = false }) => (
    <div className="relative">
      {isLoading ? (
        <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
          {/* Spinner élégant */}
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Calendrier + plus */}
        </svg>
      )}
    </div>
  ),
  
  // Indicateurs de statut animés
  LiveStatus: ({ status = "online" }) => (
    <div className="relative">
      <div className={`w-3 h-3 rounded-full ${
        status === 'online' ? 'bg-[#10B981]' : 
        status === 'busy' ? 'bg-[#F59E0B]' : 'bg-slate-400'
      }`}>
        {status === 'online' && (
          <div className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-75" />
        )}
      </div>
    </div>
  )
};

// =============================================================================
// 🎯 RECOMMENDATIONS D'IMPLEMENTATION
// =============================================================================

/**
 * Plan d'upgrade progressif des icônes
 */
export const IconUpgradePlan = {
  
  // Phase 1: Icônes critiques (1 semaine)
  phase1: [
    'LuxuryCar', 'Van', 'Airport', 'BookingConfirmed', 
    'DriverEnRoute', 'PrivateDriver'
  ],
  
  // Phase 2: Interface utilisateur (1 semaine)
  phase2: [
    'BookNowButton', 'LiveStatus', 'LuggageService', 
    'AirportTransfer', 'CityTransfer'
  ],
  
  // Phase 3: Identité culturelle (optionnel)
  phase3: [
    'DakarLandmark', 'TerrangaService', 'SenegaleseFlag'
  ]
};

export default {
  TransportIcons,
  StyledLucideIcons,
  BusinessIcons,
  CulturalIcons,
  ModernUIIcons,
  IconUpgradePlan
};
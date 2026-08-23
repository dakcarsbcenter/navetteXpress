// Palette de couleurs NavetteXpress — identité "Corridor"
export const colors = {
  // Couleurs principales — LAGUNE
  primary: {
    main: '#1F5245',      // Lagune principale
    hover: '#19433B',     // Lagune hover
    light: '#3D7A67',     // Lagune claire
    dark: '#12362D',      // Lagune sombre
  },

  // Accent ponctuel (Landing Page)
  gold: {
    main: '#B4643A',      // Terre brûlée
    hover: '#96502D',     // Terre hover
    light: '#C98761',     // Terre claire
    dark: '#8A4A2C',      // Terre sombre
  },

  // Couleur secondaire — accent chauffeur (famille Terre, distincte de la Lagune)
  secondary: {
    main: '#B4643A',       // Terre chauffeur
    hover: '#96502D',      // Terre hover
    light: '#C98761',      // Terre claire
    dark: '#8A4A2C',       // Terre sombre
  },

  // Couleurs neutres
  neutral: {
    charcoal: '#12100E',     // Encre principale
    charcoalLight: '#3d3a35', // Texte secondaire
    gray: '#6E6A63',         // Gris-brun muet (libellés mono)
    whiteOff: '#F7F3EC',     // Craie
    grayVeryLight: '#F2EEE4', // Craie légèrement ombrée
    grayLight: '#E2DACD',    // Bordure claire
  },

  // Couleurs d'état — sémantiques préservées
  status: {
    success: '#22C55E',     // Succès (vert sémantique)
    warning: '#F59E0B',     // Attention/En attente (or)
    error: '#B8493C',       // Erreur (brique, ton adouci)
    info: '#3B82F6',        // Information (bleu)
    online: '#22C55E',      // En ligne (chevauche success)
    offline: '#94A3B8',     // Hors ligne
  },

  // Couleurs thématiques transport
  transport: {
    taxi: '#FCD34D',        // Jaune taxi
    accent: '#1F5245',      // Accent transport (lagune)
    sunset: '#B4643A',      // Terre brûlée (accent chaud)
  },

  // Tokens d'accent Lagune
  accent: {
    main: '#1F5245',
    hover: '#19433B',
    light: '#3D7A67',
    subtle: 'rgba(31, 82, 69, 0.12)',
    border: 'rgba(31, 82, 69, 0.35)',
  }
} as const;

// Utilitaire pour générer les classes Tailwind personnalisées
export const colorClasses = {
  // Boutons primaires
  btnPrimary: `bg-[${colors.primary.main}] hover:bg-[${colors.primary.hover}] focus:ring-[${colors.primary.main}]`,
  btnSecondary: `bg-[${colors.secondary.main}] hover:bg-[${colors.secondary.hover}] focus:ring-[${colors.secondary.main}]`,

  // Backgrounds
  bgPrimary: `bg-[${colors.primary.main}]`,
  bgSecondary: `bg-[${colors.secondary.main}]`,
  bgNeutral: `bg-[${colors.neutral.charcoal}]`,

  // Text
  textPrimary: `text-[${colors.primary.main}]`,
  textSecondary: `text-[${colors.secondary.main}]`,
  textNeutral: `text-[${colors.neutral.charcoal}]`,
} as const;

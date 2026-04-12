// Palette de couleurs optimisée pour NavetteXpress
export const colors = {
  // Couleurs principales — ROUGE POURPRE
  primary: {
    main: '#9B1B30',      // Rouge pourpre principal
    hover: '#821528',     // Rouge pourpre hover
    light: '#C23B55',     // Rouge pourpre clair
    dark: '#7A1228',      // Rouge pourpre sombre
  },

  // Identité pourpre (Landing Page)
  gold: {
    main: '#9B1B30',      // Rouge pourpre principal
    hover: '#821528',     // Rouge pourpre hover
    light: '#C23B55',     // Rouge pourpre clair
    dark: '#7A1228',      // Rouge pourpre sombre
  },
  
  // Couleur secondaire bleu (Driver Dashboard)
  secondary: {
    main: '#3B82F6',      // Bleu électrique
    hover: '#2563EB',     // Bleu hover
    light: '#60A5FA',     // Bleu clair
    dark: '#1E40AF',      // Bleu sombre
  },
  
  // Couleurs neutres améliorées
  neutral: {
    charcoal: '#1E293B',    // Charbon principal
    charcoalLight: '#334155', // Charbon léger
    gray: '#64748B',        // Gris moderne
    whiteOff: '#FAFBFC',    // Blanc cassé
    grayVeryLight: '#F1F5F9', // Gris très clair
    grayLight: '#E2E8F0',   // Gris léger
  },
  
  // Couleurs d'état — sémantiques préservées
  status: {
    success: '#22C55E',     // Succès (vert sémantique)
    warning: '#F59E0B',     // Attention/En attente (or)
    error: '#EF4444',       // Erreur
    info: '#3B82F6',        // Information (bleu)
    online: '#22C55E',      // En ligne (chevauche success)
    offline: '#94A3B8',     // Hors ligne
  },
  
  // Couleurs thématiques transport
  transport: {
    taxi: '#FCD34D',        // Jaune taxi
    accent: '#9B1B30',      // Accent transport (rouge pourpre)
    sunset: '#821528',      // Sunset Dakar (rouge pourpre sombre)
  },

  // Tokens d'accent pourpre
  accent: {
    main: '#9B1B30',
    hover: '#821528',
    light: '#C23B55',
    subtle: 'rgba(155, 27, 48, 0.12)',
    border: 'rgba(155, 27, 48, 0.35)',
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

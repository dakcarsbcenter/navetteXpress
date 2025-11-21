// Palette de couleurs optimisée pour NavetteXpress
export const colors = {
  // Couleurs principales
  primary: {
    main: '#FF7E38',      // Orange moderne principal
    hover: '#E6682F',     // Orange hover
    light: '#FFB885',     // Orange clair pour backgrounds
    dark: '#D4571F',      // Orange sombre
  },
  
  // Couleur secondaire (confiance & fiabilité)
  secondary: {
    main: '#0F5B8A',      // Bleu océan
    hover: '#0A4B73',     // Bleu hover
    light: '#B8D5E8',     // Bleu clair
    dark: '#083A5C',      // Bleu sombre
  },
  
  // Couleurs neutres améliorées
  neutral: {
    charcoal: '#1E293B',    // Charbon principal (plus chaleureux)
    charcoalLight: '#334155', // Charbon léger
    gray: '#64748B',        // Gris moderne
    whiteOff: '#FAFBFC',    // Blanc cassé
    grayVeryLight: '#F1F5F9', // Gris très clair
    grayLight: '#E2E8F0',   // Gris léger
  },
  
  // Couleurs d'état
  status: {
    success: '#10B981',     // Succès
    warning: '#F59E0B',     // Attention
    error: '#EF4444',       // Erreur
    info: '#3B82F6',        // Information
  },
  
  // Couleurs thématiques transport
  transport: {
    taxi: '#FCD34D',        // Jaune taxi
    route: '#059669',       // Vert route
    sunset: '#FB923C',      // Orange sunset Dakar
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

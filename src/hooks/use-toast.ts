// Hook simple pour afficher des notifications toast
// Utilisé dans les composants qui ne peuvent pas accéder au ToastProvider

export interface ToastOptions {
  title?: string
  description: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    // Cette fonction est un placeholder pour la compatibilité
    // Dans DriverAvailabilityManager, on utilise un état local pour les toasts
    console.log('Toast:', options)
  }

  return { toast }
}

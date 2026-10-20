import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Bloc gris qui pulse à la place d'un contenu en cours de chargement.
 * Décoratif : à placer dans un conteneur `role="status"` qui porte le texte
 * d'attente pour les lecteurs d'écran. L'animation est coupée automatiquement
 * si l'utilisateur demande moins de mouvement (voir globals.css).
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-line/70', className)} />;
}

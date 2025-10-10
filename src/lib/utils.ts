import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un prix en FCFA (Franc CFA)
 * @param price - Le prix à formater (number ou string)
 * @param includeSymbol - Si true, ajoute "FCFA" à la fin (défaut: true)
 * @returns Le prix formaté avec séparateur de milliers et symbole FCFA
 */
export function formatPrice(price: number | string | null | undefined, includeSymbol: boolean = true): string {
  if (!price) return '-'
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numPrice)) return '-'
  
  const formatted = numPrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  
  return includeSymbol ? `${formatted} FCFA` : formatted
}

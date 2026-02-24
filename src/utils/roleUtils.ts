/**
 * Utilitaires pour la gestion des rôles
 */

/**
 * Vérifie si l'utilisateur a des privilèges d'administration (admin ou manager)
 */
export function isAdminOrManager(role: string | undefined): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Vérifie si l'utilisateur est strictement un admin (pas manager)
 */
export function isStrictAdmin(role: string | undefined): boolean {
  return role === 'admin'
}

/**
 * Vérifie si l'utilisateur est un manager
 */
export function isManager(role: string | undefined): boolean {
  return role === 'manager'
}

// Drizzle (postgres-js) enveloppe l'erreur Postgres réelle dans `error.cause` et met dans
// `error.message` un simple dump de la requête SQL ("Failed query: insert into ..."), ce qui
// rend les erreurs illisibles côté client si on les remonte telles quelles.
export function friendlyDbError(error: unknown, constraintMessages: Record<string, string> = {}): string {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null
  const reason = cause?.message ?? (error instanceof Error ? error.message : '')

  for (const [constraint, message] of Object.entries(constraintMessages)) {
    if (reason.includes(constraint)) return message
  }

  if (cause?.message) return cause.message
  return "Erreur interne du serveur"
}

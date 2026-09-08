/**
 * Journalisation des événements anti-scraping (rate limit, honeypot, UA suspects).
 * Sortie sur stdout/stderr : récupérable via `docker logs` / les logs du VPS,
 * pas de dépendance à un service tiers.
 */

type SecurityEvent =
    | 'rate_limit_exceeded'
    | 'honeypot_hit'
    | 'ip_blacklisted_blocked'
    | 'suspicious_user_agent'
    | 'public_api_rejected'
    | 'search_engine_bot_exempted';

export function logSecurityEvent(event: SecurityEvent, details: Record<string, unknown>) {
    console.warn(
        `[SECURITY] ${event}`,
        JSON.stringify({ ...details, ts: new Date().toISOString() })
    );
}

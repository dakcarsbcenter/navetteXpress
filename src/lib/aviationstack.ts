// Passerelle AviationStack — suivi de vols en direct (palier gratuit ~100 requêtes/mois,
// HTTP uniquement, pas de HTTPS sur ce palier). Ne jamais appeler cette fonction sans
// être passé par les garde-fous de quota/cooldown de src/app/api/flights/[bookingId]/route.ts.
const AVIATIONSTACK_BASE_URL = process.env.AVIATIONSTACK_BASE_URL || 'http://api.aviationstack.com/v1'
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY

export type InternalFlightStatus = 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted' | 'unknown'

export interface FlightStatusData {
  status: InternalFlightStatus
  scheduledTime: string | null
  estimatedTime: string | null
  airlineName: string | null
  raw: unknown
}

export interface FlightStatusResult {
  success: boolean
  error?: string
  data?: FlightStatusData
}

const STATUS_MAP: Record<string, InternalFlightStatus> = {
  scheduled: 'scheduled',
  active: 'active',
  landed: 'landed',
  cancelled: 'cancelled',
  incident: 'incident',
  diverted: 'diverted',
}

/**
 * Interroge AviationStack pour un numéro de vol IATA (ex: "AF718").
 * Ne lève jamais d'exception — retourne toujours { success, error?, data? }.
 * Un appel qui aboutit (success: true), même sans vol trouvé, consomme un
 * quota AviationStack et doit être compté par l'appelant.
 */
export async function fetchFlightStatus(flightIata: string): Promise<FlightStatusResult> {
  try {
    if (!AVIATIONSTACK_API_KEY) {
      console.warn('⚠️ [AviationStack] AVIATIONSTACK_API_KEY non configuré, vérification ignorée')
      return { success: false, error: 'AviationStack non configuré' }
    }

    const normalized = flightIata.replace(/\s+/g, '').toUpperCase()
    const url = `${AVIATIONSTACK_BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${encodeURIComponent(normalized)}`

    const response = await fetch(url)
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`❌ [AviationStack] Échec HTTP (${response.status}):`, body)
      return { success: false, error: `HTTP ${response.status}: ${body}` }
    }

    const json = await response.json()

    // AviationStack répond en 200 même en cas d'erreur de quota/plan/clé.
    if (json.error) {
      console.error('❌ [AviationStack] Erreur API:', json.error)
      return { success: false, error: `${json.error.code}: ${json.error.message}` }
    }

    const flight = Array.isArray(json.data) ? json.data[0] : undefined
    if (!flight) {
      return {
        success: true,
        data: { status: 'unknown', scheduledTime: null, estimatedTime: null, airlineName: null, raw: json },
      }
    }

    const status = STATUS_MAP[flight.flight_status] ?? 'unknown'
    // On privilégie le bloc arrivée (usage principal: transferts depuis l'AIBD),
    // avec repli sur le bloc départ si l'arrivée n'a pas d'horaire programmé.
    const timeBlock = flight.arrival?.scheduled ? flight.arrival : flight.departure

    return {
      success: true,
      data: {
        status,
        scheduledTime: timeBlock?.scheduled ?? null,
        estimatedTime: timeBlock?.estimated ?? null,
        airlineName: flight.airline?.name ?? null,
        raw: flight,
      },
    }
  } catch (error) {
    console.error('❌ [AviationStack] Erreur lors de la vérification:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

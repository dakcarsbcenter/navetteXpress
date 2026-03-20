import Anthropic from "@anthropic-ai/sdk"
import {
  getPendingBookings,
  getActiveDrivers,
  getDriverAvailability,
  getDriverExistingBookings,
} from "./tools/booking-tools"
import { getUnrespondedReviews, getDriverName } from "./tools/review-tools"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Types ────────────────────────────────────────────────────────────────────

export interface AssignmentProposal {
  type: "assignment"
  bookingId: number
  customerName: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  driverId: string
  driverName: string
  reasoning: string
  confidence: "high" | "medium" | "low"
}

export interface ReviewProposal {
  type: "review_response"
  reviewId: number
  customerName: string
  rating: number
  comment: string
  driverName: string
  proposedResponse: string
  language: string
  reasoning: string
}

export type AgentProposal = AssignmentProposal | ReviewProposal

export interface StreamEvent {
  type: "thinking" | "tool_call" | "tool_result" | "proposals" | "error"
  text?: string
  toolName?: string
  count?: number
  proposals?: AgentProposal[]
  error?: string
}

// ── Tool definitions for Claude ──────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_pending_bookings",
    description:
      "Récupère toutes les réservations en attente d'assignation (status: pending). Retourne la liste avec date/heure, adresses et informations client.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_active_drivers",
    description:
      "Récupère la liste de tous les chauffeurs actifs disponibles dans le système.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_driver_availability",
    description:
      "Récupère les créneaux de disponibilité d'un chauffeur spécifique. Retourne les jours de la semaine (0=Dimanche..6=Samedi) et les horaires.",
    input_schema: {
      type: "object",
      properties: {
        driver_id: {
          type: "string",
          description: "L'identifiant unique du chauffeur",
        },
      },
      required: ["driver_id"],
    },
  },
  {
    name: "get_driver_existing_bookings",
    description:
      "Récupère les réservations déjà assignées à un chauffeur (assigned, confirmed, in_progress). Permet de vérifier les conflits de planning.",
    input_schema: {
      type: "object",
      properties: {
        driver_id: {
          type: "string",
          description: "L'identifiant unique du chauffeur",
        },
      },
      required: ["driver_id"],
    },
  },
  {
    name: "get_unresponded_reviews",
    description:
      "Récupère tous les avis clients qui n'ont pas encore reçu de réponse de la part de l'administration.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
]

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>
): Promise<string> {
  switch (name) {
    case "get_pending_bookings": {
      const bookings = await getPendingBookings()
      return JSON.stringify(bookings, null, 2)
    }
    case "get_active_drivers": {
      const drivers = await getActiveDrivers()
      return JSON.stringify(drivers, null, 2)
    }
    case "get_driver_availability": {
      const slots = await getDriverAvailability(input.driver_id as string)
      const driverName = await getDriverName(input.driver_id as string)
      return JSON.stringify({ driverName, slots }, null, 2)
    }
    case "get_driver_existing_bookings": {
      const bookings = await getDriverExistingBookings(input.driver_id as string)
      return JSON.stringify(bookings, null, 2)
    }
    case "get_unresponded_reviews": {
      const reviews = await getUnrespondedReviews()
      // Enrich with driver names
      const enriched = await Promise.all(
        reviews.map(async (r) => ({
          ...r,
          driverName: await getDriverName(r.driverId),
        }))
      )
      return JSON.stringify(enriched, null, 2)
    }
    default:
      return JSON.stringify({ error: `Outil inconnu: ${name}` })
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es l'assistant administrateur de NavetteXpress, une plateforme premium de transfert aéroport et de navettes à Dakar, Sénégal.

TON RÔLE :
Tu analyses les données de l'entreprise et tu proposes des actions à l'administrateur humain qui devra les valider avant exécution. Tu ne modifies JAMAIS directement la base de données.

TES RESPONSABILITÉS :
1. ASSIGNATION DES RÉSERVATIONS : Pour chaque réservation en attente, identifier le chauffeur disponible le plus adapté en vérifiant :
   - Sa disponibilité habituelle (jours + horaires)
   - Ses réservations déjà planifiées (conflits)
   - La date et l'heure de la demande du client

2. RÉPONSES AUX AVIS : Pour chaque avis client sans réponse, rédiger une réponse personnalisée et professionnelle :
   - Dans la langue du client (si le commentaire est en anglais → répondre en anglais, sinon en français)
   - Adaptée au ton (chaleureuse si avis positif, empathique et constructive si négatif)
   - Au nom de l'équipe NavetteXpress

FORMAT DE RÉPONSE FINALE :
Après avoir analysé toutes les données, tu DOIS retourner un bloc JSON valide entre les balises <proposals> et </proposals> contenant un tableau de propositions.

Chaque proposition d'assignation a ce format :
{
  "type": "assignment",
  "bookingId": <number>,
  "customerName": "<string>",
  "pickupAddress": "<string>",
  "dropoffAddress": "<string>",
  "scheduledDateTime": "<ISO string>",
  "driverId": "<string>",
  "driverName": "<string>",
  "reasoning": "<explication courte en français>",
  "confidence": "high" | "medium" | "low"
}

Chaque proposition de réponse à un avis a ce format :
{
  "type": "review_response",
  "reviewId": <number>,
  "customerName": "<string>",
  "rating": <1-5>,
  "comment": "<commentaire original>",
  "driverName": "<string>",
  "proposedResponse": "<réponse rédigée>",
  "language": "<fr ou en>",
  "reasoning": "<pourquoi ce ton et cette réponse>"
}

Si aucune action n'est nécessaire pour une catégorie, n'inclus pas de propositions de ce type.

IMPORTANT : Sois précis dans ton raisonnement. Si un chauffeur n'a aucune disponibilité enregistrée, indique confidence: "low" et explique-le.`

// ── Main agent function ───────────────────────────────────────────────────────

export async function* runAdminAgent(): AsyncGenerator<StreamEvent> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content:
        "Analyse les réservations en attente et les avis sans réponse. Pour chaque réservation, vérifie les disponibilités des chauffeurs avant de proposer une assignation. Pour les avis, rédige des réponses adaptées.",
    },
  ]

  yield { type: "thinking", text: "Démarrage de l'analyse..." }

  let iterations = 0
  const MAX_ITERATIONS = 10

  while (iterations < MAX_ITERATIONS) {
    iterations++

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    })

    // Collect tool calls from this response
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    )

    // Stream any text content
    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        // Check if this is the final response with proposals
        if (block.text.includes("<proposals>")) {
          const match = block.text.match(/<proposals>([\s\S]*?)<\/proposals>/)
          if (match) {
            try {
              const proposals: AgentProposal[] = JSON.parse(match[1].trim())
              yield { type: "proposals", proposals }
            } catch {
              yield {
                type: "error",
                error: "Impossible de parser les propositions de l'agent.",
              }
            }
          }
        } else {
          yield { type: "thinking", text: block.text }
        }
      }
    }

    if (response.stop_reason === "end_turn") break

    if (response.stop_reason === "tool_use" && toolUseBlocks.length > 0) {
      messages.push({ role: "assistant", content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const tool of toolUseBlocks) {
        yield { type: "tool_call", toolName: tool.name }

        const result = await executeTool(
          tool.name,
          tool.input as Record<string, unknown>
        )

        // Count items returned for UI feedback
        try {
          const parsed = JSON.parse(result)
          const count = Array.isArray(parsed) ? parsed.length : undefined
          yield { type: "tool_result", toolName: tool.name, count }
        } catch {
          yield { type: "tool_result", toolName: tool.name }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: result,
        })
      }

      messages.push({ role: "user", content: toolResults })
    } else {
      break
    }
  }
}

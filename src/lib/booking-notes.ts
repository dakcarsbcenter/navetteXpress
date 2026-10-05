/**
 * `bookings.notes` sert à la fois de bloc lisible par l'admin et de stockage des
 * champs du formulaire qui n'ont pas de colonne (type de service, options,
 * demandes spéciales). Le format — une ligne par champ — est relu par regex à
 * plusieurs endroits, notamment parseBookingNotes() dans src/lib/whatsapp/templates.ts
 * qui alimente les messages envoyés aux clients et aux chauffeurs.
 *
 * Deux règles à ne pas enfreindre :
 *  - une valeur ne contient jamais de retour à la ligne (`.` ne matche pas `\n`,
 *    le texte serait tronqué dans les emails et WhatsApp) ;
 *  - les lignes ajoutées (Trajet, Précision service) vont en fin de bloc, jamais
 *    intercalées entre les lignes historiques.
 */

export interface BookingNotesFields {
  /** Identifiant du service (src/lib/services.ts), pas son libellé. */
  serviceType: string
  additionalServices: string[]
  specialRequests: string
}

/** Aplatit une valeur multiligne en une seule ligne lisible. */
function flatten(value: string | null | undefined): string {
  return (value ?? '').replace(/\s*\n+\s*/g, ' · ').trim()
}

export interface BuildBookingNotesInput {
  serviceType?: string | null
  vehicleType: 'berline' | 'suv'
  customerPhone: string
  customerEmail?: string | null
  additionalServices?: string[] | null
  specialRequests?: string | null
  /** Nom de l'admin qui saisit la demande au téléphone, pour la traçabilité. */
  enteredBy?: string | null
  /** Position du trajet dans une demande multi-trajets (1-indexée). */
  tripPosition?: number
  tripTotal?: number
}

export function buildBookingNotes(input: BuildBookingNotesInput): string {
  const lines = [
    `Service: ${input.serviceType || 'autres'}`,
    `Véhicule souhaité: ${input.vehicleType === 'suv' ? 'SUV' : 'Berline'}`,
    `Contact: ${input.customerPhone}${input.customerEmail ? ` - ${input.customerEmail}` : ''}`,
    `Services additionnels: ${input.additionalServices?.length ? input.additionalServices.join(', ') : 'Aucun'}`,
    `Demandes spéciales: ${flatten(input.specialRequests) || 'Aucune'}`,
  ]

  if (input.enteredBy !== undefined) {
    lines.push(`Saisie: par ${input.enteredBy || 'un administrateur'} pour le compte du client (téléphone)`)
  }

  if (input.tripTotal && input.tripTotal > 1 && input.tripPosition) {
    lines.push(`Trajet: ${input.tripPosition}/${input.tripTotal} de la demande`)
  }

  return lines.join('\n')
}

/**
 * Relit les champs de formulaire encodés dans les notes, en identifiants bruts —
 * ce qu'il faut pour repeupler les `<select>` lors d'une duplication. À ne pas
 * confondre avec parseBookingNotes() de src/lib/whatsapp/templates.ts, qui rend
 * des libellés traduits destinés à l'affichage.
 *
 * Tolérant par construction : une note absente ou réécrite à la main par un admin
 * ne doit jamais faire échouer la duplication, seulement laisser les valeurs par
 * défaut.
 */
export function parseBookingNotesFields(notes: string | null | undefined): BookingNotesFields {
  const empty: BookingNotesFields = { serviceType: '', additionalServices: [], specialRequests: '' }
  if (!notes) return empty

  const serviceType = notes.match(/Service:\s*(.+)/)?.[1]?.trim() ?? ''

  const optionsRaw = notes.match(/Services additionnels:\s*(.+)/)?.[1]?.trim() ?? ''
  const additionalServices = !optionsRaw || optionsRaw === 'Aucun'
    ? []
    : optionsRaw.split(',').map((id) => id.trim()).filter(Boolean)

  const requestsRaw = notes.match(/Demandes spéciales:\s*(.+)/)?.[1]?.trim() ?? ''
  const specialRequests = requestsRaw === 'Aucune' ? '' : requestsRaw

  return { serviceType, additionalServices, specialRequests }
}

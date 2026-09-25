/**
 * Compagnies aériennes et vols réguliers desservant Dakar (AIBD).
 *
 * Liste métier volontairement statique : elle sert uniquement à guider la saisie
 * du client (autocomplétion). La saisie libre reste autorisée — un vol absent de
 * cette liste doit pouvoir être renseigné sans blocage.
 */

export interface Airline {
  /** Code IATA à 2 caractères, tel qu'il préfixe le numéro de vol */
  iata: string;
  name: string;
  /** Compagnie cargo : jamais un vol passager, gardée pour la déduction de préfixe */
  cargo?: boolean;
}

export interface FlightOption {
  /** Numéro de vol IATA, ex. "AF718" */
  number: string;
  airlineIata: string;
  /** Liaison indicative, affichée en aide à la sélection */
  route?: string;
}

export const AIRLINES: Airline[] = [
  // Sénégal
  { iata: 'HC', name: 'Air Sénégal' },
  { iata: 'R2', name: 'Groupe Transair' },
  // Afrique
  { iata: 'AH', name: 'Air Algérie' },
  { iata: '2J', name: 'Air Burkina' },
  { iata: 'HF', name: "Air Côte d'Ivoire" },
  { iata: 'KP', name: 'ASKY Airlines' },
  { iata: 'ET', name: 'Ethiopian Airlines' },
  { iata: 'KQ', name: 'Kenya Airways' },
  { iata: 'L6', name: 'Mauritania Airlines' },
  { iata: 'AT', name: 'Royal Air Maroc' },
  { iata: 'TU', name: 'Tunisair' },
  // Europe
  { iata: 'AF', name: 'Air France' },
  { iata: 'NT', name: 'Binter Canarias' },
  { iata: 'SN', name: 'Brussels Airlines' },
  { iata: 'IB', name: 'Iberia' },
  { iata: 'AZ', name: 'ITA Airways' },
  { iata: 'TP', name: 'TAP Air Portugal' },
  { iata: 'TO', name: 'Transavia France' },
  { iata: 'TB', name: 'TUI fly Belgium' },
  { iata: 'OR', name: 'TUI fly Netherlands' },
  { iata: 'VY', name: 'Vueling' },
  // Moyen-Orient
  { iata: 'EK', name: 'Emirates' },
  { iata: 'TK', name: 'Turkish Airlines' },
  // Amérique du Nord
  { iata: 'DL', name: 'Delta Air Lines' },
  { iata: 'TS', name: 'Air Transat' },
  // Cargo
  { iata: 'DH', name: 'DHL Aviation', cargo: true },
  { iata: 'LH', name: 'Lufthansa Cargo', cargo: true },
];

export const FLIGHTS: FlightOption[] = [
  // Air Sénégal
  { number: 'HC403', airlineIata: 'HC', route: 'Dakar – Paris CDG' },
  { number: 'HC404', airlineIata: 'HC', route: 'Paris CDG – Dakar' },
  { number: 'HC301', airlineIata: 'HC', route: 'Dakar – Abidjan' },
  { number: 'HC201', airlineIata: 'HC', route: 'Dakar – Bamako' },
  { number: 'HC101', airlineIata: 'HC', route: 'Dakar – Ziguinchor' },
  // Transair
  { number: 'R2501', airlineIata: 'R2', route: 'Dakar – Ziguinchor' },
  { number: 'R2505', airlineIata: 'R2', route: 'Dakar – Cap Skirring' },
  // Afrique
  { number: 'AH5324', airlineIata: 'AH', route: 'Alger – Dakar' },
  { number: 'AH5325', airlineIata: 'AH', route: 'Dakar – Alger' },
  { number: '2J511', airlineIata: '2J', route: 'Ouagadougou – Dakar' },
  { number: '2J512', airlineIata: '2J', route: 'Dakar – Ouagadougou' },
  { number: 'HF720', airlineIata: 'HF', route: 'Abidjan – Dakar' },
  { number: 'HF721', airlineIata: 'HF', route: 'Dakar – Abidjan' },
  { number: 'KP020', airlineIata: 'KP', route: 'Lomé – Dakar' },
  { number: 'KP021', airlineIata: 'KP', route: 'Dakar – Lomé' },
  { number: 'ET908', airlineIata: 'ET', route: 'Addis-Abeba – Dakar' },
  { number: 'ET909', airlineIata: 'ET', route: 'Dakar – Addis-Abeba' },
  { number: 'KQ510', airlineIata: 'KQ', route: 'Nairobi – Dakar' },
  { number: 'KQ511', airlineIata: 'KQ', route: 'Dakar – Nairobi' },
  { number: 'L6112', airlineIata: 'L6', route: 'Nouakchott – Dakar' },
  { number: 'L6113', airlineIata: 'L6', route: 'Dakar – Nouakchott' },
  { number: 'AT501', airlineIata: 'AT', route: 'Casablanca – Dakar' },
  { number: 'AT503', airlineIata: 'AT', route: 'Casablanca – Dakar' },
  { number: 'TU595', airlineIata: 'TU', route: 'Tunis – Dakar' },
  { number: 'TU596', airlineIata: 'TU', route: 'Dakar – Tunis' },
  // Europe
  { number: 'AF718', airlineIata: 'AF', route: 'Paris CDG – Dakar' },
  { number: 'AF719', airlineIata: 'AF', route: 'Dakar – Paris CDG' },
  { number: 'NT600', airlineIata: 'NT', route: 'Las Palmas – Dakar' },
  { number: 'NT601', airlineIata: 'NT', route: 'Dakar – Las Palmas' },
  { number: 'SN203', airlineIata: 'SN', route: 'Bruxelles – Dakar' },
  { number: 'SN204', airlineIata: 'SN', route: 'Dakar – Bruxelles' },
  { number: 'IB3328', airlineIata: 'IB', route: 'Madrid – Dakar' },
  { number: 'IB3329', airlineIata: 'IB', route: 'Dakar – Madrid' },
  { number: 'AZ852', airlineIata: 'AZ', route: 'Rome FCO – Dakar' },
  { number: 'AZ853', airlineIata: 'AZ', route: 'Dakar – Rome FCO' },
  { number: 'TP1481', airlineIata: 'TP', route: 'Lisbonne – Dakar' },
  { number: 'TP1482', airlineIata: 'TP', route: 'Dakar – Lisbonne' },
  { number: 'TO8120', airlineIata: 'TO', route: 'Paris Orly – Dakar' },
  { number: 'TO7980', airlineIata: 'TO', route: 'Marseille – Dakar' },
  { number: 'TO8660', airlineIata: 'TO', route: 'Lyon – Dakar' },
  { number: 'TB2181', airlineIata: 'TB', route: 'Bruxelles – Dakar' },
  { number: 'OR375', airlineIata: 'OR', route: 'Amsterdam – Dakar' },
  { number: 'VY7848', airlineIata: 'VY', route: 'Barcelone – Dakar' },
  { number: 'VY7849', airlineIata: 'VY', route: 'Dakar – Barcelone' },
  // Moyen-Orient
  { number: 'EK797', airlineIata: 'EK', route: 'Dubaï – Dakar' },
  { number: 'EK798', airlineIata: 'EK', route: 'Dakar – Dubaï' },
  { number: 'TK597', airlineIata: 'TK', route: 'Istanbul – Dakar' },
  { number: 'TK598', airlineIata: 'TK', route: 'Dakar – Istanbul' },
  // Amérique du Nord
  { number: 'DL216', airlineIata: 'DL', route: 'New York JFK – Dakar' },
  { number: 'DL217', airlineIata: 'DL', route: 'Dakar – New York JFK' },
  { number: 'TS582', airlineIata: 'TS', route: 'Montréal YUL – Dakar' },
  { number: 'TS583', airlineIata: 'TS', route: 'Dakar – Montréal YUL' },
  // Cargo
  { number: 'DH681', airlineIata: 'DH', route: 'Vols cargo réguliers' },
  { number: 'LH8220', airlineIata: 'LH', route: 'Francfort – Dakar' },
];

export function airlineByIata(iata: string): Airline | undefined {
  const code = iata.trim().toUpperCase();
  return AIRLINES.find((a) => a.iata === code);
}

/**
 * Déduit la compagnie à partir d'un numéro de vol saisi librement.
 * Ex. "AF1234" → Air France, "hc 403" → Air Sénégal.
 */
export function airlineFromFlightNumber(flightNumber: string): Airline | undefined {
  const normalized = flightNumber.replace(/\s+/g, '').toUpperCase();
  const match = normalized.match(/^([A-Z0-9]{2})\d/);
  return match ? airlineByIata(match[1]) : undefined;
}

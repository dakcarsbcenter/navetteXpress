/**
 * Papeterie NavetteXpress : palette, coordonnees et helpers de formatage
 * partages par le PDF de devis et celui de facture.
 *
 * Source de verite : docs/charte-graphique-devis-factures.md.
 * Dans un PDF jsPDF sans police embarquee, Archivo -> `helvetica` et
 * IBM Plex Mono -> `courier`.
 */

export type RGB = [number, number, number];

export const COLORS = {
  cream: [247, 243, 236] as RGB, // #F7F3EC - fond de page
  panel: [239, 232, 216] as RGB, // #EFE8D8 - encarts emetteur / client
  text: [18, 16, 14] as RGB, // #12100E - titres, valeurs, montants
  body: [61, 58, 53] as RGB, // #3D3A35 - corps de texte
  muted: [110, 106, 99] as RGB, // #6E6A63 - labels, mentions legales
  accent: [31, 82, 69] as RGB, // #1F5245 - lagune : totaux, statuts valides
  accentDark: [25, 67, 59] as RGB, // #19433B
  earth: [180, 100, 58] as RGB, // #B4643A - statut en attente
  danger: [185, 28, 28] as RGB, // #B91C1C - en retard
  border: [226, 218, 205] as RGB, // #E2DACD - filets
  white: [255, 255, 255] as RGB,
};

/** Marges A4 : 20 mm a gauche, bord droit du contenu a 190 mm. */
export const PAGE = {
  marginX: 20,
  right: 190,
  width: 210,
  height: 297,
  contentWidth: 170,
};

/** Coordonnees reelles de l'entreprise. Ne jamais y remettre de donnees de demo. */
export const COMPANY_INFO = {
  name: 'Navette Xpress',
  tagline: 'DAKAR \u2014 AIBD \u2014 PETITE C\u00D4TE',
  address: 'Dakar, S\u00E9n\u00E9gal',
  phone: '+221 78 465 13 02',
  email: 'contact@navettexpress.com',
  website: 'navettexpress.com',
  ninea: '012269115',
  rccm: 'SN DKR 2014 A 5816',
};

/** Bande de reperes kilometriques affichee sous l'en-tete des documents. */
export const CORRIDOR = 'DAKAR \u2014\u2014 AIBD 47 KM \u2014\u2014 MBOUR 79 KM \u2014\u2014 PETITE C\u00D4TE 92 KM';

export const PAYMENT_METHODS = {
  title: 'Wave \u00B7 Orange Money \u00B7 Virement \u00B7 Esp\u00E8ces',
  lines: [`Wave / Orange Money : ${COMPANY_INFO.phone}`],
};

/** Taux de TVA senegalais, applique aux devis comme aux factures. */
export const DEFAULT_TAX_RATE = 18;

/**
 * Separateur d'itineraire "depart > destination".
 *
 * Volontairement un guillemet chevron (U+00BB) et NON une fleche U+2192 : les
 * polices standard de jsPDF sont encodees en WinAnsi, qui ne contient pas la
 * fleche. Elle sortait en "!'" et faussait en plus le calcul de largeur du
 * texte, ce qui faisait justifier la ligne sur toute la cellule.
 * Une vraie fleche imposerait d'embarquer une police.
 */
export const ROUTE_ARROW = '»';

/**
 * Formate un montant sans le separateur "narrow no-break space" (non supporte
 * par les polices standard de jsPDF, ce qui produisait un artefact
 * "25/000 FCFA"). Ne pas remplacer par toLocaleString('fr-FR').
 */
export function formatAmount(value: number): string {
  const rounded = Math.round(value || 0);
  const withSpaces = Math.abs(rounded).toLocaleString('en-US').replace(/,/g, ' ');
  return `${rounded < 0 ? '-' : ''}${withSpaces} FCFA`;
}

/** Date au format JJ/MM/AAAA attendu par les modeles officiels. */
export function formatDocumentDate(value: Date | string | null | undefined): string {
  if (!value) return '\u2014';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '\u2014';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/** Date + heure pour les libelles de trajet : "12/10/2026 - 14h30". */
export function formatDocumentDateTime(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const hh = String(date.getHours()).padStart(2, '0');
  const mn = String(date.getMinutes()).padStart(2, '0');
  return `${formatDocumentDate(date)} \u00B7 ${hh}h${mn}`;
}

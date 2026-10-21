/**
 * Indicatifs pays proposés dans PhoneField, et conversion saisie → E.164.
 *
 * Module volontairement sans import : il est utilisé côté navigateur (PhoneField) et
 * côté serveur (phone.ts), et ne doit pas tirer le canal WhatsApp dans le bundle client.
 *
 * Pourquoi un sélecteur plutôt qu'une devinette : "0612345678" peut être un mobile
 * français ou un "0" + 9 chiffres saisi par un Sénégalais — deviner le pays enverrait
 * le message au mauvais destinataire. Le pays est donc choisi par la personne, et la
 * valeur émise est toujours en E.164 (voir toGeskapPhone pour la règle d'envoi).
 */

export interface PhoneCountry {
  iso: string;
  dial: string; // sans "+"
  label: { fr: string; en: string; es: string };
}

export const DEFAULT_DIAL = '221';

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'SN', dial: '221', label: { fr: 'Sénégal', en: 'Senegal', es: 'Senegal' } },
  { iso: 'FR', dial: '33', label: { fr: 'France', en: 'France', es: 'Francia' } },
  { iso: 'US', dial: '1', label: { fr: 'États-Unis / Canada', en: 'United States / Canada', es: 'EE. UU. / Canadá' } },
  { iso: 'GB', dial: '44', label: { fr: 'Royaume-Uni', en: 'United Kingdom', es: 'Reino Unido' } },
  { iso: 'ES', dial: '34', label: { fr: 'Espagne', en: 'Spain', es: 'España' } },
  { iso: 'IT', dial: '39', label: { fr: 'Italie', en: 'Italy', es: 'Italia' } },
  { iso: 'DE', dial: '49', label: { fr: 'Allemagne', en: 'Germany', es: 'Alemania' } },
  { iso: 'BE', dial: '32', label: { fr: 'Belgique', en: 'Belgium', es: 'Bélgica' } },
  { iso: 'CH', dial: '41', label: { fr: 'Suisse', en: 'Switzerland', es: 'Suiza' } },
  { iso: 'PT', dial: '351', label: { fr: 'Portugal', en: 'Portugal', es: 'Portugal' } },
  { iso: 'CI', dial: '225', label: { fr: "Côte d'Ivoire", en: 'Ivory Coast', es: 'Costa de Marfil' } },
  { iso: 'ML', dial: '223', label: { fr: 'Mali', en: 'Mali', es: 'Malí' } },
  { iso: 'GN', dial: '224', label: { fr: 'Guinée', en: 'Guinea', es: 'Guinea' } },
  { iso: 'MR', dial: '222', label: { fr: 'Mauritanie', en: 'Mauritania', es: 'Mauritania' } },
  { iso: 'GM', dial: '220', label: { fr: 'Gambie', en: 'Gambia', es: 'Gambia' } },
  { iso: 'GW', dial: '245', label: { fr: 'Guinée-Bissau', en: 'Guinea-Bissau', es: 'Guinea-Bisáu' } },
  { iso: 'CM', dial: '237', label: { fr: 'Cameroun', en: 'Cameroon', es: 'Camerún' } },
  { iso: 'MA', dial: '212', label: { fr: 'Maroc', en: 'Morocco', es: 'Marruecos' } },
  { iso: 'DZ', dial: '213', label: { fr: 'Algérie', en: 'Algeria', es: 'Argelia' } },
  { iso: 'TN', dial: '216', label: { fr: 'Tunisie', en: 'Tunisia', es: 'Túnez' } },
];

/** Indicatifs triés du plus long au plus court : "221" doit être testé avant "2…" inconnu. */
const DIALS_BY_LENGTH = Array.from(new Set(PHONE_COUNTRIES.map((c) => c.dial))).sort(
  (a, b) => b.length - a.length
);

/**
 * En Italie le 0 de tête fait partie du numéro (fixes) : on ne le retire pas.
 * Ailleurs c'est le préfixe interurbain national, absent du format international.
 */
const KEEP_LEADING_ZERO = new Set(['39']);

const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Saisie + indicatif choisi → "+<indicatif><numéro>", ou '' si rien n'est saisi.
 *
 * Une saisie qui commence par "+" ou "00" est déjà internationale : elle l'emporte sur
 * le sélecteur (un client qui colle "+33 6 12 34 56 78" avec "Sénégal" sélectionné
 * ne doit pas obtenir +22133…).
 */
export function buildInternationalPhone(dial: string, nationalInput: string): string {
  const trimmed = nationalInput.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;

  const national = KEEP_LEADING_ZERO.has(dial) ? digits : digits.replace(/^0+/, '');
  return `+${dial}${national}`;
}

/** E.164 → indicatif + partie nationale, pour pré-remplir le sélecteur en édition. */
export function splitInternationalPhone(value: string | null | undefined): {
  dial: string;
  national: string;
} {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return { dial: DEFAULT_DIAL, national: '' };

  const digits = trimmed.replace(/\D/g, '');
  const international = trimmed.startsWith('+')
    ? digits
    : digits.startsWith('00')
      ? digits.slice(2)
      : null;

  if (international) {
    const dial = DIALS_BY_LENGTH.find((d) => international.startsWith(d));
    if (dial) return { dial, national: international.slice(dial.length) };
    return { dial: DEFAULT_DIAL, national: trimmed };
  }

  // Valeur historique sans indicatif (ex: "771234567") : saisie nationale telle quelle.
  return { dial: DEFAULT_DIAL, national: trimmed };
}

export function isCompleteInternationalPhone(value: string): boolean {
  return E164.test(value);
}

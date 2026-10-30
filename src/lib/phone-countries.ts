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
export const DEFAULT_ISO = 'SN';

// [iso, indicatif, fr, en, es] — forme compacte : la liste couvre tous les indicatifs UIT.
type Row = [string, string, string, string, string];

/** Pays les plus fréquents chez nos clients : affichés en tête, dans cet ordre. */
const FREQUENT: Row[] = [
  ['SN', '221', 'Sénégal', 'Senegal', 'Senegal'],
  ['FR', '33', 'France', 'France', 'Francia'],
  ['US', '1', 'États-Unis', 'United States', 'Estados Unidos'],
  ['CA', '1', 'Canada', 'Canada', 'Canadá'],
  ['GB', '44', 'Royaume-Uni', 'United Kingdom', 'Reino Unido'],
  ['ES', '34', 'Espagne', 'Spain', 'España'],
  ['IT', '39', 'Italie', 'Italy', 'Italia'],
  ['DE', '49', 'Allemagne', 'Germany', 'Alemania'],
  ['BE', '32', 'Belgique', 'Belgium', 'Bélgica'],
  ['CH', '41', 'Suisse', 'Switzerland', 'Suiza'],
  ['PT', '351', 'Portugal', 'Portugal', 'Portugal'],
  ['CI', '225', "Côte d'Ivoire", 'Ivory Coast', 'Costa de Marfil'],
  ['ML', '223', 'Mali', 'Mali', 'Malí'],
  ['GN', '224', 'Guinée', 'Guinea', 'Guinea'],
  ['MR', '222', 'Mauritanie', 'Mauritania', 'Mauritania'],
  ['GM', '220', 'Gambie', 'Gambia', 'Gambia'],
  ['GW', '245', 'Guinée-Bissau', 'Guinea-Bissau', 'Guinea-Bisáu'],
  ['CM', '237', 'Cameroun', 'Cameroon', 'Camerún'],
  ['MA', '212', 'Maroc', 'Morocco', 'Marruecos'],
  ['DZ', '213', 'Algérie', 'Algeria', 'Argelia'],
  ['TN', '216', 'Tunisie', 'Tunisia', 'Túnez'],
];

const OTHERS: Row[] = [
  ['AF', '93', 'Afghanistan', 'Afghanistan', 'Afganistán'],
  ['ZA', '27', 'Afrique du Sud', 'South Africa', 'Sudáfrica'],
  ['AX', '358', 'Îles Åland', 'Åland Islands', 'Islas Åland'],
  ['AL', '355', 'Albanie', 'Albania', 'Albania'],
  ['AD', '376', 'Andorre', 'Andorra', 'Andorra'],
  ['AO', '244', 'Angola', 'Angola', 'Angola'],
  ['AI', '1', 'Anguilla', 'Anguilla', 'Anguila'],
  ['AG', '1', 'Antigua-et-Barbuda', 'Antigua and Barbuda', 'Antigua y Barbuda'],
  ['SA', '966', 'Arabie saoudite', 'Saudi Arabia', 'Arabia Saudí'],
  ['AR', '54', 'Argentine', 'Argentina', 'Argentina'],
  ['AM', '374', 'Arménie', 'Armenia', 'Armenia'],
  ['AW', '297', 'Aruba', 'Aruba', 'Aruba'],
  ['AU', '61', 'Australie', 'Australia', 'Australia'],
  ['AT', '43', 'Autriche', 'Austria', 'Austria'],
  ['AZ', '994', 'Azerbaïdjan', 'Azerbaijan', 'Azerbaiyán'],
  ['BS', '1', 'Bahamas', 'Bahamas', 'Bahamas'],
  ['BH', '973', 'Bahreïn', 'Bahrain', 'Baréin'],
  ['BD', '880', 'Bangladesh', 'Bangladesh', 'Bangladés'],
  ['BB', '1', 'Barbade', 'Barbados', 'Barbados'],
  ['BZ', '501', 'Belize', 'Belize', 'Belice'],
  ['BJ', '229', 'Bénin', 'Benin', 'Benín'],
  ['BM', '1', 'Bermudes', 'Bermuda', 'Bermudas'],
  ['BT', '975', 'Bhoutan', 'Bhutan', 'Bután'],
  ['BY', '375', 'Biélorussie', 'Belarus', 'Bielorrusia'],
  ['MM', '95', 'Birmanie (Myanmar)', 'Myanmar (Burma)', 'Birmania (Myanmar)'],
  ['BO', '591', 'Bolivie', 'Bolivia', 'Bolivia'],
  ['BA', '387', 'Bosnie-Herzégovine', 'Bosnia and Herzegovina', 'Bosnia y Herzegovina'],
  ['BW', '267', 'Botswana', 'Botswana', 'Botsuana'],
  ['BR', '55', 'Brésil', 'Brazil', 'Brasil'],
  ['BN', '673', 'Brunei', 'Brunei', 'Brunéi'],
  ['BG', '359', 'Bulgarie', 'Bulgaria', 'Bulgaria'],
  ['BF', '226', 'Burkina Faso', 'Burkina Faso', 'Burkina Faso'],
  ['BI', '257', 'Burundi', 'Burundi', 'Burundi'],
  ['KY', '1', 'Îles Caïmans', 'Cayman Islands', 'Islas Caimán'],
  ['KH', '855', 'Cambodge', 'Cambodia', 'Camboya'],
  ['CV', '238', 'Cap-Vert', 'Cape Verde', 'Cabo Verde'],
  ['CF', '236', 'République centrafricaine', 'Central African Republic', 'República Centroafricana'],
  ['CL', '56', 'Chili', 'Chile', 'Chile'],
  ['CN', '86', 'Chine', 'China', 'China'],
  ['CX', '61', 'Île Christmas', 'Christmas Island', 'Isla de Navidad'],
  ['CY', '357', 'Chypre', 'Cyprus', 'Chipre'],
  ['CC', '61', 'Îles Cocos', 'Cocos (Keeling) Islands', 'Islas Cocos'],
  ['CO', '57', 'Colombie', 'Colombia', 'Colombia'],
  ['KM', '269', 'Comores', 'Comoros', 'Comoras'],
  ['CG', '242', 'Congo-Brazzaville', 'Congo (Republic)', 'Congo (República)'],
  ['CD', '243', 'Congo-Kinshasa (RDC)', 'Congo (DRC)', 'Congo (RD)'],
  ['CK', '682', 'Îles Cook', 'Cook Islands', 'Islas Cook'],
  ['KR', '82', 'Corée du Sud', 'South Korea', 'Corea del Sur'],
  ['KP', '850', 'Corée du Nord', 'North Korea', 'Corea del Norte'],
  ['CR', '506', 'Costa Rica', 'Costa Rica', 'Costa Rica'],
  ['HR', '385', 'Croatie', 'Croatia', 'Croacia'],
  ['CU', '53', 'Cuba', 'Cuba', 'Cuba'],
  ['CW', '599', 'Curaçao', 'Curaçao', 'Curazao'],
  ['DK', '45', 'Danemark', 'Denmark', 'Dinamarca'],
  ['DJ', '253', 'Djibouti', 'Djibouti', 'Yibuti'],
  ['DM', '1', 'Dominique', 'Dominica', 'Dominica'],
  ['DO', '1', 'République dominicaine', 'Dominican Republic', 'República Dominicana'],
  ['EG', '20', 'Égypte', 'Egypt', 'Egipto'],
  ['AE', '971', 'Émirats arabes unis', 'United Arab Emirates', 'Emiratos Árabes Unidos'],
  ['EC', '593', 'Équateur', 'Ecuador', 'Ecuador'],
  ['ER', '291', 'Érythrée', 'Eritrea', 'Eritrea'],
  ['EE', '372', 'Estonie', 'Estonia', 'Estonia'],
  ['SZ', '268', 'Eswatini', 'Eswatini', 'Esuatini'],
  ['ET', '251', 'Éthiopie', 'Ethiopia', 'Etiopía'],
  ['FK', '500', 'Îles Malouines', 'Falkland Islands', 'Islas Malvinas'],
  ['FO', '298', 'Îles Féroé', 'Faroe Islands', 'Islas Feroe'],
  ['FJ', '679', 'Fidji', 'Fiji', 'Fiyi'],
  ['FI', '358', 'Finlande', 'Finland', 'Finlandia'],
  ['GA', '241', 'Gabon', 'Gabon', 'Gabón'],
  ['GE', '995', 'Géorgie', 'Georgia', 'Georgia'],
  ['GH', '233', 'Ghana', 'Ghana', 'Ghana'],
  ['GI', '350', 'Gibraltar', 'Gibraltar', 'Gibraltar'],
  ['GR', '30', 'Grèce', 'Greece', 'Grecia'],
  ['GD', '1', 'Grenade', 'Grenada', 'Granada'],
  ['GL', '299', 'Groenland', 'Greenland', 'Groenlandia'],
  ['GP', '590', 'Guadeloupe', 'Guadeloupe', 'Guadalupe'],
  ['GU', '1', 'Guam', 'Guam', 'Guam'],
  ['GT', '502', 'Guatemala', 'Guatemala', 'Guatemala'],
  ['GG', '44', 'Guernesey', 'Guernsey', 'Guernsey'],
  ['GQ', '240', 'Guinée équatoriale', 'Equatorial Guinea', 'Guinea Ecuatorial'],
  ['GY', '592', 'Guyana', 'Guyana', 'Guyana'],
  ['GF', '594', 'Guyane française', 'French Guiana', 'Guayana Francesa'],
  ['HT', '509', 'Haïti', 'Haiti', 'Haití'],
  ['HN', '504', 'Honduras', 'Honduras', 'Honduras'],
  ['HK', '852', 'Hong Kong', 'Hong Kong', 'Hong Kong'],
  ['HU', '36', 'Hongrie', 'Hungary', 'Hungría'],
  ['IM', '44', 'Île de Man', 'Isle of Man', 'Isla de Man'],
  ['VG', '1', 'Îles Vierges britanniques', 'British Virgin Islands', 'Islas Vírgenes Británicas'],
  ['VI', '1', 'Îles Vierges des États-Unis', 'U.S. Virgin Islands', 'Islas Vírgenes de EE. UU.'],
  ['IN', '91', 'Inde', 'India', 'India'],
  ['ID', '62', 'Indonésie', 'Indonesia', 'Indonesia'],
  ['IQ', '964', 'Irak', 'Iraq', 'Irak'],
  ['IR', '98', 'Iran', 'Iran', 'Irán'],
  ['IE', '353', 'Irlande', 'Ireland', 'Irlanda'],
  ['IS', '354', 'Islande', 'Iceland', 'Islandia'],
  ['IL', '972', 'Israël', 'Israel', 'Israel'],
  ['JM', '1', 'Jamaïque', 'Jamaica', 'Jamaica'],
  ['JP', '81', 'Japon', 'Japan', 'Japón'],
  ['JE', '44', 'Jersey', 'Jersey', 'Jersey'],
  ['JO', '962', 'Jordanie', 'Jordan', 'Jordania'],
  ['KZ', '7', 'Kazakhstan', 'Kazakhstan', 'Kazajistán'],
  ['KE', '254', 'Kenya', 'Kenya', 'Kenia'],
  ['KG', '996', 'Kirghizistan', 'Kyrgyzstan', 'Kirguistán'],
  ['KI', '686', 'Kiribati', 'Kiribati', 'Kiribati'],
  ['XK', '383', 'Kosovo', 'Kosovo', 'Kosovo'],
  ['KW', '965', 'Koweït', 'Kuwait', 'Kuwait'],
  ['LA', '856', 'Laos', 'Laos', 'Laos'],
  ['LS', '266', 'Lesotho', 'Lesotho', 'Lesoto'],
  ['LV', '371', 'Lettonie', 'Latvia', 'Letonia'],
  ['LB', '961', 'Liban', 'Lebanon', 'Líbano'],
  ['LR', '231', 'Liberia', 'Liberia', 'Liberia'],
  ['LY', '218', 'Libye', 'Libya', 'Libia'],
  ['LI', '423', 'Liechtenstein', 'Liechtenstein', 'Liechtenstein'],
  ['LT', '370', 'Lituanie', 'Lithuania', 'Lituania'],
  ['LU', '352', 'Luxembourg', 'Luxembourg', 'Luxemburgo'],
  ['MO', '853', 'Macao', 'Macau', 'Macao'],
  ['MK', '389', 'Macédoine du Nord', 'North Macedonia', 'Macedonia del Norte'],
  ['MG', '261', 'Madagascar', 'Madagascar', 'Madagascar'],
  ['MY', '60', 'Malaisie', 'Malaysia', 'Malasia'],
  ['MW', '265', 'Malawi', 'Malawi', 'Malaui'],
  ['MV', '960', 'Maldives', 'Maldives', 'Maldivas'],
  ['MT', '356', 'Malte', 'Malta', 'Malta'],
  ['MP', '1', 'Îles Mariannes du Nord', 'Northern Mariana Islands', 'Islas Marianas del Norte'],
  ['MH', '692', 'Îles Marshall', 'Marshall Islands', 'Islas Marshall'],
  ['MQ', '596', 'Martinique', 'Martinique', 'Martinica'],
  ['MU', '230', 'Maurice', 'Mauritius', 'Mauricio'],
  ['YT', '262', 'Mayotte', 'Mayotte', 'Mayotte'],
  ['MX', '52', 'Mexique', 'Mexico', 'México'],
  ['FM', '691', 'Micronésie', 'Micronesia', 'Micronesia'],
  ['MD', '373', 'Moldavie', 'Moldova', 'Moldavia'],
  ['MC', '377', 'Monaco', 'Monaco', 'Mónaco'],
  ['MN', '976', 'Mongolie', 'Mongolia', 'Mongolia'],
  ['ME', '382', 'Monténégro', 'Montenegro', 'Montenegro'],
  ['MS', '1', 'Montserrat', 'Montserrat', 'Montserrat'],
  ['MZ', '258', 'Mozambique', 'Mozambique', 'Mozambique'],
  ['NA', '264', 'Namibie', 'Namibia', 'Namibia'],
  ['NR', '674', 'Nauru', 'Nauru', 'Nauru'],
  ['NP', '977', 'Népal', 'Nepal', 'Nepal'],
  ['NI', '505', 'Nicaragua', 'Nicaragua', 'Nicaragua'],
  ['NE', '227', 'Niger', 'Niger', 'Níger'],
  ['NG', '234', 'Nigeria', 'Nigeria', 'Nigeria'],
  ['NU', '683', 'Niue', 'Niue', 'Niue'],
  ['NF', '672', 'Île Norfolk', 'Norfolk Island', 'Isla Norfolk'],
  ['NO', '47', 'Norvège', 'Norway', 'Noruega'],
  ['NC', '687', 'Nouvelle-Calédonie', 'New Caledonia', 'Nueva Caledonia'],
  ['NZ', '64', 'Nouvelle-Zélande', 'New Zealand', 'Nueva Zelanda'],
  ['IO', '246', "Territoire britannique de l'océan Indien", 'British Indian Ocean Territory', 'Territorio Británico del Océano Índico'],
  ['OM', '968', 'Oman', 'Oman', 'Omán'],
  ['UG', '256', 'Ouganda', 'Uganda', 'Uganda'],
  ['UZ', '998', 'Ouzbékistan', 'Uzbekistan', 'Uzbekistán'],
  ['PK', '92', 'Pakistan', 'Pakistan', 'Pakistán'],
  ['PW', '680', 'Palaos', 'Palau', 'Palaos'],
  ['PS', '970', 'Palestine', 'Palestine', 'Palestina'],
  ['PA', '507', 'Panama', 'Panama', 'Panamá'],
  ['PG', '675', 'Papouasie-Nouvelle-Guinée', 'Papua New Guinea', 'Papúa Nueva Guinea'],
  ['PY', '595', 'Paraguay', 'Paraguay', 'Paraguay'],
  ['NL', '31', 'Pays-Bas', 'Netherlands', 'Países Bajos'],
  ['BQ', '599', 'Pays-Bas caribéens', 'Caribbean Netherlands', 'Caribe neerlandés'],
  ['PE', '51', 'Pérou', 'Peru', 'Perú'],
  ['PH', '63', 'Philippines', 'Philippines', 'Filipinas'],
  ['PL', '48', 'Pologne', 'Poland', 'Polonia'],
  ['PF', '689', 'Polynésie française', 'French Polynesia', 'Polinesia Francesa'],
  ['PR', '1', 'Porto Rico', 'Puerto Rico', 'Puerto Rico'],
  ['QA', '974', 'Qatar', 'Qatar', 'Catar'],
  ['RE', '262', 'La Réunion', 'Réunion', 'Reunión'],
  ['RO', '40', 'Roumanie', 'Romania', 'Rumanía'],
  ['RU', '7', 'Russie', 'Russia', 'Rusia'],
  ['RW', '250', 'Rwanda', 'Rwanda', 'Ruanda'],
  ['BL', '590', 'Saint-Barthélemy', 'Saint Barthélemy', 'San Bartolomé'],
  ['KN', '1', 'Saint-Christophe-et-Niévès', 'Saint Kitts and Nevis', 'San Cristóbal y Nieves'],
  ['SM', '378', 'Saint-Marin', 'San Marino', 'San Marino'],
  ['MF', '590', 'Saint-Martin', 'Saint Martin', 'San Martín'],
  ['SX', '1', 'Sint Maarten', 'Sint Maarten', 'Sint Maarten'],
  ['PM', '508', 'Saint-Pierre-et-Miquelon', 'Saint Pierre and Miquelon', 'San Pedro y Miquelón'],
  ['VC', '1', 'Saint-Vincent-et-les-Grenadines', 'Saint Vincent and the Grenadines', 'San Vicente y las Granadinas'],
  ['SH', '290', 'Sainte-Hélène', 'Saint Helena', 'Santa Elena'],
  ['LC', '1', 'Sainte-Lucie', 'Saint Lucia', 'Santa Lucía'],
  ['SB', '677', 'Îles Salomon', 'Solomon Islands', 'Islas Salomón'],
  ['SV', '503', 'Salvador', 'El Salvador', 'El Salvador'],
  ['WS', '685', 'Samoa', 'Samoa', 'Samoa'],
  ['AS', '1', 'Samoa américaines', 'American Samoa', 'Samoa Americana'],
  ['ST', '239', 'Sao Tomé-et-Principe', 'São Tomé and Príncipe', 'Santo Tomé y Príncipe'],
  ['RS', '381', 'Serbie', 'Serbia', 'Serbia'],
  ['SC', '248', 'Seychelles', 'Seychelles', 'Seychelles'],
  ['SL', '232', 'Sierra Leone', 'Sierra Leone', 'Sierra Leona'],
  ['SG', '65', 'Singapour', 'Singapore', 'Singapur'],
  ['SK', '421', 'Slovaquie', 'Slovakia', 'Eslovaquia'],
  ['SI', '386', 'Slovénie', 'Slovenia', 'Eslovenia'],
  ['SO', '252', 'Somalie', 'Somalia', 'Somalia'],
  ['SD', '249', 'Soudan', 'Sudan', 'Sudán'],
  ['SS', '211', 'Soudan du Sud', 'South Sudan', 'Sudán del Sur'],
  ['LK', '94', 'Sri Lanka', 'Sri Lanka', 'Sri Lanka'],
  ['SE', '46', 'Suède', 'Sweden', 'Suecia'],
  ['SR', '597', 'Suriname', 'Suriname', 'Surinam'],
  ['SJ', '47', 'Svalbard et Jan Mayen', 'Svalbard and Jan Mayen', 'Svalbard y Jan Mayen'],
  ['SY', '963', 'Syrie', 'Syria', 'Siria'],
  ['TJ', '992', 'Tadjikistan', 'Tajikistan', 'Tayikistán'],
  ['TW', '886', 'Taïwan', 'Taiwan', 'Taiwán'],
  ['TZ', '255', 'Tanzanie', 'Tanzania', 'Tanzania'],
  ['TD', '235', 'Tchad', 'Chad', 'Chad'],
  ['CZ', '420', 'Tchéquie', 'Czechia', 'Chequia'],
  ['TH', '66', 'Thaïlande', 'Thailand', 'Tailandia'],
  ['TL', '670', 'Timor oriental', 'Timor-Leste', 'Timor Oriental'],
  ['TG', '228', 'Togo', 'Togo', 'Togo'],
  ['TK', '690', 'Tokelau', 'Tokelau', 'Tokelau'],
  ['TO', '676', 'Tonga', 'Tonga', 'Tonga'],
  ['TT', '1', 'Trinité-et-Tobago', 'Trinidad and Tobago', 'Trinidad y Tobago'],
  ['TM', '993', 'Turkménistan', 'Turkmenistan', 'Turkmenistán'],
  ['TC', '1', 'Îles Turques-et-Caïques', 'Turks and Caicos Islands', 'Islas Turcas y Caicos'],
  ['TR', '90', 'Turquie', 'Türkiye', 'Turquía'],
  ['TV', '688', 'Tuvalu', 'Tuvalu', 'Tuvalu'],
  ['UA', '380', 'Ukraine', 'Ukraine', 'Ucrania'],
  ['UY', '598', 'Uruguay', 'Uruguay', 'Uruguay'],
  ['VU', '678', 'Vanuatu', 'Vanuatu', 'Vanuatu'],
  ['VA', '39', 'Vatican', 'Vatican City', 'Ciudad del Vaticano'],
  ['VE', '58', 'Venezuela', 'Venezuela', 'Venezuela'],
  ['VN', '84', 'Viêt Nam', 'Vietnam', 'Vietnam'],
  ['WF', '681', 'Wallis-et-Futuna', 'Wallis and Futuna', 'Wallis y Futuna'],
  ['YE', '967', 'Yémen', 'Yemen', 'Yemen'],
  ['ZM', '260', 'Zambie', 'Zambia', 'Zambia'],
  ['ZW', '263', 'Zimbabwe', 'Zimbabwe', 'Zimbabue'],
];

const toCountry = ([iso, dial, fr, en, es]: Row): PhoneCountry => ({ iso, dial, label: { fr, en, es } });

/** Pays fréquents d'abord ; PhoneField trie le reste par libellé dans la langue affichée. */
export const PHONE_COUNTRIES: PhoneCountry[] = [...FREQUENT, ...OTHERS].map(toCountry);

export const FREQUENT_ISOS: ReadonlySet<string> = new Set(FREQUENT.map(([iso]) => iso));

/**
 * Plusieurs pays partagent un indicatif (+1 pour toute la zone NANP, +7 Russie/Kazakhstan,
 * +44 Royaume-Uni/îles anglo-normandes…) : un numéro E.164 seul ne dit pas lequel. On
 * affiche alors le pays préféré, sauf si le pays déjà choisi a ce même indicatif.
 */
const PREFERRED_ISO_BY_DIAL: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '39': 'IT',
  '44': 'GB',
  '47': 'NO',
  '61': 'AU',
  '262': 'RE',
  '358': 'FI',
  '590': 'GP',
  '599': 'CW',
};

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

export function countryForDial(dial: string, currentIso?: string): PhoneCountry {
  const current = currentIso ? BY_ISO.get(currentIso) : undefined;
  if (current && current.dial === dial) return current;
  return (
    BY_ISO.get(PREFERRED_ISO_BY_DIAL[dial] ?? '') ??
    PHONE_COUNTRIES.find((c) => c.dial === dial) ??
    BY_ISO.get(DEFAULT_ISO)!
  );
}

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

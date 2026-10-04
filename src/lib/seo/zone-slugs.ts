// Source unique des pages /zones/[zone] : consommee a la fois par la page
// (generateStaticParams + garde 404) et par le sitemap. Elles etaient
// dupliquees, et le sitemap avait derive : il declarait a Google `saly`,
// `saint-louis`, `mbour`, `lac-rose` et `somone`, qui n'ont jamais eu de page
// zone — ces URLs partaient en 404 indexables. Les destinations de la Petite
// Cote sont couvertes par les money pages /routes/aibd-*, deja listees dans le
// sitemap via allMoneyPages.
//
// Ajouter un slug ici ne suffit pas : il faut aussi la traduction
// correspondante dans `zonesData` de messages/{fr,en,es}/zones.json, sinon la
// page plante au rendu.
export const zoneSlugs: readonly string[] = ['almadies', 'plateau', 'ngor', 'yoff', 'sacre-coeur'];

/**
 * Contrôle des règles de normalisation téléphonique (src/lib/whatsapp/geskap.ts).
 *
 * Lancer : npx tsx scripts/test-phone-normalization.ts
 *
 * Le dépôt n'a pas d'infra de test : ce script suit la convention des autres
 * scripts/test-* et s'exécute via tsx, comme email:preview ou seo:refresh:monthly.
 * Il documente surtout le cas qui a fait manquer la confirmation de la réservation
 * #7 — le préfixe de sortie international "00", qui donnait "+0033680264157".
 */

import { toGeskapPhone, isValidE164, phoneForDisplay } from '../src/lib/whatsapp/geskap';
import {
  buildInternationalPhone,
  splitInternationalPhone,
  isCompleteInternationalPhone,
} from '../src/lib/phone-countries';
import { requireValidPhone, InvalidPhoneError } from '../src/lib/phone';

let failures = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✅ ${label} → ${String(actual)}`);
  } else {
    failures++;
    console.error(`  ❌ ${label} → attendu ${String(expected)}, obtenu ${String(actual)}`);
  }
}

console.log('\n🔢 toGeskapPhone — préfixe de sortie international "00"');
expect('0033680264157', toGeskapPhone('0033680264157'), '+33680264157');
expect('00221771234567', toGeskapPhone('00221771234567'), '+221771234567');
expect('00 33 6 80 26 41 57', toGeskapPhone('00 33 6 80 26 41 57'), '+33680264157');

console.log('\n🔢 toGeskapPhone — déjà international');
expect('+33680264157', toGeskapPhone('+33680264157'), '+33680264157');
expect('+221 77 123 45 67', toGeskapPhone('+221 77 123 45 67'), '+221771234567');

console.log('\n🔢 toGeskapPhone — règles sénégalaises');
expect('771234567', toGeskapPhone('771234567'), '+221771234567');
expect('77 123 45 67', toGeskapPhone('77 123 45 67'), '+221771234567');
expect('221771234567', toGeskapPhone('221771234567'), '+221771234567');

console.log('\n🔢 toGeskapPhone — pays non devinable (on ne suppose jamais +221)');
expect('0680264157 ≠ +221…', toGeskapPhone('0680264157') === '+2210680264157', false);
expect('0680264157 invalide', isValidE164(toGeskapPhone('0680264157')), false);

console.log('\n✔️  isValidE164');
for (const ok of ['+221771234567', '+33680264157']) expect(`accepte ${ok}`, isValidE164(ok), true);
for (const ko of ['+0033680264157', '+0680264157', '+221', '221771234567', '+', '']) {
  expect(`rejette "${ko}"`, isValidE164(ko), false);
}

console.log('\n📞 phoneForDisplay');
expect('771234567', phoneForDisplay('771234567'), '+221 77 123 45 67');
expect('0033680264157', phoneForDisplay('0033680264157'), '+33680264157');
expect('null', phoneForDisplay(null), '—');

console.log('\n🌍 buildInternationalPhone — indicatif choisi dans PhoneField');
expect('+33 / 06 12 34 56 78', buildInternationalPhone('33', '06 12 34 56 78'), '+33612345678');
expect('+221 / 0771234567 (0 de tête retiré)', buildInternationalPhone('221', '0771234567'), '+221771234567');
expect('+221 / 77 123 45 67', buildInternationalPhone('221', '77 123 45 67'), '+221771234567');
expect('+39 / 0612345678 (0 conservé en Italie)', buildInternationalPhone('39', '0612345678'), '+390612345678');
expect('+221 sélectionné, saisie +33… (la saisie gagne)', buildInternationalPhone('221', '+33 6 12 34 56 78'), '+33612345678');
expect('+221 sélectionné, saisie 0033… (la saisie gagne)', buildInternationalPhone('221', '0033612345678'), '+33612345678');
expect('champ vide', buildInternationalPhone('221', '  '), '');
expect('résultat accepté par isValidE164', isValidE164(buildInternationalPhone('33', '06 12 34 56 78')), true);
expect('numéro incomplet', isCompleteInternationalPhone(buildInternationalPhone('33', '06 12')), false);

console.log('\n🌍 splitInternationalPhone — pré-remplissage en édition');
expect('+33612345678 → 33', splitInternationalPhone('+33612345678').dial, '33');
expect('+33612345678 → national', splitInternationalPhone('+33612345678').national, '612345678');
expect('+221771234567 → 221', splitInternationalPhone('+221771234567').dial, '221');
expect('0033612345678 → 33', splitInternationalPhone('0033612345678').dial, '33');
expect('771234567 (historique) → 221', splitInternationalPhone('771234567').dial, '221');
expect('vide → 221', splitInternationalPhone('').dial, '221');
expect('aller-retour', (() => {
  const { dial, national } = splitInternationalPhone('+33612345678');
  return buildInternationalPhone(dial, national);
})(), '+33612345678');

console.log('\n🛡️  requireValidPhone — saisies publiques');
expect('E.164 accepté', requireValidPhone('+33612345678'), '+33612345678');
expect('9 chiffres sénégalais accepté', requireValidPhone('77 123 45 67'), '+221771234567');
expect('vide → null', requireValidPhone('  '), null);
for (const ambiguous of ['0612345678', '06 12 34 56 78']) {
  let rejected = false;
  try {
    requireValidPhone(ambiguous);
  } catch (error) {
    rejected = error instanceof InvalidPhoneError;
  }
  expect(`refuse "${ambiguous}" (pays inconnu)`, rejected, true);
}

console.log(failures === 0 ? '\n✅ Tous les cas passent.\n' : `\n❌ ${failures} cas en échec.\n`);
// process.exitCode plutôt que process.exit() : sur Windows, tsx fait planter libuv
// ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)") sur une sortie forcée.
process.exitCode = failures === 0 ? 0 : 1;

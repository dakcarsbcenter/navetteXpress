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

console.log(failures === 0 ? '\n✅ Tous les cas passent.\n' : `\n❌ ${failures} cas en échec.\n`);
// process.exitCode plutôt que process.exit() : sur Windows, tsx fait planter libuv
// ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)") sur une sortie forcée.
process.exitCode = failures === 0 ? 0 : 1;

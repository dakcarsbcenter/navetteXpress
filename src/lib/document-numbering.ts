/**
 * Numerotation des pieces officielles (devis et factures).
 *
 * Deux implementations divergentes coexistaient : l'une basee sur
 * `ORDER BY id DESC` (src/lib/invoice-utils.ts), qui derive des qu'un numero
 * plus grand porte un id plus petit, l'autre sur le MAX en SQL
 * (src/app/api/invoices/route.ts). Seule la seconde est correcte : c'est elle
 * qui est generalisee ici, et les deux anciens points d'appel delegent
 * desormais a ce module.
 *
 * Le filet de securite reste la contrainte UNIQUE en base
 * (`quotes.reference`, `invoices.invoice_number`) : deux generations
 * simultanees font echouer la seconde insertion plutot que de produire un
 * doublon silencieux.
 */

import { db } from '@/db';
import { invoicesTable, quotesTable } from '@/schema';
import { like, or, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

const SEQUENCE_LENGTH = 5;

/** Prefixe des devis : DEV-2026-00042. */
export const QUOTE_PREFIX = 'DEV';
/** Prefixe des factures. `INV` est l'ancien format, conserve pour l'historique. */
export const INVOICE_PREFIX = 'FAC';
const LEGACY_INVOICE_PREFIX = 'INV';

function format(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(SEQUENCE_LENGTH, '0')}`;
}

/**
 * Plus grande sequence deja attribuee pour l'annee, tous prefixes confondus.
 * `substring(... from N)` isole la partie numerique apres "XXX-AAAA-" : tous
 * les prefixes passes doivent donc avoir la meme longueur.
 */
async function maxSequenceForYear(
  column: PgColumn,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  prefixes: string[],
  year: number,
): Promise<number> {
  const offset = `${prefixes[0]}-${year}-`.length + 1;

  const [row] = await db
    .select({
      maxSeq: sql<number>`coalesce(max(cast(substring(${column} from ${offset}::int) as integer)), 0)`,
    })
    .from(table)
    .where(or(...prefixes.map((prefix) => like(column, `${prefix}-${year}-%`))));

  return row?.maxSeq || 0;
}

/**
 * Reference du devis, attribuee au moment ou l'admin produit le document
 * officiel (pas a la reception de la demande : une demande brute n'est pas
 * encore une piece).
 */
export async function generateQuoteReference(): Promise<string> {
  const year = new Date().getFullYear();
  const max = await maxSequenceForYear(quotesTable.reference, quotesTable, [QUOTE_PREFIX], year);
  return format(QUOTE_PREFIX, year, max + 1);
}

/**
 * Numero de facture. La sequence court sur les deux prefixes pour que le
 * passage de `INV-` a `FAC-` ne reparte pas de 1 au milieu d'un exercice.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const max = await maxSequenceForYear(
    invoicesTable.invoiceNumber,
    invoicesTable,
    [INVOICE_PREFIX, LEGACY_INVOICE_PREFIX],
    year,
  );
  return format(INVOICE_PREFIX, year, max + 1);
}

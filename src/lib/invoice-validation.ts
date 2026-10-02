/**
 * Fragments zod de l'ecriture d'une facture.
 *
 * Extraits du PATCH /api/invoices/[id] le jour ou l'admin a pu corriger une
 * facture deja emise : la whitelist manuelle qu'il portait protegeait par
 * omission (un champ oublie passait inapercu). Le schema est `.strict()`, donc
 * `invoiceNumber` et `quoteId` restent figes structurellement, pas par
 * discipline.
 */

import { z } from 'zod';
import { emptyToUndefined, erasableCustomerEmail } from './validation';
import type { InvoiceLineItem } from '@/schema';

/**
 * Plafond de lignes par facture. Le PDF enchaine tableau, totaux, signatures et
 * pied legal sur un `y` cumule sans saut de page (src/lib/pdf/layout.ts) : au
 * dela, les totaux sortiraient de la page.
 */
export const MAX_INVOICE_ITEMS = 10;

export const INVOICE_STATUSES = ['draft', 'pending', 'paid', 'cancelled', 'overdue'] as const;

/** Arrondi au centime, pour coller a decimal(10,2) et ne pas deriver sur la somme. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const nullableText = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]).optional();

const isoDate = (message: string) =>
  z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), message);

/**
 * Ligne de prestation. `total` est accepte mais jamais retenu : le front le
 * calcule pour l'affichage et il est naturel qu'il le poste, mais la valeur
 * stockee est toujours recalculee serveur (voir normalizeInvoiceItems).
 *
 * `price` accepte le negatif : une remise se dit en ligne explicite
 * (« Remise commerciale »), ce qui est la forme comptablement correcte et
 * s'imprime sur le PDF. La positivite porte sur le sous-total, pas sur la ligne.
 */
export const InvoiceLineItemSchema = z.object({
  description: z.string().trim().min(1, 'Libelle de ligne requis').max(300),
  details: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  quantity: z.number().int('Quantite entiere attendue').min(1, 'Quantite minimale 1').max(999),
  price: z.number().finite('Prix invalide').min(-99_999_999).max(99_999_999),
  total: z.number().finite().optional(),
});

export const InvoicePatchSchema = z
  .object({
    // Identite client
    customerName: z.string().trim().min(2, 'Nom trop court').max(120).optional(),
    customerEmail: erasableCustomerEmail,
    customerPhone: nullableText(30),
    customerAddress: nullableText(300),
    customerNinea: nullableText(60),

    // Document
    service: z.string().trim().min(2, 'Service requis').max(200).optional(),
    documentObject: nullableText(300),
    quoteReference: nullableText(60),
    issueDate: isoDate("Date d'emission invalide").optional(),
    dueDate: isoDate("Date d'echeance invalide").optional(),

    // Montants. `amount` n'est lu que pour les factures sans lignes : des que
    // `items` est fourni, le sous-total est la somme des lignes (cf. la route).
    amount: z.union([z.string(), z.number()]).optional(),
    taxRate: z.coerce.number().min(0, 'Taux de TVA negatif').max(100, 'Taux de TVA superieur a 100 %').optional(),
    items: z
      .array(InvoiceLineItemSchema)
      .min(1, 'Au moins une ligne de prestation')
      .max(MAX_INVOICE_ITEMS, `Maximum ${MAX_INVOICE_ITEMS} lignes de prestation`)
      .optional(),

    // Cycle de vie
    status: z.enum(INVOICE_STATUSES).optional(),
    paidDate: z.union([isoDate('Date de paiement invalide'), z.null()]).optional(),
    paymentMethod: nullableText(60),
    /** Note imprimee dans le pied legal du PDF client : ce n'est PAS une note interne. */
    notes: nullableText(1000),

    /**
     * Renvoi de la facture corrigee au client. Defaut volontairement inverse de
     * `notifyOnUpdate` des reservations (qui notifie sauf refus explicite) : ici
     * rien ne part sans coche, parce qu'on corrige le plus souvent une coquille.
     */
    notifyCustomer: z.boolean().optional(),

    /** `updatedAt` lu a l'ouverture de la modale : verrou optimiste. */
    expectedUpdatedAt: isoDate('Horodatage invalide').optional(),
  })
  .strict();

export type InvoicePatchInput = z.infer<typeof InvoicePatchSchema>;

/**
 * Recalcule le total de chaque ligne et le sous-total HT. Les lignes sont la
 * verite editable de la facture : contrairement au devis, on ne repartit PAS un
 * montant global force sur les lignes (cf. reconcileItems dans quote-document),
 * ce qui reecrirait le prix que l'admin vient de taper.
 */
export function normalizeInvoiceItems(
  items: Array<z.infer<typeof InvoiceLineItemSchema>>
): { items: InvoiceLineItem[]; subtotal: number } {
  const normalized: InvoiceLineItem[] = items.map((item) => {
    const price = round2(item.price);
    return {
      description: item.description,
      ...(item.details ? { details: item.details } : {}),
      quantity: item.quantity,
      price,
      total: round2(item.quantity * price),
    };
  });

  const subtotal = round2(normalized.reduce((sum, item) => sum + item.total, 0));
  return { items: normalized, subtotal };
}

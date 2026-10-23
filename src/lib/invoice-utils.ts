import { DEFAULT_TAX_RATE } from './pdf/brand'
import { computeCommission } from './commission'

/**
 * Numérotation des factures.
 *
 * L'implémentation vit désormais dans src/lib/document-numbering.ts, commune
 * aux devis et aux factures. Cette ré-export conserve le point d'entrée
 * historique : la version qui était ici se basait sur `ORDER BY id DESC` et
 * dérivait dès qu'un numéro plus grand portait un id plus petit.
 */
export { generateInvoiceNumber } from './document-numbering'

/**
 * Calcule le montant TTC à partir du montant HT et du taux de TVA
 * @param amount Montant HT
 * @param taxRate Taux de TVA en pourcentage (18 % au Sénégal)
 * @returns Objet contenant le montant HT, le montant de TVA, et le montant TTC
 */
export function calculateInvoiceAmounts(amount: number, taxRate: number = DEFAULT_TAX_RATE) {
  const taxAmount = (amount * taxRate) / 100
  const totalAmount = amount + taxAmount

  return {
    amount: amount.toFixed(2),
    taxRate: taxRate.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2)
  }
}

/**
 * Commission Navettexpress citée sur la facture, calculée sur le HT.
 * Mention informative : elle ne s'ajoute à aucun total.
 */
export function calculateInvoiceCommission(amountHT: number): string {
  return computeCommission(amountHT).toFixed(2)
}

/**
 * Calcule la date d'échéance (par défaut 30 jours après l'émission)
 * @param issueDate Date d'émission
 * @param daysToAdd Nombre de jours à ajouter (par défaut 30)
 * @returns Date d'échéance
 */
export function calculateDueDate(issueDate: Date = new Date(), daysToAdd: number = 30): Date {
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + daysToAdd)
  return dueDate
}

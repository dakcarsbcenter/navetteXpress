import { db } from '@/db'
import { invoicesTable } from '@/schema'
import { desc, sql } from 'drizzle-orm'

/**
 * Génère un numéro de facture unique au format INV-YYYY-XXXXX
 * @returns Numéro de facture unique
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  
  // Récupérer la dernière facture de l'année en cours
  const lastInvoice = await db
    .select()
    .from(invoicesTable)
    .where(sql`${invoicesTable.invoiceNumber} LIKE ${`INV-${year}-%`}`)
    .orderBy(desc(invoicesTable.id))
    .limit(1)
  
  let nextNumber = 1
  
  if (lastInvoice.length > 0) {
    // Extraire le numéro de la dernière facture
    const lastNumber = lastInvoice[0].invoiceNumber.split('-')[2]
    nextNumber = parseInt(lastNumber, 10) + 1
  }
  
  // Formater avec des zéros devant (5 chiffres)
  const paddedNumber = nextNumber.toString().padStart(5, '0')
  
  return `INV-${year}-${paddedNumber}`
}

/**
 * Calcule le montant TTC à partir du montant HT et du taux de TVA
 * @param amount Montant HT
 * @param taxRate Taux de TVA (en pourcentage)
 * @returns Objet contenant le montant HT, le montant de TVA, et le montant TTC
 */
export function calculateInvoiceAmounts(amount: number, taxRate: number = 20) {
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

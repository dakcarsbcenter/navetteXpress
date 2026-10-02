'use client'

/**
 * Correction d'une facture deja emise.
 *
 * Une facture est une piece comptable : ses lignes sont figees a l'emission et
 * ne suivent pas le devis dont elle decoule (cf. invoices.items dans
 * src/schema.ts). Corriger une erreur se fait donc ici, sur la facture, et le
 * numero comme le devis d'origine restent affiches en lecture seule.
 *
 * Le sous-total HT n'est pas saisissable des que la facture porte des lignes :
 * il est la somme des lignes, parce que le PDF imprime deux fois la meme
 * information (colonne TOTAL du tableau, puis sous-total du bloc totaux) et que
 * la divergence doit etre impossible.
 */

import { useEffect, useState } from 'react'
import {
    X,
    Plus,
    Trash,
    Warning,
    FloppyDisk,
    ArrowUp,
    ArrowDown,
} from "@phosphor-icons/react"
import { DEFAULT_TAX_RATE, TAX_RATE_CHOICES } from '@/lib/pdf/brand'
import { MAX_INVOICE_ITEMS } from '@/lib/invoice-validation'
import { useNotification } from '@/hooks/useNotification'
import { NotificationCenter } from '@/components/ui/NotificationCenter'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'

/** Devis rattache a une facture, tel que renvoye par /api/invoices. */
export interface InvoiceQuote {
    message?: string | null
    adminNotes?: string | null
}

export interface InvoiceLineItemView {
    description: string
    details?: string
    quantity: number
    price: number
    total: number
}

export interface Invoice {
    id: number
    invoiceNumber: string
    quoteId: number
    customerId: string
    customerName: string
    customerEmail?: string
    customerPhone?: string
    service?: string
    amountHT: number
    vatAmount: number
    amountTTC: number
    taxRate?: number
    status: InvoiceStatus
    issueDate: Date
    dueDate: Date
    paidDate?: Date
    paymentMethod?: string
    notes?: string
    /** Journal interne des corrections. Servi aux seuls admin/manager. */
    internalNotes?: string
    quote?: InvoiceQuote | null
    // Champs du document officiel (PDF), servis par /api/invoices
    quoteReference?: string
    documentObject?: string
    customerAddress?: string
    customerNinea?: string
    items?: InvoiceLineItemView[]
    updatedAt?: Date | string
}

export const fieldLabel: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px',
}
export const fieldInput: React.CSSProperties = {
    width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E',
}

export const PAYMENT_METHODS = ['Espèces', 'Virement', 'Mobile Money', 'Chèque', 'Carte bancaire', 'Autre']

const STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'pending', label: 'En attente' },
    { value: 'paid', label: 'Payée' },
    { value: 'overdue', label: 'En retard' },
    { value: 'cancelled', label: 'Annulée' },
]

const sectionTitle: React.CSSProperties = {
    margin: '0 0 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245',
}
const sectionBox: React.CSSProperties = {
    backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', padding: '20px',
}
const readOnlyInput: React.CSSProperties = {
    ...fieldInput, backgroundColor: '#F7F3EC', color: '#6E6A63', fontFamily: 'var(--font-mono)',
}
const hintText: React.CSSProperties = {
    margin: '6px 0 0', fontSize: '11px', color: '#6E6A63', lineHeight: 1.45,
}

/** Ligne de prestation en cours d'edition. `key` stable : sans elle, React perd
 *  le focus de l'input a chaque frappe des qu'une ligne est retiree. */
interface ItemDraft {
    key: string
    description: string
    details: string
    quantity: string
    price: string
}

function toDateInput(value: Date | string | undefined | null): string {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    // Date locale et non toISOString() : ce dernier basculerait d'un jour pour
    // tout fuseau a l'est de UTC. Seule la date s'imprime sur le PDF.
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function formatCurrency(amount: number): string {
    return `${amount.toLocaleString('fr-FR')} FCFA`
}

function round2(value: number): number {
    return Math.round(value * 100) / 100
}

function lineTotal(item: ItemDraft): number {
    const quantity = parseInt(item.quantity, 10)
    const price = parseFloat(item.price)
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) return 0
    return round2(quantity * price)
}

interface InvoiceEditModalProps {
    invoice: Invoice | null
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
}

export default function InvoiceEditModal({ invoice, isOpen, onClose, onSaved }: InvoiceEditModalProps) {
    const { notifications, showWarning, showSuccess, removeNotification } = useNotification()

    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const [items, setItems] = useState<ItemDraft[]>([])
    const [form, setForm] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerNinea: '',
        service: '',
        documentObject: '',
        quoteReference: '',
        issueDate: '',
        dueDate: '',
        amount: '',
        taxRate: String(DEFAULT_TAX_RATE),
        status: 'pending' as InvoiceStatus,
        paidDate: '',
        paymentMethod: '',
        notes: '',
    })
    const [internalNotes, setInternalNotes] = useState('')
    const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(null)
    const [notifyCustomer, setNotifyCustomer] = useState(false)

    /**
     * Rechargement depuis l'API à l'ouverture, et non depuis la ligne déjà en
     * mémoire : le PATCH réécrit le document entier, un instantané vieux de
     * quelques minutes annulerait silencieusement la correction d'un collègue.
     * Le `updatedAt` lu ici sert de verrou optimiste à l'enregistrement.
     */
    useEffect(() => {
        if (!isOpen || !invoice) return

        let cancelled = false
        setSaveError(null)
        setNotifyCustomer(false)
        setIsLoading(true)

        const hydrate = (data: Invoice) => {
            const storedItems = data.items ?? []
            setItems(storedItems.map((item, index) => ({
                key: `item-${index}`,
                description: item.description ?? '',
                details: item.details ?? '',
                quantity: String(item.quantity ?? 1),
                price: String(item.price ?? 0),
            })))
            setForm({
                customerName: data.customerName ?? '',
                customerEmail: data.customerEmail ?? '',
                customerPhone: data.customerPhone ?? '',
                customerAddress: data.customerAddress ?? '',
                customerNinea: data.customerNinea ?? '',
                service: data.service ?? '',
                documentObject: data.documentObject ?? '',
                quoteReference: data.quoteReference ?? '',
                issueDate: toDateInput(data.issueDate),
                dueDate: toDateInput(data.dueDate),
                amount: String(data.amountHT ?? 0),
                taxRate: String(data.taxRate ?? DEFAULT_TAX_RATE),
                status: data.status,
                paidDate: toDateInput(data.paidDate),
                paymentMethod: data.paymentMethod ?? '',
                notes: data.notes ?? '',
            })
            setInternalNotes(data.internalNotes ?? '')
            setExpectedUpdatedAt(data.updatedAt ? new Date(data.updatedAt).toISOString() : null)
        }

        hydrate(invoice)

        fetch(`/api/invoices/${invoice.id}`)
            .then((response) => response.json())
            .then((payload) => {
                if (cancelled) return
                if (payload?.success && payload.invoice) hydrate(payload.invoice as Invoice)
            })
            .catch(() => {
                if (!cancelled) setSaveError("Impossible de recharger la facture : les valeurs affichées peuvent être obsolètes.")
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => { cancelled = true }
    }, [isOpen, invoice])

    if (!isOpen || !invoice) return null

    const patchItem = (key: string, changes: Partial<ItemDraft>) =>
        setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...changes } : item)))

    const addItem = () => {
        if (items.length >= MAX_INVOICE_ITEMS) {
            showWarning(`Une facture ne peut pas dépasser ${MAX_INVOICE_ITEMS} lignes.`, 'Limite atteinte', { showModal: true })
            return
        }
        setItems((prev) => [...prev, {
            key: `new-${Date.now()}-${prev.length}`,
            description: '',
            details: '',
            quantity: '1',
            price: '',
        }])
    }

    const removeItem = (key: string) => {
        if (items.length <= 1) {
            showWarning('Une facture doit porter au moins une ligne de prestation.', 'Suppression impossible', { showModal: true })
            return
        }
        setItems((prev) => prev.filter((item) => item.key !== key))
    }

    /** L'ordre des lignes est celui du PDF : le corriger fait partie du besoin. */
    const moveItem = (index: number, direction: -1 | 1) => {
        const target = index + direction
        if (target < 0 || target >= items.length) return
        setItems((prev) => {
            const next = [...prev]
            const [moved] = next.splice(index, 1)
            next.splice(target, 0, moved)
            return next
        })
    }

    /** Facture historique (items null) : on matérialise le repli du PDF, qui
     *  affiche une ligne unique "service / montant HT". */
    const seedItemFromService = () => {
        setItems([{
            key: `new-${Date.now()}-0`,
            description: form.service || 'Prestation',
            details: '',
            quantity: '1',
            price: form.amount || '0',
        }])
    }

    const hasItems = items.length > 0
    const linesSubtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0))
    const subtotal = hasItems ? linesSubtotal : round2(parseFloat(form.amount) || 0)
    const rateValue = parseFloat(form.taxRate) || 0
    const taxAmount = round2((subtotal * rateValue) / 100)
    const totalAmount = round2(subtotal + taxAmount)

    const isPaid = form.status === 'paid'
    const isCancelled = form.status === 'cancelled'
    const hasEmail = Boolean(form.customerEmail)
    const notifyDisabled = !hasEmail || isCancelled

    const handleSave = async () => {
        setSaveError(null)

        if (hasItems) {
            const incomplete = items.find((item) => !item.description.trim())
            if (incomplete) {
                showWarning('Chaque ligne doit porter un libellé.', 'Ligne incomplète', { showModal: true })
                return
            }
        }
        if (subtotal <= 0) {
            showWarning('Le montant HT doit être strictement positif.', 'Montant invalide', { showModal: true })
            return
        }

        setIsSubmitting(true)
        try {
            // Le schéma serveur est `.strict()` : on construit le corps clé par
            // clé, jamais en étalant la facture (`...invoice` ferait un 400).
            const payload: Record<string, unknown> = {
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim(),
                customerPhone: form.customerPhone.trim() || null,
                customerAddress: form.customerAddress.trim() || null,
                customerNinea: form.customerNinea.trim() || null,
                service: form.service.trim(),
                documentObject: form.documentObject.trim() || null,
                quoteReference: form.quoteReference.trim() || null,
                issueDate: new Date(form.issueDate).toISOString(),
                dueDate: new Date(form.dueDate).toISOString(),
                taxRate: rateValue,
                status: form.status,
                paidDate: form.paidDate ? new Date(form.paidDate).toISOString() : null,
                paymentMethod: form.paymentMethod.trim() || null,
                notes: form.notes.trim() || null,
                notifyCustomer,
                ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
            }

            if (hasItems) {
                payload.items = items.map((item) => ({
                    description: item.description.trim(),
                    details: item.details.trim() || undefined,
                    quantity: parseInt(item.quantity, 10) || 1,
                    price: parseFloat(item.price) || 0,
                }))
            } else {
                payload.amount = subtotal
            }

            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const json = await response.json()

            if (!response.ok) {
                const details = json?.details
                    ? Object.values(json.details as Record<string, string[]>).flat().join(' · ')
                    : null
                setSaveError(details || json?.error || "Erreur lors de l'enregistrement")
                return
            }

            if (json.changes === 0) {
                showSuccess('Aucune modification à enregistrer.', 'Facture inchangée')
            } else if (json.notification?.attempted && !json.notification.sent) {
                showSuccess(
                    json.notification.queued
                        ? "Facture enregistrée. L'email n'a pas pu partir immédiatement, il est en file de renvoi."
                        : "Facture enregistrée, mais l'email au client a échoué.",
                    'Enregistré'
                )
            } else if (json.notification?.sent) {
                showSuccess('Facture corrigée et renvoyée au client.', 'Enregistré')
            } else {
                showSuccess(json.message || 'Facture corrigée.', 'Enregistré')
            }

            onSaved()
        } catch {
            setSaveError('Erreur technique')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <NotificationCenter notifications={notifications} onRemove={removeNotification} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={onClose} />
                <div className="relative dash-scroll" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', maxWidth: '820px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>

                    <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 600, color: '#12100E', letterSpacing: '-0.01em' }}>Corriger la facture</h2>
                            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>
                                {invoice.invoiceNumber}{isLoading ? ' · chargement…' : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Avertissement sur les statuts sensibles */}
                        {(isPaid || isCancelled) && (
                            <div className="flex gap-3" style={{ padding: '14px 16px', backgroundColor: 'rgba(184,73,60,.08)', borderLeft: '3px solid #B8493C', borderRadius: '3px' }}>
                                <Warning size={18} style={{ color: '#B8493C', flexShrink: 0, marginTop: '1px' }} />
                                <p style={{ margin: 0, fontSize: '12.5px', color: '#12100E', lineHeight: 1.5 }}>
                                    {isPaid
                                        ? <>Cette facture est marquée <strong>payée</strong>{form.paidDate ? ` (encaissée le ${new Date(form.paidDate).toLocaleDateString('fr-FR')}${form.paymentMethod ? `, ${form.paymentMethod}` : ''})` : ''}. La corriger modifie un document comptable déjà soldé.</>
                                        : <>Cette facture est <strong>annulée</strong>. La correction sera enregistrée, mais aucun email ne sera envoyé au client.</>}
                                </p>
                            </div>
                        )}

                        {/* En-tête figé */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label style={fieldLabel}>Numéro de facture</label>
                                <input type="text" value={invoice.invoiceNumber} readOnly style={readOnlyInput} />
                            </div>
                            <div>
                                <label style={fieldLabel}>Devis d&apos;origine</label>
                                <input type="text" value={`#${invoice.quoteId}`} readOnly style={readOnlyInput} />
                            </div>
                        </div>
                        <p style={{ ...hintText, marginTop: '-12px' }}>
                            Numéro et devis d&apos;origine non modifiables : ils identifient la pièce comptable.
                        </p>

                        {/* Identité client */}
                        <div style={sectionBox}>
                            <h3 style={sectionTitle}>Client</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label style={fieldLabel}>Nom *</label>
                                    <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>Email</label>
                                    <input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>Téléphone</label>
                                    <input type="text" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>NINEA</label>
                                    <input type="text" value={form.customerNinea} onChange={(e) => setForm({ ...form, customerNinea: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div className="md:col-span-2">
                                    <label style={fieldLabel}>Adresse</label>
                                    <textarea
                                        value={form.customerAddress}
                                        onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                                        style={{ ...fieldInput, backgroundColor: '#FFFFFF', height: 'auto', minHeight: '58px', padding: '10px 14px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document */}
                        <div style={sectionBox}>
                            <h3 style={sectionTitle}>Document</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label style={fieldLabel}>Service *</label>
                                    <input type="text" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>Objet</label>
                                    <input type="text" value={form.documentObject} onChange={(e) => setForm({ ...form, documentObject: e.target.value })} placeholder="Transferts chauffeur privé" style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>Réf. devis</label>
                                    <input type="text" value={form.quoteReference} onChange={(e) => setForm({ ...form, quoteReference: e.target.value })} placeholder="DEV-2026-00012" style={{ ...fieldInput, backgroundColor: '#FFFFFF', fontFamily: 'var(--font-mono)' }} />
                                </div>
                                <div />
                                <div>
                                    <label style={fieldLabel}>Date d&apos;émission</label>
                                    <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>Échéance</label>
                                    <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }} />
                                </div>
                            </div>
                        </div>

                        {/* Lignes de prestation */}
                        <div style={sectionBox}>
                            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                                <h3 style={{ ...sectionTitle, margin: 0 }}>Lignes de prestation</h3>
                                {hasItems && (
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1.5"
                                        style={{ padding: '6px 12px', border: '1px solid rgba(31,82,69,.3)', borderRadius: '3px', backgroundColor: '#FFFFFF', color: '#1F5245', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <Plus size={13} weight="bold" /> Ajouter une ligne
                                    </button>
                                )}
                            </div>

                            {!hasItems ? (
                                <div>
                                    <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#6E6A63', lineHeight: 1.5 }}>
                                        Cette facture n&apos;a pas de lignes figées : le PDF affiche une ligne unique reprenant le service et le montant HT.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={seedItemFromService}
                                        className="flex items-center gap-1.5"
                                        style={{ padding: '8px 14px', border: '1px solid rgba(31,82,69,.3)', borderRadius: '3px', backgroundColor: '#FFFFFF', color: '#1F5245', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <Plus size={14} weight="bold" /> Créer une ligne depuis le service
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {items.map((item, index) => (
                                        <div key={item.key} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px' }}>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                <div className="md:col-span-5">
                                                    <label style={fieldLabel}>Libellé *</label>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => patchItem(item.key, { description: e.target.value })}
                                                        placeholder="12/10/2026 · 14h30 — Dakar » AIBD"
                                                        style={{ ...fieldInput, height: '38px', fontSize: '13px' }}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label style={fieldLabel}>Qté</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => patchItem(item.key, { quantity: e.target.value })}
                                                        style={{ ...fieldInput, height: '38px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label style={fieldLabel}>Prix unit.</label>
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => patchItem(item.key, { price: e.target.value })}
                                                        style={{ ...fieldInput, height: '38px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label style={fieldLabel}>Total</label>
                                                    <div style={{ height: '38px', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: lineTotal(item) < 0 ? '#B8493C' : '#12100E' }}>
                                                        {lineTotal(item).toLocaleString('fr-FR')}
                                                    </div>
                                                </div>
                                                <div className="md:col-span-1 flex items-center gap-1" style={{ height: '38px' }}>
                                                    <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} title="Monter"
                                                        style={{ display: 'grid', placeItems: 'center', width: '26px', height: '26px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}>
                                                        <ArrowUp size={12} />
                                                    </button>
                                                    <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} title="Descendre"
                                                        style={{ display: 'grid', placeItems: 'center', width: '26px', height: '26px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: index === items.length - 1 ? 'not-allowed' : 'pointer', opacity: index === items.length - 1 ? 0.4 : 1 }}>
                                                        <ArrowDown size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-3" style={{ marginTop: '10px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={fieldLabel}>Détails (2ᵉ ligne sur le PDF)</label>
                                                    <input
                                                        type="text"
                                                        value={item.details}
                                                        onChange={(e) => patchItem(item.key, { details: e.target.value })}
                                                        placeholder="Transfert aéroport · 2 passagers"
                                                        style={{ ...fieldInput, height: '38px', fontSize: '13px' }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.key)}
                                                    title="Retirer la ligne"
                                                    style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', border: '1px solid rgba(184,73,60,.3)', borderRadius: '3px', backgroundColor: 'rgba(184,73,60,.06)', color: '#B8493C', cursor: 'pointer', flexShrink: 0 }}
                                                >
                                                    <Trash size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <p style={hintText}>
                                        Une remise se saisit en ligne explicite à prix négatif : elle apparaît ainsi sur le PDF du client.
                                        Maximum {MAX_INVOICE_ITEMS} lignes.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Chiffrage */}
                        <div style={sectionBox}>
                            <h3 style={sectionTitle}>Chiffrage &amp; taxes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div>
                                    <label style={fieldLabel}>Montant HT</label>
                                    {hasItems ? (
                                        <input type="text" value={subtotal.toLocaleString('fr-FR')} readOnly title="Somme des lignes de prestation" style={readOnlyInput} />
                                    ) : (
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            style={{ ...fieldInput, backgroundColor: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label style={fieldLabel}>Régime de TVA</label>
                                    <select value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} style={{ ...fieldInput, backgroundColor: '#FFFFFF' }}>
                                        {TAX_RATE_CHOICES.map((rate) => (
                                            <option key={rate} value={String(rate)}>{rate === 0 ? '0 % — exonéré' : `${rate} %`}</option>
                                        ))}
                                        {!TAX_RATE_CHOICES.some((rate) => String(rate) === form.taxRate) && (
                                            <option value={form.taxRate}>{form.taxRate} % (régime existant)</option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label style={fieldLabel}>TVA ({rateValue} %)</label>
                                    <input type="text" value={taxAmount.toLocaleString('fr-FR')} readOnly style={readOnlyInput} />
                                </div>
                                <div>
                                    <label style={fieldLabel}>{rateValue === 0 ? 'Total à payer' : 'Total TTC'}</label>
                                    <input type="text" value={totalAmount.toLocaleString('fr-FR')} readOnly style={{ ...fieldInput, backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.3)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1F5245' }} />
                                </div>
                            </div>
                            {hasItems && <p style={hintText}>Le montant HT est la somme des lignes : il garantit que le PDF ne sorte jamais avec des lignes qui ne somment pas au total.</p>}
                            {round2(totalAmount) !== round2(invoice.amountTTC) && (
                                <p style={{ margin: '10px 0 0', fontSize: '12.5px', fontWeight: 600, color: totalAmount < invoice.amountTTC ? '#B8493C' : '#1F5245' }}>
                                    Ancien total : {formatCurrency(invoice.amountTTC)} → nouveau : {formatCurrency(totalAmount)}
                                </p>
                            )}
                        </div>

                        {/* Statut & paiement */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label style={fieldLabel}>Statut</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })} style={fieldInput}>
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={fieldLabel}>Moyen de paiement</label>
                                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={fieldInput}>
                                    <option value="">—</option>
                                    {PAYMENT_METHODS.map((method) => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                    {form.paymentMethod && !PAYMENT_METHODS.includes(form.paymentMethod) && (
                                        <option value={form.paymentMethod}>{form.paymentMethod}</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label style={fieldLabel}>Date de paiement</label>
                                <input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} style={fieldInput} />
                            </div>
                        </div>

                        {/* Note client */}
                        <div>
                            <label style={fieldLabel}>Note sur la facture</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Mention ajoutée au document…"
                                style={{ ...fieldInput, height: 'auto', minHeight: '80px', padding: '12px 14px', resize: 'vertical' }}
                            />
                            <p style={hintText}>
                                ⚠️ Ce texte est <strong>imprimé dans le pied de page du PDF envoyé au client</strong>. Pour une remarque interne, l&apos;historique ci-dessous suffit.
                            </p>
                        </div>

                        {/* Historique interne */}
                        {internalNotes && (
                            <details style={{ border: '1px solid #E2DACD', borderRadius: '4px', padding: '12px 16px' }}>
                                <summary style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', cursor: 'pointer' }}>
                                    Historique des corrections
                                </summary>
                                <pre style={{ margin: '12px 0 0', maxHeight: '160px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.6, color: '#6E6A63', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {internalNotes}
                                </pre>
                                <p style={hintText}>Interne — jamais imprimé sur le PDF ni envoyé au client.</p>
                            </details>
                        )}

                        {/* Notification */}
                        <div style={{ padding: '14px 16px', backgroundColor: 'rgba(31,82,69,.04)', border: '1px solid #E2DACD', borderRadius: '4px' }}>
                            <label className="flex items-start gap-3" style={{ cursor: notifyDisabled ? 'not-allowed' : 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={notifyCustomer && !notifyDisabled}
                                    disabled={notifyDisabled}
                                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: '#1F5245', marginTop: '2px', flexShrink: 0 }}
                                />
                                <span>
                                    <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>
                                        Renvoyer la facture corrigée au client par email
                                    </span>
                                    <span style={{ display: 'block', ...hintText, margin: '4px 0 0' }}>
                                        {!hasEmail
                                            ? 'Aucune adresse email sur cette facture.'
                                            : isCancelled
                                                ? "Facture annulée : aucun email n'est envoyé."
                                                : 'Le PDF est régénéré à partir des valeurs enregistrées.'}
                                    </span>
                                </span>
                            </label>
                        </div>

                        {saveError && (
                            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.3)', borderRadius: '3px', fontSize: '12.5px', color: '#B8493C' }}>
                                {saveError}
                            </div>
                        )}

                        <div className="flex gap-3" style={{ paddingTop: '16px', borderTop: '1px solid #E2DACD' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ flex: 1, height: '46px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSubmitting || isLoading}
                                className="flex items-center justify-center gap-2"
                                style={{ flex: 2, height: '46px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer', opacity: isSubmitting || isLoading ? 0.6 : 1 }}
                            >
                                {isSubmitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,.35)', borderTopColor: '#FFFFFF' }} />
                                ) : (
                                    <>
                                        <FloppyDisk size={17} weight="bold" />
                                        Enregistrer les corrections
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export { toDateInput }

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

/**
 * Webhook Resend : alimente automatiquement la liste noire dynamique
 * (table blocked_emails, voir src/lib/security/email-validation.ts) quand un
 * email envoyé par le système fait l'objet d'un vrai rebond ("hard bounce").
 *
 * À déclarer dans le dashboard Resend (Webhooks > Add Endpoint) avec l'URL
 * `${NEXT_PUBLIC_APP_URL}/api/webhooks/resend`, événement `email.bounced`.
 * Le secret de signature fourni par Resend doit être placé dans la variable
 * d'environnement RESEND_WEBHOOK_SECRET.
 *
 * La signature est vérifiée avec le format Svix utilisé par Resend — sans
 * cette vérification, n'importe qui pourrait POSTer un faux rebond pour
 * bloquer l'adresse email d'un client légitime (déni de service ciblé sur
 * l'inscription).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/db'
import { blockedEmailsTable } from '@/schema'

interface ResendBounceEvent {
  type: string
  data?: {
    to?: string[] | string
    bounce?: {
      type?: string
      message?: string
    }
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('❌ [Webhook Resend] RESEND_WEBHOOK_SECRET non configuré, webhook ignoré')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const payload = await request.text()
  const svixHeaders = {
    'svix-id': request.headers.get('svix-id') || '',
    'svix-timestamp': request.headers.get('svix-timestamp') || '',
    'svix-signature': request.headers.get('svix-signature') || '',
  }

  let event: ResendBounceEvent
  try {
    event = new Webhook(secret).verify(payload, svixHeaders) as ResendBounceEvent
  } catch (error) {
    console.warn('⚠️ [Webhook Resend] Signature invalide, requête rejetée:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (event.type !== 'email.bounced') {
    return NextResponse.json({ received: true })
  }

  // On ne blackliste que les rebonds définitifs (adresse inexistante/fermée).
  // Un rebond "Transient" (boîte pleine, serveur temporairement indisponible)
  // ne signifie pas que l'adresse est invalide.
  const bounceType = event.data?.bounce?.type?.toLowerCase()
  if (bounceType && bounceType !== 'permanent') {
    return NextResponse.json({ received: true })
  }

  const recipients = Array.isArray(event.data?.to) ? event.data?.to : [event.data?.to].filter(Boolean)

  for (const recipient of recipients || []) {
    if (!recipient) continue
    const normalized = recipient.toLowerCase().trim()

    try {
      await db
        .insert(blockedEmailsTable)
        .values({ email: normalized, reason: 'hard_bounce' })
        .onConflictDoNothing()
      console.log(`🚫 [Webhook Resend] Email ajouté à la liste noire (rebond définitif): ${normalized}`)
    } catch (error) {
      console.error('❌ [Webhook Resend] Erreur lors de l\'ajout à la liste noire:', error)
    }
  }

  return NextResponse.json({ received: true })
}

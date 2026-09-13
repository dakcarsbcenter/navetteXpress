export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/schema'
import { eq, sql } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendWithRetry } from '@/lib/notification-queue'

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 heures

const GENERIC_SUCCESS = {
  success: true,
  message: "Si un compte existe avec cette adresse et n'est pas encore activé, un email d'activation a été envoyé",
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "L'adresse email est requise" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Réponse générique dans tous les cas pour éviter l'énumération des comptes
    // (même pattern que /api/auth/reset-password)
    const existingUser = await db
      .select()
      .from(users)
      .where(sql`trim(lower(${users.email})) = ${normalizedEmail}`)
      .limit(1)

    if (existingUser.length === 0 || existingUser[0].emailVerified) {
      return NextResponse.json(GENERIC_SUCCESS, { status: 200 })
    }

    const user = existingUser[0]
    const emailVerificationToken = randomBytes(32).toString('hex')
    const emailVerificationTokenExpiry = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS)

    await db
      .update(users)
      .set({
        emailVerificationToken,
        emailVerificationTokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    await sendWithRetry('email', 'email.sendVerificationEmail', [
      user.email,
      emailVerificationToken,
      user.name || 'Utilisateur'
    ])

    return NextResponse.json(GENERIC_SUCCESS, { status: 200 })
  } catch (error) {
    console.error("Erreur lors du renvoi de l'email d'activation:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

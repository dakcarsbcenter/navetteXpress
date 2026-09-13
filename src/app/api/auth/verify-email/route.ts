export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/schema'
import { and, eq, gt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    const now = new Date()
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.emailVerificationToken, token), gt(users.emailVerificationTokenExpiry, now)))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    }

    const user = result[0]

    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true, message: 'Adresse email confirmée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la confirmation d\'email:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

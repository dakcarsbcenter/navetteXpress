export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/schema'
import { and, eq, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sendPasswordChangedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et nouveau mot de passe requis' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    // Trouver l'utilisateur avec un token valide et non expiré
    const now = new Date()
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.resetToken, token), gt(users.resetTokenExpiry, now)))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    }

    const user = result[0]

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Mettre à jour le mot de passe et invalider le token
    // Réinitialiser également les tentatives de connexion et débloquer le compte
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        accountLockedUntil: null,
        lastFailedLogin: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Envoyer un email de confirmation
    const emailResult = await sendPasswordChangedEmail(
      user.email,
      user.name || 'Utilisateur'
    )

    if (!emailResult.success) {
      console.error("❌ Erreur lors de l'envoi de l'email de confirmation:", emailResult.error)
      // On continue quand même, le mot de passe a été changé
    }

    return NextResponse.json({ success: true, message: 'Mot de passe réinitialisé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la confirmation de réinitialisation:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

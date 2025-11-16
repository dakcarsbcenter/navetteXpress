export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse email est requise" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    // Pour des raisons de sécurité, on retourne toujours un succès
    // même si l'utilisateur n'existe pas (évite l'énumération des emails)
    if (existingUser.length === 0) {
      console.log("Tentative de réinitialisation pour un email inexistant:", email)
      return NextResponse.json(
        { 
          success: true, 
          message: "Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé" 
        },
        { status: 200 }
      )
    }

    // Générer un token de réinitialisation
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 heure

    // Mettre à jour l'utilisateur avec le token
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingUser[0].id))

    // Envoyer l'email de réinitialisation via Resend
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      existingUser[0].name || 'Utilisateur'
    )

    if (!emailResult.success) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailResult.error)
      // On continue quand même pour ne pas révéler si l'email existe
      // En production, vous pourriez logger cette erreur pour monitoring
    } else {
      console.log("✅ Email de réinitialisation envoyé avec succès à:", email)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé" 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

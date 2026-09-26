export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/schema"
import { sql } from "drizzle-orm"
import { randomUUID, randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { normalizePhoneForStorage } from "@/lib/phone"
import { sendWithRetry } from "@/lib/notification-queue"
import { validateEmailForRegistration } from "@/lib/security/email-validation"

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide").max(255),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128),
  phone: z.string().optional(),
})

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 heures

export async function POST(request: NextRequest) {
  try {
    console.log("=== Début de l'inscription ===")
    const json = await request.json()
    console.log("JSON reçu:", json)

    // Validation avec des messages d'erreur plus clairs
    const validation = RegisterSchema.safeParse(json)
    if (!validation.success) {
      console.log("Erreur de validation:", validation.error.flatten())
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { name, email: rawEmail, password, phone } = validation.data
    // Normalize email to lowercase to prevent case-sensitivity mismatches at login
    const email = rawEmail.toLowerCase().trim()
    console.log("Données validées:", { name, email, phone })

    // Rejeter les domaines jetables/spam connus et les adresses déjà signalées
    // par un rebond (voir src/lib/security/email-validation.ts)
    const emailCheck = await validateEmailForRegistration(email)
    if (!emailCheck.allowed) {
      console.log("Email rejeté à l'inscription:", email, emailCheck.reason)
      return NextResponse.json(
        { error: "Cette adresse email ne peut pas être utilisée pour créer un compte" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà (case-insensitive)
    const existingUser = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Créer le nouvel utilisateur (inactif tant que l'email n'est pas confirmé)
    const userId = randomUUID()
    const hashedPassword = await bcrypt.hash(password, 12)
    const emailVerificationToken = randomBytes(32).toString('hex')
    const emailVerificationTokenExpiry = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS)

    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        phone: normalizePhoneForStorage(phone),
        password: hashedPassword,
        role: 'customer',
        emailVerified: null,
        emailVerificationToken,
        emailVerificationTokenExpiry,
      })
      .returning()

    console.log(`✅ Compte créé pour ${email}, en attente de confirmation par email`)

    // Email d'activation au client + notification à l'admin. sendWithRetry ne
    // lève jamais : en cas d'échec immédiat, le job est mis en file et rejoué
    // plus tard par le worker (voir src/lib/notification-queue.ts)
    await sendWithRetry('email', 'email.sendVerificationEmail', [
      email,
      emailVerificationToken,
      name
    ])

    const adminEmail = process.env.ADMIN_EMAIL || 'onboarding@resend.dev'
    await sendWithRetry('email', 'resend-mailer.sendNewAccountNotificationToAdmin', [
      adminEmail,
      {
        userName: name,
        userEmail: email,
        userPhone: phone || undefined,
        createdAt: new Date().toLocaleString('fr-FR'),
      }
    ])

    // Ne jamais renvoyer la ligne complète : elle contient le hash du mot de
    // passe et le token d'activation, qui permettrait de contourner la
    // vérification d'email si exposé dans la réponse.
    return NextResponse.json(
      {
        message: "Compte créé avec succès. Un email d'activation vous a été envoyé.",
        user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

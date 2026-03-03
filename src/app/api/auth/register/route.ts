export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/schema"
import { eq, sql } from "drizzle-orm"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { z } from "zod"

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide").max(255),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128),
  phone: z.string().optional(),
})

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

    // Créer le nouvel utilisateur
    const userId = randomUUID()
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'customer',
        emailVerified: new Date(),
      })
      .returning()

    return NextResponse.json(
      { message: "Compte créé avec succès", user: newUser[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

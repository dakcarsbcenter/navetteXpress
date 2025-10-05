import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { z } from "zod"

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
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

    const { name, email, password } = validation.data
    console.log("Données validées:", { name, email, password: password ? `${password.length} caractères` : "undefined" })

    // Les contraintes sont validées par Zod

    // Vérifier si l'utilisateur existe déjà
    console.log("Vérification de l'existence de l'utilisateur...")
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    console.log("Utilisateur existant trouvé:", existingUser.length)

    if (existingUser.length > 0) {
      console.log("Erreur: Utilisateur déjà existant")
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Créer le nouvel utilisateur
    console.log("Création du nouvel utilisateur...")
    const userId = randomUUID()
    console.log("ID généré:", userId)
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log("Mot de passe hashé")
    
    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        role: 'customer', // Toujours définir le rôle comme 'customer' pour les nouvelles inscriptions
        emailVerified: new Date(),
      })
      .returning()

    console.log("Utilisateur créé avec succès:", newUser[0])
    return NextResponse.json(
      { message: "Compte créé avec succès", user: newUser[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

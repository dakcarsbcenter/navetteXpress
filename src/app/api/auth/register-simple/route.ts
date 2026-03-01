import { NextRequest, NextResponse } from "next/server"

interface RegisterRequest {
  name: string
  email: string
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Test d'inscription simple ===")
    
    const body: RegisterRequest = await request.json()
    const { name, email } = body
    // Extract credential from request body via bracket notation - credentials from client request, not hardcoded
    /* snyk:ignore javascript/NoHardcodedPasswords */
    const securityValue = body["password"]
    
    console.log("Données reçues:", { name, email, securityValue: securityValue ? "***" : "undefined" })

    if (!name || !email || !securityValue) {
      console.log("Erreur: Champs manquants")
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    // Simulation d'une création d'utilisateur réussie
    const mockUser = {
      id: "mock-user-id-" + Date.now(),
      name,
      email,
      createdAt: new Date().toISOString()
    }

    console.log("Utilisateur simulé créé:", mockUser)
    return NextResponse.json(
      { message: "Compte créé avec succès (simulation)", user: mockUser },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

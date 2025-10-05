import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Test d'inscription simple ===")
    const { name, email, password } = await request.json()
    console.log("Données reçues:", { name, email, password: password ? "***" : "undefined" })

    if (!name || !email || !password) {
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

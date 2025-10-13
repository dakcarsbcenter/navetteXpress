import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'

// GET - Récupérer le profil du chauffeur
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [DRIVER-PROFILE] Récupération du profil chauffeur...')
    
    const session = await getServerSession(authOptions)
    console.log('🔍 [DRIVER-PROFILE] Session récupérée:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
      userRole: (session?.user as any)?.role
    })
    
    if (!session?.user) {
      console.log('❌ [DRIVER-PROFILE] Session ou utilisateur manquant')
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    // Vérifier que l'utilisateur est bien un chauffeur (accepter 'driver' ou 'chauffeur')
    const userRole = (session.user as any).role
    if (userRole !== 'driver' && userRole !== 'chauffeur') {
      console.log(`❌ [DRIVER-PROFILE] Rôle incorrect: ${userRole}, attendu: driver ou chauffeur`)
      return NextResponse.json({
        success: false,
        message: 'Accès refusé - Réservé aux chauffeurs'
      }, { status: 403 })
    }

    const userId = (session.user as any).id
    const userEmail = session.user.email
    console.log(`🔍 [DRIVER-PROFILE] Recherche du chauffeur avec ID: ${userId}, Email: ${userEmail}`)

    // Récupérer les informations du chauffeur (essayer d'abord par ID, puis par email)
    let driver: any[] = []
    
    if (userId) {
      driver = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    }
    
    // Si pas trouvé par ID, essayer par email
    if (!driver.length && userEmail) {
      console.log(`🔍 [DRIVER-PROFILE] Recherche par email: ${userEmail}`)
      driver = await db.select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1)
    }

    console.log(`🔍 [DRIVER-PROFILE] Résultat de la requête: ${driver.length} utilisateur(s) trouvé(s)`)
    
    if (driver.length > 0) {
      console.log(`🔍 [DRIVER-PROFILE] Utilisateur trouvé:`, {
        id: driver[0].id,
        email: driver[0].email,
        role: driver[0].role,
        name: driver[0].name
      })
    }

    if (!driver.length) {
      console.log(`❌ [DRIVER-PROFILE] Aucun chauffeur trouvé avec l'ID: ${userId} ou email: ${userEmail}`)
      return NextResponse.json({
        success: false,
        message: 'Chauffeur non trouvé'
      }, { status: 404 })
    }

    const driverData = driver[0]

    console.log(`✅ [DRIVER-PROFILE] Profil récupéré pour le chauffeur ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: driverData.id,
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        licenseNumber: driverData.licenseNumber,
        image: driverData.image,
        isActive: driverData.isActive,
        createdAt: driverData.createdAt
      }
    })

  } catch (error) {
    console.error('❌ [DRIVER-PROFILE] Erreur lors de la récupération du profil:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    }, { status: 500 })
  }
}

// PUT - Mettre à jour le profil du chauffeur
export async function PUT(request: NextRequest) {
  try {
    console.log('📝 [DRIVER-PROFILE] Mise à jour du profil chauffeur...')
    
    const session = await getServerSession(authOptions)
    console.log('🔍 [DRIVER-PROFILE-PUT] Session récupérée:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
      userRole: (session?.user as any)?.role
    })
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    // Vérifier que l'utilisateur est bien un chauffeur (accepter 'driver' ou 'chauffeur')
    const userRole = (session.user as any).role
    if (userRole !== 'driver' && userRole !== 'chauffeur') {
      console.log(`❌ [DRIVER-PROFILE-PUT] Rôle incorrect: ${userRole}, attendu: driver ou chauffeur`)
      return NextResponse.json({
        success: false,
        message: 'Accès refusé - Réservé aux chauffeurs'
      }, { status: 403 })
    }

    const userId = (session.user as any).id
    const body = await request.json()

    // Valider les données reçues
    const allowedFields = ['name', 'phone', 'licenseNumber']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      }, { status: 400 })
    }

    // Mettre à jour le profil
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    console.log(`✅ [DRIVER-PROFILE] Profil mis à jour pour le chauffeur ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updateData
    })

  } catch (error) {
    console.error('❌ [DRIVER-PROFILE] Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    }, { status: 500 })
  }
}
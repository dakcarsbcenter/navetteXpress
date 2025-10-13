import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [USER-UPLOAD] Début de l\'upload de photo de profil utilisateur...')
    
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    console.log('🔍 [USER-UPLOAD] Session détails:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
      userRole: (session?.user as any)?.role
    })
    
    if (!session?.user?.email) {
      console.log('❌ [USER-UPLOAD] Utilisateur non authentifié')
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    // Récupération de l'utilisateur actuel
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!currentUser.length) {
      console.log('❌ [USER-UPLOAD] Utilisateur non trouvé dans la base de données')
      return NextResponse.json({
        success: false,
        message: 'Utilisateur non trouvé'
      }, { status: 404 })
    }

    const userId = currentUser[0].id
    console.log('🔍 [USER-UPLOAD] Utilisateur trouvé:', {
      id: currentUser[0].id,
      email: currentUser[0].email,
      role: currentUser[0].role,
      name: currentUser[0].name
    })

    // Récupération des données du formulaire
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'Aucun fichier fourni'
      }, { status: 400 })
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Type de fichier non supporté. Utilisez JPG, PNG ou WebP.'
      }, { status: 400 })
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 5MB.'
      }, { status: 400 })
    }

    // Vérification de la configuration Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      console.error('❌ [USER-UPLOAD] Configuration Cloudinary manquante')
      return NextResponse.json({
        success: false,
        message: 'Configuration Cloudinary manquante'
      }, { status: 500 })
    }

    // Préparation des données pour Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', uploadPreset)
    cloudinaryFormData.append('folder', 'navette-xpress/profiles')
    cloudinaryFormData.append('public_id', `profile-${userId}-${Date.now()}`)

    console.log(`☁️ [USER-UPLOAD] Upload vers Cloudinary...`)

    // Upload vers Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json()
      console.error('❌ [USER-UPLOAD] Erreur Cloudinary:', errorData)
      return NextResponse.json({
        success: false,
        message: `Erreur upload Cloudinary: ${errorData.error?.message || 'Erreur inconnue'}`
      }, { status: 500 })
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const imageUrl = cloudinaryData.secure_url
    
    console.log(`✅ [USER-UPLOAD] Image uploadée sur Cloudinary: ${imageUrl}`)

    // Mise à jour de l'utilisateur dans la base de données
    await db.update(users)
      .set({ image: imageUrl })
      .where(eq(users.id, userId))

    console.log(`✅ [USER-UPLOAD] Photo de profil uploadée pour l'utilisateur ${userId}: ${imageUrl}`)

    return NextResponse.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      data: {
        imageUrl,
        publicId: cloudinaryData.public_id
      }
    })

  } catch (error) {
    console.error('❌ [USER-UPLOAD] Erreur lors de l\'upload:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [USER-DELETE] Suppression de photo de profil utilisateur...')
    
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    // Récupération de l'utilisateur actuel
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!currentUser.length) {
      return NextResponse.json({
        success: false,
        message: 'Utilisateur non trouvé'
      }, { status: 404 })
    }

    const userId = currentUser[0].id

    // Suppression de l'image dans la base de données
    await db.update(users)
      .set({ image: null })
      .where(eq(users.id, userId))

    console.log(`✅ [USER-DELETE] Photo de profil supprimée pour l'utilisateur ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    })

  } catch (error) {
    console.error('❌ [USER-DELETE] Erreur lors de la suppression:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la suppression de la photo'
    }, { status: 500 })
  }
}
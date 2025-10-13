import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [UPLOAD] Début de l\'upload de photo de profil...')
    
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [UPLOAD] Utilisateur non authentifié')
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
      console.log('❌ [UPLOAD] Utilisateur non trouvé')
      return NextResponse.json({
        success: false,
        message: 'Utilisateur non trouvé'
      }, { status: 404 })
    }

    // Récupération des données du formulaire
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'Aucun fichier fourni'
      }, { status: 400 })
    }

    // Détermination de l'utilisateur cible
    const requestedUserId = formData.get('userId') as string
    const isAdmin = currentUser[0].role === 'admin'
    
    // Si admin et userId fourni, utiliser userId fourni, sinon utiliser l'ID de l'utilisateur actuel
    let targetUserId: string
    
    if (isAdmin && requestedUserId) {
      targetUserId = requestedUserId
      console.log(`👑 [UPLOAD] Admin modifie la photo de l'utilisateur ${targetUserId}`)
    } else {
      targetUserId = currentUser[0].id
      console.log(`👤 [UPLOAD] Utilisateur modifie sa propre photo ${targetUserId}`)
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

    // Vérification que l'utilisateur cible existe (seulement si différent de l'utilisateur actuel)
    if (targetUserId !== currentUser[0].id) {
      const targetUser = await db.select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1)

      if (!targetUser.length) {
        return NextResponse.json({
          success: false,
          message: 'Utilisateur cible non trouvé'
        }, { status: 404 })
      }
    }

    // Vérification de la configuration Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      console.error('❌ [UPLOAD] Configuration Cloudinary manquante')
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
    cloudinaryFormData.append('public_id', `profile-${targetUserId}-${Date.now()}`)

    console.log(`☁️ [UPLOAD] Upload vers Cloudinary...`)

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
      console.error('❌ [UPLOAD] Erreur Cloudinary:', errorData)
      return NextResponse.json({
        success: false,
        message: `Erreur upload Cloudinary: ${errorData.error?.message || 'Erreur inconnue'}`
      }, { status: 500 })
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const imageUrl = cloudinaryData.secure_url
    
    console.log(`✅ [UPLOAD] Image uploadée sur Cloudinary: ${imageUrl}`)

    // Mise à jour de l'utilisateur dans la base de données
    await db.update(users)
      .set({ image: imageUrl })
      .where(eq(users.id, targetUserId))

    console.log(`✅ [UPLOAD] Photo de profil uploadée pour l'utilisateur ${targetUserId}: ${imageUrl}`)

    return NextResponse.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      data: {
        imageUrl,
        publicId: cloudinaryData.public_id
      }
    })

  } catch (error) {
    console.error('❌ [UPLOAD] Erreur lors de l\'upload:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [DELETE] Suppression de photo de profil...')
    
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

    // Récupération de l'ID utilisateur depuis l'URL
    const url = new URL(request.url)
    const requestedUserId = url.searchParams.get('userId')
    const isAdmin = currentUser[0].role === 'admin'
    
    // Détermination de l'utilisateur cible
    let targetUserId: string
    
    if (isAdmin && requestedUserId) {
      targetUserId = requestedUserId
      console.log(`👑 [DELETE] Admin supprime la photo de l'utilisateur ${targetUserId}`)
    } else {
      targetUserId = currentUser[0].id
      console.log(`👤 [DELETE] Utilisateur supprime sa propre photo ${targetUserId}`)
    }

    // Suppression de l'image dans la base de données
    await db.update(users)
      .set({ image: null })
      .where(eq(users.id, targetUserId))

    console.log(`✅ [DELETE] Photo de profil supprimée pour l'utilisateur ${targetUserId}`)

    return NextResponse.json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    })

  } catch (error) {
    console.error('❌ [DELETE] Erreur lors de la suppression:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la suppression de la photo'
    }, { status: 500 })
  }
}
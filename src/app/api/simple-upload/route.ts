import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [SIMPLE-UPLOAD] Test upload sans authentification...')
    
    // Récupération des données du formulaire
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'Aucun fichier fourni'
      }, { status: 400 })
    }

    console.log('📁 [SIMPLE-UPLOAD] Fichier reçu:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

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

    console.log('☁️ [SIMPLE-UPLOAD] Configuration Cloudinary:', {
      cloudName: cloudName ? 'OK' : 'MANQUANT',
      uploadPreset: uploadPreset ? 'OK' : 'MANQUANT'
    })

    if (!cloudName || !uploadPreset) {
      console.error('❌ [SIMPLE-UPLOAD] Configuration Cloudinary manquante')
      return NextResponse.json({
        success: false,
        message: `Configuration Cloudinary manquante. CloudName: ${cloudName ? 'OK' : 'MANQUANT'}, UploadPreset: ${uploadPreset ? 'OK' : 'MANQUANT'}`
      }, { status: 500 })
    }

    // Préparation des données pour Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', uploadPreset)
    cloudinaryFormData.append('folder', 'navette-xpress/test')
    cloudinaryFormData.append('public_id', `test-${Date.now()}`)

    console.log(`☁️ [SIMPLE-UPLOAD] Upload vers Cloudinary...`)

    // Upload vers Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    )

    console.log('📡 [SIMPLE-UPLOAD] Réponse Cloudinary status:', cloudinaryResponse.status)

    if (!cloudinaryResponse.ok) {
      let errorData
      try {
        errorData = await cloudinaryResponse.json()
      } catch (e) {
        errorData = { error: { message: 'Impossible de parser la réponse d\'erreur' } }
      }
      console.error('❌ [SIMPLE-UPLOAD] Erreur Cloudinary:', errorData)
      return NextResponse.json({
        success: false,
        message: `Erreur upload Cloudinary (${cloudinaryResponse.status}): ${errorData.error?.message || 'Erreur inconnue'}`
      }, { status: 500 })
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const imageUrl = cloudinaryData.secure_url
    
    console.log(`✅ [SIMPLE-UPLOAD] Image uploadée sur Cloudinary: ${imageUrl}`)

    return NextResponse.json({
      success: true,
      message: 'Upload réussi!',
      data: {
        imageUrl,
        publicId: cloudinaryData.public_id,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        format: cloudinaryData.format,
        bytes: cloudinaryData.bytes
      }
    })

  } catch (error) {
    console.error('❌ [SIMPLE-UPLOAD] Erreur lors de l\'upload:', error)
    return NextResponse.json({
      success: false,
      message: `Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }, { status: 500 })
  }
}

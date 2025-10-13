import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Vérification de la configuration Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log('🔧 Test de configuration Cloudinary:')
    console.log('- Cloud Name:', cloudName ? '✅' : '❌')
    console.log('- Upload Preset:', uploadPreset ? '✅' : '❌')
    console.log('- API Key:', apiKey ? '✅' : '❌')
    console.log('- API Secret:', apiSecret ? '✅' : '❌')

    return NextResponse.json({
      success: true,
      message: 'Test de configuration',
      config: {
        cloudName: cloudName ? 'Configuré' : 'Manquant',
        uploadPreset: uploadPreset ? 'Configuré' : 'Manquant',
        apiKey: apiKey ? 'Configuré' : 'Manquant',
        apiSecret: apiSecret ? 'Configuré' : 'Manquant'
      }
    })
  } catch (error) {
    console.error('❌ Erreur test config:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors du test de configuration',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
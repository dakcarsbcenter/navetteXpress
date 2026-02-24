import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour migrer une image externe vers Cloudinary
 * Contourne les problèmes CORS en téléchargeant côté serveur
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'URL d\'image manquante' },
        { status: 400 }
      );
    }

    // Vérifier la configuration Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { success: false, error: 'Configuration Cloudinary manquante' },
        { status: 500 }
      );
    }

    console.log(`📥 Téléchargement de: ${imageUrl}`);

    // Télécharger l'image (côté serveur, pas de problème CORS)
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`HTTP ${imageResponse.status}: Image non disponible ou bloquée`);
    }

    const imageBlob = await imageResponse.blob();
    
    // Vérifier que c'est bien une image et pas du HTML
    if (imageBlob.type.includes('text/html') || imageBlob.type.includes('application/json')) {
      throw new Error(`Type invalide: ${imageBlob.type} (probablement une page d'erreur)`);
    }
    
    // Vérifier la taille minimum (éviter les images placeholder de 1x1)
    if (imageBlob.size < 1000) {
      throw new Error(`Image trop petite: ${imageBlob.size} bytes (probablement invalide)`);
    }
    
    console.log(`✅ Image téléchargée: ${(imageBlob.size / 1024).toFixed(2)} KB`);

    // Créer un FormData pour Cloudinary
    const formData = new FormData();
    formData.append('file', imageBlob);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'navette-xpress/vehicles');

    console.log(`☁️  Upload vers Cloudinary...`);

    // Upload vers Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      throw new Error(`Erreur Cloudinary: ${errorData.error?.message || 'Unknown'}`);
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log(`✅ Uploadé sur Cloudinary: ${cloudinaryData.secure_url}`);

    return NextResponse.json({
      success: true,
      newUrl: cloudinaryData.secure_url,
      originalUrl: imageUrl,
    });

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}


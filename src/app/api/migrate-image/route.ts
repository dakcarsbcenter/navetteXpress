import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate and sanitize image URL to prevent SSRF attacks
 */
function isValidImageUrl(imageUrl: string): { valid: boolean; sanitizedUrl?: string; error?: string } {
  try {
    // Parse the URL to validate format
    const url = new URL(imageUrl);

    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: 'Protocole invalide (http/https requis)' };
    }

    // Prevent access to localhost and private IP ranges
    const hostname = url.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./, // 127.x.x.x
      /^192\.168\./, // 192.168.x.x
      /^10\./, // 10.x.x.x
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16-31.x.x
      /^169\.254\./, // 169.254.x.x (link-local)
      /^::1$/, // IPv6 localhost
      /^fc[0-9a-f]{2}:/i, // IPv6 private
      /^fe[89a-f][0-9a-f]:/i, // IPv6 link-local
    ];

    if (privatePatterns.some(pattern => pattern.test(hostname))) {
      return { valid: false, error: 'Accès aux réseaux privés non autorisé' };
    }

    // Prevent access to common internal services
    if (hostname.includes('internal') || hostname.includes('admin') || hostname.includes('private')) {
      return { valid: false, error: 'Accès à ce domaine non autorisé' };
    }

    // Validate URL length to prevent DoS
    if (imageUrl.length > 2048) {
      return { valid: false, error: 'URL trop grande' };
    }

    // Return the normalized URL (via URL parsing) to prevent manipulation
    return { valid: true, sanitizedUrl: url.toString() };
  } catch {
    return { valid: false, error: 'URL invalide' };
  }
}

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

    // Validate URL to prevent SSRF attacks
    const urlValidation = isValidImageUrl(imageUrl);
    if (!urlValidation.valid || !urlValidation.sanitizedUrl) {
      return NextResponse.json(
        { success: false, error: urlValidation.error || 'URL d\'image invalide' },
        { status: 400 }
      );
    }

    // Use the sanitized/normalized URL from the validator to prevent SSRF
    const safeImageUrl = urlValidation.sanitizedUrl;

    // Vérifier la configuration Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { success: false, error: 'Configuration Cloudinary manquante' },
        { status: 500 }
      );
    }

    console.log(`📥 Téléchargement de: ${safeImageUrl}`);

    // Télécharger l'image (côté serveur, pas de problème CORS)
    const imageResponse = await fetch(safeImageUrl, {
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


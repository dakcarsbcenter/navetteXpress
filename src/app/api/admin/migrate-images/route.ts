/**
 * Script pour migrer les images existantes vers Cloudinary
 * Ce script peut être utilisé pour convertir les URLs externes en URLs Cloudinary
 * 
 * Usage : npm run dev puis aller à /admin/migrate-images
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vehiclesTable } from '@/schema';
import { isNotNull } from 'drizzle-orm';

async function analyzeImages() {
  try {
    // Récupérer tous les véhicules avec des photos
    const vehicles = await db
      .select()
      .from(vehiclesTable)
      .where(isNotNull(vehiclesTable.photo));

    const migrationResults = [];
    let cloudinaryCount = 0;
    let externalCount = 0;

    for (const vehicle of vehicles) {
      if (!vehicle.photo) continue;

      const isCloudinary = vehicle.photo.includes('cloudinary.com');
      
      if (isCloudinary) {
        cloudinaryCount++;
      } else {
        externalCount++;
      }

      migrationResults.push({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        currentUrl: vehicle.photo,
        isCloudinary,
        needsMigration: !isCloudinary
      });
    }

    return {
      success: true,
      summary: {
        totalVehicles: vehicles.length,
        cloudinaryImages: cloudinaryCount,
        externalImages: externalCount,
        migrationNeeded: externalCount
      },
      vehicles: migrationResults
    };

  } catch (error) {
    console.error('Erreur lors de l\'analyse des images:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const result = await analyzeImages();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await analyzeImages();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}

/**
 * Fonction helper pour uploader une image externe vers Cloudinary
 * (À implémenter selon vos besoins)
 */
export async function migrateImageToCloudinary(imageUrl: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Configuration Cloudinary manquante');
  }

  try {
    // Fetch de l'image externe
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Upload vers Cloudinary
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'navette-xpress/vehicles');

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Erreur lors de l\'upload Cloudinary');
    }

    const data = await uploadResponse.json();
    return data.secure_url;

  } catch (error) {
    console.error('Erreur migration image:', error);
    throw error;
  }
}
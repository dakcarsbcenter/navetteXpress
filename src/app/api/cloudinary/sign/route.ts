import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { signCloudinaryParams } from '@/lib/cloudinary';

const ALLOWED_FOLDERS = [
  'navette-xpress/users',
  'navette-xpress/vehicles',
  'navette-xpress/ads',
  'navette-xpress/profiles',
];

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset || !apiKey || !cloudName) {
    return NextResponse.json({ error: 'Configuration Cloudinary manquante' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const folder = ALLOWED_FOLDERS.includes(body?.folder) ? body.folder : 'navette-xpress/users';

  try {
    const { signature, timestamp } = signCloudinaryParams({
      folder,
      upload_preset: uploadPreset,
    });

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      uploadPreset,
      folder,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur de signature' },
      { status: 500 }
    );
  }
}

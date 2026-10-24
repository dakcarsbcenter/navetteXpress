export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Invalide toutes les pages publiques pré-rendues. Appelée par
 * scripts/warm-public-pages.sh juste après chaque déploiement :
 *
 *   curl -X POST https://<domaine>/api/cron/revalidate-public \
 *     -H "x-cron-secret: $CRON_SECRET"
 *
 * Depuis que le layout racine ne lit plus la requête, les pages publiques sont
 * statiques (ISR). Or l'image Docker est construite avec une base factice
 * (Dockerfile, ARG DATABASE_URL) : tarifs, flotte et services y sont figés
 * vides. Sans cette invalidation, les visiteurs verraient ces pages vides
 * jusqu'à la première revalidation (5 min), voire plus longtemps pour une page
 * sans durée de revalidation.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, revalidated: '/ (layout)' });
}

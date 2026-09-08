export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { addToBlacklist } from '@/lib/security/blacklist';
import { logSecurityEvent } from '@/lib/security/logger';
import { getClientIp } from '@/lib/security/ip';

/**
 * Honeypot : cette route n'est référencée nulle part dans la navigation, le
 * sitemap ou robots.txt (elle tombe sous le disallow générique de /api/, ce
 * qui garde les vrais crawlers SEO à distance). Seul un lien invisible
 * (display:none) sur la page d'accueil y pointe — voir HomeClient.tsx.
 * Aucun humain ni crawler légitime ne devrait jamais l'atteindre : tout
 * appel ici vient d'un scraper qui explore agressivement le DOM/HTML brut.
 */
function trap(request: NextRequest) {
    const ip = getClientIp(request);
    addToBlacklist(ip);
    logSecurityEvent('honeypot_hit', {
        ip,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent'),
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function GET(request: NextRequest) {
    return trap(request);
}

export async function POST(request: NextRequest) {
    return trap(request);
}

// Lecture serveur de la flotte et des services publics geres en admin.
// Partage entre les routes API publiques et les pages rendues cote serveur
// (/flotte, /services, accueil) : le HTML contient ainsi les vehicules et les
// services des la premiere reponse, au lieu d'un "Chargement..." que les
// robots n'indexent pas. Ne jamais importer depuis un composant client.
import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { vehiclesTable, servicesTable } from '@/schema';
import { eq, desc, asc } from 'drizzle-orm';

// Tags d'invalidation : les routes qui modifient un vehicule ou un service
// appellent revalidatePublicVehicles() / revalidatePublicServices().
export const PUBLIC_VEHICLES_TAG = 'public-vehicles';
export const PUBLIC_SERVICES_TAG = 'public-services';

// Champs exposes dans le HTML des pages publiques. La plaque d'immatriculation
// et le chauffeur assigne n'en font volontairement pas partie : tout ce qui est
// passe en props a un composant client se retrouve dans la page.
export type PublicVehicle = {
    id: number;
    make: string;
    model: string;
    year: number;
    capacity: number;
    vehicleType: string;
    photo: string | null;
    category: string | null;
    description: string | null;
    features: string | null;
};

export type PublicService = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    features: string[];
};

async function getActiveVehicles(): Promise<PublicVehicle[]> {
    const rows = await db
        .select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.isActive, true))
        .orderBy(desc(vehiclesTable.createdAt));

    return rows.map((row) => ({
        id: row.id,
        make: row.make,
        model: row.model,
        year: row.year,
        capacity: row.capacity,
        vehicleType: row.vehicleType,
        photo: row.photo,
        category: row.category,
        description: row.description,
        features: row.features,
    }));
}

async function getActiveServices(): Promise<PublicService[]> {
    const rows = await db
        .select()
        .from(servicesTable)
        .where(eq(servicesTable.isActive, true))
        .orderBy(asc(servicesTable.sortOrder), asc(servicesTable.id));

    return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        icon: row.icon,
        features: row.features ?? [],
    }));
}

// Les pages publiques du dossier [locale] sont rendues a la demande : sans ce
// cache, chaque visite declencherait une requete sur la base. Le delai n'est
// qu'un filet de securite, l'invalidation reelle vient du tag.
const getCachedVehicles = unstable_cache(getActiveVehicles, ['public-active-vehicles'], {
    revalidate: 300,
    tags: [PUBLIC_VEHICLES_TAG],
});

const getCachedServices = unstable_cache(getActiveServices, ['public-active-services'], {
    revalidate: 300,
    tags: [PUBLIC_SERVICES_TAG],
});

// Variantes tolerantes : une base injoignable ne doit pas faire tomber la page,
// l'appelant retombe sur ses valeurs de repli.
export async function getActiveVehiclesSafe(): Promise<PublicVehicle[]> {
    try {
        return await getCachedVehicles();
    } catch (error) {
        console.error('Erreur lecture vehicles (rendu public):', error);
        return [];
    }
}

export async function getActiveServicesSafe(): Promise<PublicService[]> {
    try {
        return await getCachedServices();
    } catch (error) {
        console.error('Erreur lecture services (rendu public):', error);
        return [];
    }
}

// 'max' : la purge vaut quelle que soit la duree de vie du cache (Next 16).
export function revalidatePublicVehicles() {
    revalidateTag(PUBLIC_VEHICLES_TAG, 'max');
}

export function revalidatePublicServices() {
    revalidateTag(PUBLIC_SERVICES_TAG, 'max');
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles } from '@/schema';
import { isNull, not } from 'drizzle-orm';

export async function GET() {
  try {
    const allVehicles = await db
      .select({ photo: vehicles.photo, make: vehicles.make, model: vehicles.model })
      .from(vehicles)
      .where(not(isNull(vehicles.photo)));

    const domains = new Set<string>();
    const vehicleList: Array<{ vehicle: string; url: string; hostname: string }> = [];

    allVehicles.forEach(vehicle => {
      if (vehicle.photo) {
        try {
          const url = new URL(vehicle.photo);
          domains.add(url.hostname);
          vehicleList.push({
            vehicle: `${vehicle.make} ${vehicle.model}`,
            url: vehicle.photo,
            hostname: url.hostname
          });
        } catch (e) {
          // Invalid URL
        }
      }
    });

    const configEntries = Array.from(domains).map(domain => ({
      protocol: 'https',
      hostname: domain,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalImages: allVehicles.length,
        uniqueDomains: Array.from(domains),
        vehicleList,
        configEntries: configEntries.map(entry => 
          `{\n  protocol: '${entry.protocol}',\n  hostname: '${entry.hostname}',\n}`
        ).join(',\n')
      }
    });
  } catch (error) {
    console.error('Error checking image domains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check image domains' },
      { status: 500 }
    );
  }
}


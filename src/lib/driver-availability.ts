import { db } from '@/db';
import { driverAvailabilityTable } from '@/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

/**
 * Vérifie si un chauffeur est disponible à une date et heure données
 */
export async function checkDriverAvailability(
  driverId: string,
  scheduledDateTime: Date
): Promise<{ available: boolean; message?: string }> {
  try {
    const dayOfWeek = scheduledDateTime.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const time = scheduledDateTime.toTimeString().slice(0, 5); // Format "HH:mm"
    const dateOnly = new Date(scheduledDateTime);
    dateOnly.setHours(0, 0, 0, 0);

    // Récupérer toutes les disponibilités du chauffeur
    const availabilities = await db.select()
      .from(driverAvailabilityTable)
      .where(eq(driverAvailabilityTable.driverId, driverId));

    if (availabilities.length === 0) {
      // Aucune disponibilité définie = pas disponible
      return {
        available: false,
        message: `Le chauffeur n'a pas encore défini ses disponibilités`
      };
    }

    // 1. Vérifier les indisponibilités spécifiques à cette date
    const specificDateUnavailability = availabilities.find(a => {
      if (!a.specificDate || a.isAvailable) return false;
      const specDate = new Date(a.specificDate);
      specDate.setHours(0, 0, 0, 0);
      return specDate.getTime() === dateOnly.getTime() &&
             time >= a.startTime && time <= a.endTime;
    });

    if (specificDateUnavailability) {
      return {
        available: false,
        message: `Le chauffeur est indisponible le ${scheduledDateTime.toLocaleDateString('fr-FR')} de ${specificDateUnavailability.startTime} à ${specificDateUnavailability.endTime}${specificDateUnavailability.notes ? ` (${specificDateUnavailability.notes})` : ''}`
      };
    }

    // 2. Vérifier les disponibilités spécifiques à cette date
    const specificDateAvailability = availabilities.find(a => {
      if (!a.specificDate || !a.isAvailable) return false;
      const specDate = new Date(a.specificDate);
      specDate.setHours(0, 0, 0, 0);
      return specDate.getTime() === dateOnly.getTime() &&
             time >= a.startTime && time <= a.endTime;
    });

    if (specificDateAvailability) {
      return { available: true };
    }

    // 3. Vérifier les disponibilités récurrentes pour ce jour de la semaine
    const recurringAvailabilities = availabilities.filter(a => 
      !a.specificDate && a.isAvailable && a.dayOfWeek === dayOfWeek
    );

    if (recurringAvailabilities.length === 0) {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      return {
        available: false,
        message: `Le chauffeur n'est pas disponible le ${dayNames[dayOfWeek]}`
      };
    }

    // Vérifier si l'heure demandée est dans une des plages de disponibilité
    const isInAvailableSlot = recurringAvailabilities.some(a => 
      time >= a.startTime && time <= a.endTime
    );

    if (!isInAvailableSlot) {
      const slots = recurringAvailabilities.map(a => `${a.startTime}-${a.endTime}`).join(', ');
      return {
        available: false,
        message: `Le chauffeur n'est pas disponible à ${time}. Créneaux disponibles : ${slots}`
      };
    }

    return { available: true };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification de disponibilité:', error);
    return {
      available: false,
      message: 'Erreur lors de la vérification de disponibilité'
    };
  }
}

/**
 * Récupère les disponibilités d'un chauffeur formatées pour l'affichage
 */
export async function getDriverAvailabilitySummary(driverId: string) {
  try {
    const availabilities = await db.select()
      .from(driverAvailabilityTable)
      .where(eq(driverAvailabilityTable.driverId, driverId));

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    // Grouper par jour de la semaine
    const recurring: Record<number, any[]> = {};
    const specific: any[] = [];

    availabilities.forEach(a => {
      if (a.specificDate) {
        specific.push(a);
      } else {
        if (!recurring[a.dayOfWeek]) {
          recurring[a.dayOfWeek] = [];
        }
        recurring[a.dayOfWeek].push(a);
      }
    });

    return {
      recurring: Object.entries(recurring).map(([day, slots]) => ({
        dayOfWeek: parseInt(day),
        dayName: dayNames[parseInt(day)],
        slots
      })),
      specific: specific.map(a => ({
        ...a,
        date: a.specificDate ? new Date(a.specificDate).toLocaleDateString('fr-FR') : null
      }))
    };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du résumé:', error);
    return null;
  }
}

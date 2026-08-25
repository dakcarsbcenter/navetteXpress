export const MAX_TRIP_PLAN_OCCURRENCES = 400;
export const MAX_TRIP_PLAN_SPAN_DAYS = 366;

export interface TripPlanInput {
  recurrence: "weekly" | "monthly" | "custom";
  time: string; // "HH:mm"
  startDate: string; // ISO
  endDate?: string | null; // ISO, required for weekly/monthly
  daysOfWeek?: number[] | null; // 0=dimanche..6=samedi, required for weekly
  dayOfMonth?: number | null; // 1-31, required for monthly
  customDates?: string[] | null; // ISO dates, required for custom
}

export class TripPlanValidationError extends Error {}

function applyTime(date: Date, time: string): Date {
  const [hh, mm] = time.split(":").map(Number);
  const withTime = new Date(date);
  withTime.setHours(hh || 0, mm || 0, 0, 0);
  return withTime;
}

// Generates every occurrence date implied by a trip plan definition, applying
// the same span/count caps the API enforces so callers can rely on the
// result without re-validating.
export function generateTripPlanOccurrences(input: TripPlanInput): Date[] {
  const { recurrence, time } = input;

  if (recurrence === "custom") {
    if (!input.customDates || input.customDates.length === 0) {
      throw new TripPlanValidationError("noDates");
    }
    if (input.customDates.length > MAX_TRIP_PLAN_OCCURRENCES) {
      throw new TripPlanValidationError("maxOccurrences");
    }
    return input.customDates
      .map((iso) => applyTime(new Date(iso), time))
      .sort((a, b) => a.getTime() - b.getTime());
  }

  const startDate = new Date(input.startDate);
  const endDate = input.endDate ? new Date(input.endDate) : null;

  if (!endDate) {
    throw new TripPlanValidationError("missingEndDate");
  }

  const spanDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (spanDays < 0 || spanDays > MAX_TRIP_PLAN_SPAN_DAYS) {
    throw new TripPlanValidationError("maxSpan");
  }

  const occurrences: Date[] = [];

  if (recurrence === "weekly") {
    if (!input.daysOfWeek || input.daysOfWeek.length === 0) {
      throw new TripPlanValidationError("noDays");
    }
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const cappedEnd = new Date(endDate);
    cappedEnd.setHours(23, 59, 59, 999);

    while (cursor <= cappedEnd) {
      if (input.daysOfWeek.includes(cursor.getDay())) {
        occurrences.push(applyTime(cursor, time));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (recurrence === "monthly") {
    if (!input.dayOfMonth || input.dayOfMonth < 1 || input.dayOfMonth > 31) {
      throw new TripPlanValidationError("invalidDayOfMonth");
    }
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= endDate) {
      const occurrence = applyTime(new Date(cursor.getFullYear(), cursor.getMonth(), input.dayOfMonth), time);
      if (occurrence >= startDate && occurrence <= endDate) {
        occurrences.push(occurrence);
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  if (occurrences.length > MAX_TRIP_PLAN_OCCURRENCES) {
    throw new TripPlanValidationError("maxOccurrences");
  }

  return occurrences;
}

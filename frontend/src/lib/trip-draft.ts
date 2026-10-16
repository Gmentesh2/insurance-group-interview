import type { TripInput } from "./contracts";

const key = "insurance-group-trip";

/** Only trip preferences and ages, never names, DOBs, evidence, or credentials. */
export function saveTripDraft(trip: TripInput) {
  try {
    sessionStorage.setItem(key, JSON.stringify(trip));
  } catch {
    /* Storage can be disabled. */
  }
}

export function loadTripDraft(): TripInput | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Partial<TripInput>;
    if (
      typeof draft.residenceCountry !== "string" ||
      typeof draft.startDate !== "string" ||
      typeof draft.endDate !== "string" ||
      !Array.isArray(draft.destinationCountries) ||
      !draft.destinationCountries.every((c) => typeof c === "string") ||
      !Array.isArray(draft.travelers) ||
      draft.travelers.length < 1 ||
      draft.travelers.length > 8 ||
      !draft.travelers.every(
        (p) => p && (p.age === null || typeof p.age === "number"),
      )
    )
      return null;
    // JSON serializes a temporarily empty numeric field (NaN) as null.
    // Restore it as an empty UI field; submission still validates every age.
    return {
      residenceCountry: draft.residenceCountry,
      destinationCountries: draft.destinationCountries,
      startDate: draft.startDate,
      endDate: draft.endDate,
      travelers: draft.travelers.map((p) => ({ age: p.age ?? Number.NaN })),
    };
  } catch {
    return null;
  }
}

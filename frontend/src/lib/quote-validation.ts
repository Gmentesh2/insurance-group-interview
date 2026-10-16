import type { TripInput } from "./contracts";
import { isCalendarDate } from "./date-input";
import { MAX_TRIP_DAYS, tripDurationDays } from "./trip-dates";

type QuoteError =
  | "invalidResidence"
  | "invalidDestination"
  | "invalidDeparture"
  | "invalidDates"
  | "tripTooLong"
  | "invalidAge";
export type QuoteFieldErrors = Partial<Record<string, QuoteError>>;

/** Field-level feedback mirrors the server's demo limits; the API remains authoritative. */
export function validateQuoteFields(
  trip: TripInput,
  today: string,
): QuoteFieldErrors {
  const errors: QuoteFieldErrors = {};
  if (!trip.residenceCountry) errors.residenceCountry = "invalidResidence";
  if (
    !trip.destinationCountries.length ||
    trip.destinationCountries.includes(trip.residenceCountry)
  ) {
    errors.destinationCountries = "invalidDestination";
  }
  if (!isCalendarDate(trip.startDate) || trip.startDate < today)
    errors.startDate = "invalidDeparture";
  if (!isCalendarDate(trip.endDate) || trip.endDate < trip.startDate)
    errors.endDate = "invalidDates";
  else if (
    (tripDurationDays(trip.startDate, trip.endDate) ?? 0) > MAX_TRIP_DAYS
  ) {
    errors.endDate = "tripTooLong";
  }
  trip.travelers.forEach(({ age }, index) => {
    if (!Number.isInteger(age) || age < 0 || age > 100)
      errors[`age-${index}`] = "invalidAge";
  });
  return errors;
}

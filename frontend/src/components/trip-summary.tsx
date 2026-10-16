"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, UsersRound, Pencil } from "lucide-react";
import { countryName, tripDate } from "@/lib/countries";
import { saveTripDraft } from "@/lib/trip-draft";
import type { TripInput } from "@/lib/contracts";
import { CountryFlag } from "./country-flag";
export function TripSummary({
  trip,
  compact = false,
  editHref,
}: {
  trip: TripInput;
  compact?: boolean;
  editHref?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common");
  return (
    <div className={`trip-summary ${compact ? "trip-summary-compact" : ""}`}>
      <div className="trip-summary-item trip-summary-destinations">
        {trip.destinationCountries.map((code, index) => (
          <span className="trip-destination" key={code}>
            <CountryFlag code={code} />
            <span>{countryName(code, locale)}{index < trip.destinationCountries.length - 1 ? "," : ""}</span>
          </span>
        ))}
      </div>
      <div className="trip-summary-item">
        <CalendarDays size={18} aria-hidden="true" />
        <span>
          {tripDate(trip.startDate, locale)} — {tripDate(trip.endDate, locale)}
        </span>
      </div>
      <div className="trip-summary-item">
        <UsersRound size={18} aria-hidden="true" />
        <span>{t("travelersCount", { count: trip.travelers.length })}</span>
      </div>
      {editHref && (
        <Link className="text-link trip-edit" href={editHref} onClick={() => saveTripDraft(trip)}>
          <Pencil size={16} aria-hidden="true" />
          {t("editTrip")}
        </Link>
      )}
    </div>
  );
}

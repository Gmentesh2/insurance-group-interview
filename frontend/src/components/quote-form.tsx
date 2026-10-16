"use client";

import { FlowProgress, FieldRequirement } from "./flow-progress";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "react-day-picker";
import { enUS, de, ru } from "react-day-picker/locale";
import { ArrowRight, CalendarDays, Plus, X } from "lucide-react";
import type { DemoScenario, QuoteSession, TripInput } from "@/lib/contracts";
import { countryName, isoDate } from "@/lib/countries";
import { api } from "@/lib/client";
import { Button, Notice, Spinner } from "./ui";
import { CountryPicker } from "./country-picker";
import { CountryFlag } from "./country-flag";
import { DateInput } from "./date-input";
import { isCalendarDate } from "@/lib/date-input";
import { loadTripDraft, saveTripDraft } from "@/lib/trip-draft";
import { MAX_TRIP_DAYS, tripDurationDays } from "@/lib/trip-dates";
import {
  validateQuoteFields,
  type QuoteFieldErrors,
} from "@/lib/quote-validation";

const emptyTrip: TripInput = {
  residenceCountry: "",
  destinationCountries: [],
  startDate: "",
  endDate: "",
  travelers: [{ age: Number.NaN }],
};
export function QuoteForm({
  scenario = "success",
  showProgress = true,
}: {
  scenario?: DemoScenario;
  showProgress?: boolean;
}) {
  const t = useTranslations("quote"),
    l = useTranslations("landing"),
    flow = useTranslations("flow"),
    locale = useLocale(),
    router = useRouter(),
    id = useId();
  const [trip, setTrip] = useState<TripInput>(emptyTrip),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [calendar, setCalendar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<QuoteFieldErrors>({});
  const [travelerCount, setTravelerCount] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    setBusy(false);
    return () => { pending.current?.abort(); pending.current = null; };
  }, [locale, scenario]);
  useEffect(() => {
    const draft = loadTripDraft();
    if (draft) setTrip(draft);
  }, []);
  function update(next: Partial<TripInput>) {
    const value = { ...trip, ...next };
    setTrip(value);
    saveTripDraft(value);
    setError("");
    setFieldErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([field]) =>
            !(field in next) &&
            !(field === "endDate" && "startDate" in next && isCalendarDate(value.startDate) && !validateQuoteFields(value, isoDate(new Date())).endDate) &&
            !(field.startsWith("age-") && "travelers" in next),
        ),
      ),
    );
  }
  function focusDestination() {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(
      `[id="${id}-destination"], [id="${id}-destination-limit"]`,
    )?.focus());
  }
  function addDestination(code: string) {
    if (!code || trip.destinationCountries.includes(code) || trip.destinationCountries.length >= 10) return;
    update({ destinationCountries: [...trip.destinationCountries, code] });
    focusDestination();
  }
  function removeDestination(code: string) {
    update({ destinationCountries: trip.destinationCountries.filter(country => country !== code) });
    focusDestination();
  }
  function focusTraveler(index: number) {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>(
      `[name="travelers.${index}.age"]`,
    )?.focus());
  }
  function addTraveler() {
    if (trip.travelers.length >= 8) return;
    const index = trip.travelers.length;
    update({ travelers: [...trip.travelers, { age: Number.NaN }] });
    setTravelerCount(index + 1);
    focusTraveler(index);
  }
  function removeTraveler(index: number) {
    if (trip.travelers.length <= 1) return;
    const travelers = trip.travelers.filter((_, current) => current !== index);
    update({ travelers });
    setTravelerCount(travelers.length);
    focusTraveler(Math.min(index, travelers.length - 1));
  }
  function errorId(field: string) {
    return `${id}-${field}-error`;
  }
  function feedback(field: string) {
    const key = fieldErrors[field];
    return key ? (
      <p className="field-error" id={errorId(field)}>{t(key)}</p>
    ) : null;
  }
  function fieldA11y(field: string, hint?: string) {
    return {
      "aria-invalid": fieldErrors[field] ? true : undefined,
      "aria-describedby": [hint, fieldErrors[field] ? errorId(field) : undefined].filter(Boolean).join(" ") || undefined,
    };
  }
  const today = isoDate(new Date());
  const duration = tripDurationDays(trip.startDate, trip.endDate);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const invalid = validateQuoteFields(trip, today);
    setFieldErrors(invalid);
    if (Object.keys(invalid).length) {
      setError(t("checkFields"));
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setBusy(true);
    const controller = new AbortController();
    pending.current = controller;
    setError("");
    try {
      const result = await api<QuoteSession>("/quotes", {
        method: "POST",
        body: JSON.stringify({ ...trip, scenario }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      router.push(`/${locale}/quotes/${result.id}`);
    } catch {
      if (!controller.signal.aborted) setError(t("error"));
    } finally {
      if (!controller.signal.aborted) { pending.current = null; setBusy(false); }
    }
  }
  return (
    <form
      className="quote-form"
      onSubmit={submit}
      id="quote"
      ref={formRef}
      noValidate
    >
      {showProgress && <FlowProgress flow="quote" current={0} />}
      <div className="quote-form-heading">
        <p className="eyebrow">{l("formEyebrow")}</p>
        <h2 tabIndex={-1}>{l("formTitle")}</h2>
        <p>{l("formSubtitle")}</p>
      </div>
      <p className="flow-form-hint">{flow("allRequired")}</p>
      <div className="field">
        <label htmlFor={`${id}-residence`}>{t("residence")}<FieldRequirement /></label>
        <CountryPicker
          id={`${id}-residence`}
          value={trip.residenceCountry}
          name="residenceCountry"
          label={t("residence")}
          placeholder={t("residencePlaceholder")}
          invalid={!!fieldErrors.residenceCountry}
          describedBy={
            fieldErrors.residenceCountry ? errorId("residenceCountry") : undefined
          }
          required
          onChange={(code) =>
            update({
              residenceCountry: code,
              destinationCountries: trip.destinationCountries.filter(
                (c) => c !== code,
              ),
            })
          }
        />
        {feedback("residenceCountry")}
      </div>
      <div className="field">
        <label htmlFor={`${id}-destination`}>{t("destination")}<FieldRequirement /></label>
        {trip.destinationCountries.length < 10 ? (
          <CountryPicker
            key={trip.destinationCountries.join(",")}
            id={`${id}-destination`}
            value=""
            name="destinationCountries"
            label={t("destination")}
            invalid={!!fieldErrors.destinationCountries}
            describedBy={
              fieldErrors.destinationCountries
                ? errorId("destinationCountries")
                : undefined
            }
            exclude={[trip.residenceCountry, ...trip.destinationCountries]}
            placeholder={
              trip.destinationCountries.length
                ? t("addDestination")
                : t("destinationPlaceholder")
            }
            required={!trip.destinationCountries.length}
            onChange={addDestination}
          />
        ) : (
          <p className="small muted" id={`${id}-destination-limit`} tabIndex={-1}>{t("destinationLimit")}</p>
        )}
        {feedback("destinationCountries")}
        {trip.destinationCountries.length > 0 && (
          <div className="destination-chips">
            {trip.destinationCountries.map((code) => (
              <span className="destination-chip" key={code}>
                <CountryFlag code={code} size="small" />{countryName(code, locale)}
                <button
                  type="button"
                  aria-label={`${t("remove")} ${countryName(code, locale)}`}
                  onClick={() => removeDestination(code)}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <fieldset className="date-fields">
        <legend>{t("dates")}</legend>
        <div className="date-fields-inner">
          <div className="field">
            <label htmlFor={`${id}-depart`}>{t("depart")}<FieldRequirement /></label>
            <DateInput
              id={`${id}-depart`}
              name="startDate"
              autoComplete="off"
              {...fieldA11y("startDate", `${id}-dates-hint`)}
              required
              className="input"
              value={trip.startDate}
              onValueChange={startDate => update({ startDate })}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-return`}>{t("return")}<FieldRequirement /></label>
            <DateInput
              id={`${id}-return`}
              name="endDate"
              autoComplete="off"
              {...fieldA11y("endDate", `${id}-dates-hint`)}
              required
              className="input"
              value={trip.endDate}
              onValueChange={endDate => update({ endDate })}
            />
          </div>
          <Popover.Root open={calendar} onOpenChange={setCalendar}>
            <Popover.Trigger
              className="calendar-button icon-button"
              aria-label={t("chooseDates")}
              aria-describedby={`${id}-dates-hint`}
            >
              <CalendarDays size={21} aria-hidden="true" /><span className="calendar-button-label">{t("chooseDates")}</span>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                sideOffset={8}
                align="end"
                positionMethod="fixed"
                collisionPadding={12}
                className="popover-positioner"
              >
                <Popover.Popup className="calendar-popover">
                  <Popover.Title className="calendar-title">
                    {t("dateHint")}
                  </Popover.Title>
                  <DayPicker
                    mode="range"
                    defaultMonth={isCalendarDate(trip.startDate) ? new Date(`${trip.startDate}T12:00:00`) : undefined}
                    startMonth={new Date(`${today}T00:00:00`)}
                    locale={locale === "de" ? de : locale === "ru" ? ru : enUS}
                    selected={{
                      from: isCalendarDate(trip.startDate)
                        ? new Date(`${trip.startDate}T12:00:00`)
                        : undefined,
                      to: isCalendarDate(trip.endDate)
                        ? new Date(`${trip.endDate}T12:00:00`)
                        : undefined,
                    }}
                    onSelect={(range) =>
                      update({
                        startDate: range?.from ? isoDate(range.from) : "",
                        endDate: range?.to ? isoDate(range.to) : "",
                      })
                    }
                    disabled={{ before: new Date(`${today}T00:00:00`) }}
                    min={0}
                    max={MAX_TRIP_DAYS - 1}
                  />
                  <Popover.Close className="button calendar-done" disabled={duration === null || duration > MAX_TRIP_DAYS}>
                    {t("doneDates")}
                  </Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <div className="quote-date-meta"><p id={`${id}-dates-hint`}>{t("durationHint", { max: MAX_TRIP_DAYS })}</p><p className="quote-date-duration" role="status">{duration !== null && duration <= MAX_TRIP_DAYS ? t("duration", { days: duration }) : ""}</p></div>
        {feedback("startDate")}
        {feedback("endDate")}
      </fieldset>
      <fieldset className="traveler-fields">
        <legend>{t("travelers")}</legend>
        <p className="sr-only" role="status">{travelerCount !== null ? t("travelerCount", { count: travelerCount }) : ""}</p>
        <div className="traveler-rows">
          {trip.travelers.map((person, index) => (
            <div key={index}>
              <div className="traveler-row">
                <label htmlFor={`${id}-age-${index}`}>
                  {t("traveler", { number: index + 1 })}
                  <FieldRequirement /><span>{t("ageHint")}</span>
                </label>
                <div className="age-control">
                  <span aria-hidden="true">{t("age")}</span>
                  <input
                    id={`${id}-age-${index}`}
                    name={`travelers.${index}.age`}
                    autoComplete="off"
                    inputMode="numeric"
                    {...fieldA11y(`age-${index}`)}
                    aria-label={`${t("traveler", { number: index + 1 })} — ${t("age")}`}
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={Number.isNaN(person.age) ? "" : person.age}
                    onChange={(e) =>
                      update({
                        travelers: trip.travelers.map((p, i) =>
                          i === index
                            ? {
                                age:
                                  e.target.value === ""
                                    ? NaN
                                    : Number(e.target.value),
                              }
                            : p,
                        ),
                      })
                    }
                  />
                </div>
                {trip.travelers.length > 1 && (
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`${t("remove")} ${t("traveler", { number: index + 1 })}`}
                    onClick={() => removeTraveler(index)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {feedback(`age-${index}`)}
            </div>
          ))}
        </div>
        {trip.travelers.length < 8 && (
          <button
            className="add-traveler"
            type="button"
            onClick={addTraveler}
          >
            <Plus size={16} />
            {t("addTraveler")}
          </button>
        )}
      </fieldset>
      {error && <Notice tone="error">{error}</Notice>}
      <Button className="quote-submit" disabled={busy} type="submit">
        {busy ? (
          <>
            <Spinner />
            {t("submitting")}
          </>
        ) : (
          <>
            {t("button")}
            <ArrowRight size={20} />
          </>
        )}
      </Button>
      <p className="quote-privacy">
        {t("secure")}
      </p>
    </form>
  );
}

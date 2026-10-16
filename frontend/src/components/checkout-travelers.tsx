"use client";

import { FieldRequirement } from "./flow-progress";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import { api, RequestError } from "@/lib/client";
import type { Order, Traveler } from "@/lib/contracts";
import { deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft } from "@/lib/private-drafts";
import { DateInput } from "./date-input";
import { Input } from "./ui";
import { ErrorNotice, errorCode } from "./account-shared";
import { contactEmailSchema } from "@/lib/guest-validation";

type FieldError =
  | "firstNameInvalid"
  | "lastNameInvalid"
  | "birthDateInvalid"
  | "birthDateAgeMismatch";

function travelerErrors(
  error: unknown,
  travelerCount: number,
): Record<string, FieldError> {
  if (!(error instanceof RequestError) || !error.fields) return {};
  const result: Record<string, FieldError> = {};
  for (const [path, reason] of Object.entries(error.fields)) {
    const match = /^travelers\.(\d+)\.(firstName|lastName|dateOfBirth)$/.exec(
      path,
    );
    if (!match || Number(match[1]) >= travelerCount) continue;
    result[path] =
      match[2] === "firstName"
        ? "firstNameInvalid"
        : match[2] === "lastName"
          ? "lastNameInvalid"
          : reason === "AGE_MISMATCH" || error.code === "AGE_MISMATCH"
            ? "birthDateAgeMismatch"
            : "birthDateInvalid";
  }
  return result;
}

export function TravelerForm({
  order,
  onSave,
  onCancel,
  requireContact = false,
}: {
  order: Order;
  onSave: (order: Order) => void;
  onCancel?: () => void;
  requireContact?: boolean;
}) {
  const t = useTranslations("account");
  const design = useTranslations("checkoutDesign");
  const recovery = useTranslations("checkoutRecovery");
  const guest = useTranslations("guest");
  const [contactEmail, setContactEmail] = useState(() => getPrivateDraft<string>(order.userId, `contact:${order.id}`) ?? order.contactEmail ?? "");
  const [emailError, setEmailError] = useState(false);
  const [travelers, setTravelers] = useState<Traveler[]>(
    () =>
      getPrivateDraft<Traveler[]>(order.userId, `travelers:${order.id}`) ??
      order.trip.travelers.map(
        (_, i) =>
          order.travelers[i] ?? {
            firstName: "",
            lastName: "",
            dateOfBirth: "",
          },
      ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldError>>(
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const focusField = useRef<string | null>(null);
  const saving = useRef(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  useEffect(() => {
    if (!focusField.current) return;
    const field = formRef.current?.elements.namedItem(focusField.current);
    if (field instanceof HTMLInputElement) field.focus();
    focusField.current = null;
  }, [fieldErrors]);

  function update(index: number, key: keyof Traveler, value: string) {
    const next = travelers.map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    );
    setPrivateDraft(order.userId, `travelers:${order.id}`, next);
    setTravelers(next);
    const path = `travelers.${index}.${key}`;
    if (fieldErrors[path])
      setFieldErrors((previous) => {
        const nextErrors = { ...previous };
        delete nextErrors[path];
        return nextErrors;
      });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving.current) return;
    if ((requireContact || contactEmail) && !contactEmailSchema.safeParse(contactEmail).success) {
      setEmailError(true);
      formRef.current?.querySelector<HTMLInputElement>("#checkout-contact-email")?.focus();
      return;
    }
    saving.current = true;
    const controller = new AbortController();
    request.current = controller;
    const epoch = getPrivateSessionEpoch();
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const updated = await api<Order>(
        `/api/v1/orders/${order.id}/customer-details`,
        {
          method: "POST",
          body: JSON.stringify({ travelers, ...(contactEmail ? { contactEmail: contactEmail.trim() } : {}) }),
          signal: controller.signal,
        },
      );
      if (controller.signal.aborted || request.current !== controller || epoch !== getPrivateSessionEpoch()) return;
      deletePrivateDraft(order.userId, `travelers:${order.id}`);
      deletePrivateDraft(order.userId, `contact:${order.id}`);
      onSave(updated);
    } catch (cause) {
      if (controller.signal.aborted || request.current !== controller || epoch !== getPrivateSessionEpoch()) return;
      const errors = travelerErrors(cause, travelers.length);
      if (cause instanceof RequestError && (cause.fields?.contactEmail || cause.code === "CONTACT_REQUIRED")) {
        setEmailError(true);
        formRef.current?.querySelector<HTMLInputElement>("#checkout-contact-email")?.focus();
      }
      focusField.current = Object.keys(errors)[0] ?? null;
      setFieldErrors(errors);
      setError(errorCode(cause));
    } finally {
      if (request.current === controller) {
        request.current = null;
        saving.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <form ref={formRef} onSubmit={save} noValidate className="checkout-traveler-form">
      <header className="checkout-section-heading">
        <h1>{design("travelerTitle")}</h1>
        <p className="account-lead">{t("travelerIntro")}</p>
      </header>
      {error && <ErrorNotice code={error} />}
      {(requireContact || order.contactEmail) && <div className="field checkout-contact-field"><label htmlFor="checkout-contact-email">{guest("email")}<FieldRequirement /></label><input id="checkout-contact-email" className="input" type="email" autoComplete="email" required maxLength={254} value={contactEmail} disabled={busy} aria-invalid={emailError || undefined} aria-describedby={emailError ? "checkout-contact-hint checkout-contact-error" : "checkout-contact-hint"} onChange={event => { setContactEmail(event.target.value); setEmailError(false); setPrivateDraft(order.userId, `contact:${order.id}`, event.target.value); }} /><small id="checkout-contact-hint">{guest("emailHint")}</small>{emailError && <small id="checkout-contact-error" className="claim-field-error">{guest("emailInvalid")}</small>}</div>}
      <div className="traveler-forms">
        {travelers.map((person, index) => (
          <fieldset key={index} disabled={busy}>
            <legend>
              {t("traveler", { number: index + 1 })}
            </legend>
            <div className="account-form-grid">
              {(["firstName", "lastName", "dateOfBirth"] as const).map(
                (key) => {
                  const path = `travelers.${index}.${key}`;
                  const id = `traveler-${index}-${key}`;
                  const issue = fieldErrors[path];
                  const birthDate = key === "dateOfBirth";
                  const describedBy = [
                    birthDate ? `${id}-hint` : null,
                    issue ? `${id}-error` : null,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <label className={`field${birthDate ? " checkout-birth-date" : ""}`} key={key} htmlFor={id}>
                      <span>{t(birthDate ? "dob" : key)}<FieldRequirement /></span>
                      {birthDate ? <DateInput
                        id={id}
                        name={path}
                        required
                        value={person.dateOfBirth}
                        onValueChange={value => update(index, 'dateOfBirth', value)}
                        autoComplete={index === 0 ? 'bday' : 'off'}
                        aria-invalid={issue ? true : undefined}
                        aria-describedby={describedBy || undefined}
                      /> : <Input
                        id={id}
                        name={path}
                        type="text"
                        value={person[key]}
                        onChange={event => update(index, key, event.target.value)}
                        autoComplete={index === 0 ? key === 'firstName' ? 'given-name' : 'family-name' : 'off'}
                        required
                        maxLength={80}
                        aria-invalid={issue ? true : undefined}
                        aria-describedby={describedBy || undefined}
                      />}
                      {birthDate && (
                        <small id={`${id}-hint`}>
                          {design("birthDateFormat")} {t("quotedAge", {
                            age: order.trip.travelers[index].age,
                          })}
                        </small>
                      )}
                      {issue && (
                        <small className="field-error" id={`${id}-error`}>
                          <CircleAlert size={16} aria-hidden="true" />
                          {recovery(issue, {
                            age: order.trip.travelers[index].age,
                          })}
                        </small>
                      )}
                    </label>
                  );
                },
              )}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="checkout-form-action">
        <p>{design("nextReview")}</p>
        <div className="checkout-actions">
        <button className="button" disabled={busy}>
          {busy && <LoaderCircle size={18} className="spin" />}
          {design("reviewPurchase")}
          <ArrowRight size={18} />
        </button>
        {onCancel && (
          <button type="button" className="button button-ghost" disabled={busy} onClick={() => {
            deletePrivateDraft(order.userId, `travelers:${order.id}`);
            deletePrivateDraft(order.userId, `contact:${order.id}`);
            onCancel();
          }}>
            {design("cancelEdit")}
          </button>
        )}
        </div>
      </div>
    </form>
  );
}

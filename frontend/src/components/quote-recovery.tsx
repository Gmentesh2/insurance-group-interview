"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Clock3, RefreshCw } from "lucide-react";
import type { QuoteSession } from "@/lib/contracts";
import { api } from "@/lib/client";
import { saveTripDraft } from "@/lib/trip-draft";
import { Button, Spinner } from "./ui";
import { ErrorNotice, errorCode } from "./account-shared";
import { TripSummary } from "./trip-summary";

export function QuoteRecovery({ session }: { session: QuoteSession }) {
  const t = useTranslations("quoteDesign");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    const trip = { ...session.trip, scenario: session.trip.scenario === "quote_expired" ? "success" as const : session.trip.scenario };
    saveTripDraft(trip);
    try {
      const fresh = await api<QuoteSession>("/quotes", { method: "POST", body: JSON.stringify(trip), signal: controller.signal });
      if (!controller.signal.aborted) router.push(`/${locale}/quotes/${fresh.id}`);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(errorCode(cause));
      setBusy(false);
      inFlight.current = false;
    }
  }
  return <div className="container page-space quote-recovery-page">
    <TripSummary trip={session.trip} editHref={`/${locale}?product=travel#quote`} />
    <div className="empty-state panel quote-recovery">
      <span className="icon-surface"><Clock3 size={30} aria-hidden="true" /></span>
      <p className="eyebrow">{t("expiredLabel")}</p>
      <h1>{t("expiredTitle")}</h1>
      <p>{t("expiredText")}</p>
      {error && <ErrorNotice code={error} />}
      <div className="quote-recovery-actions">
        <Button disabled={busy} onClick={() => void refresh()}>{busy ? <Spinner /> : <RefreshCw size={18} />}{t("refreshQuotes")}</Button>
        <Link className="button button-secondary" href={`/${locale}?product=travel#quote`} onClick={() => saveTripDraft(session.trip)}>{t("editTrip")}<ArrowRight size={18} /></Link>
      </div>
    </div>
  </div>;
}

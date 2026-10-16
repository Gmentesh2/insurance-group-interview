"use client";
import { PageIdentity } from "@/components/insurance-illustration";
import { Money } from "./money";
import { CurrencySettlementNote } from "./currency-provider";
import { PlanDetails, QuoteBenefit } from "./quote-cover";

import { FlowProgress } from "./flow-progress";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Clock3,
  FileCheck2,
} from "lucide-react";
import type { QuoteSession } from "@/lib/contracts";
import { api, RequestError } from "@/lib/client";
import { Button, Notice, Spinner } from "./ui";
import { QuoteComparison } from "./quote-comparison";
import { TripSummary } from "./trip-summary";
import { QuoteRecovery } from "./quote-recovery";
import { saveTripDraft } from "@/lib/trip-draft";

export function QuoteResults({ sessionId }: { sessionId: string }) {
  const p = useTranslations("plans"),
    c = useTranslations("common"),
    design = useTranslations("quoteDesign"),
    locale = useLocale();
  const search = useSearchParams();
  const router = useRouter();
  const requestedSelection = search.get("selected") ?? search.get("compare") ?? "";
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const wasComparing = useRef(false);
  const [session, setSession] = useState<QuoteSession | null>(null),
    [error, setError] = useState<"missing" | "temporary" | null>(null),
    [attempt, setAttempt] = useState(0),
    [expired, setExpired] = useState(false),
    [selected, setSelected] = useState<string[]>(() => [...new Set(requestedSelection.split(",").filter(Boolean))].slice(0, 3)),
    [max, setMax] = useState(3),
    [limitMessage, setLimitMessage] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setSession(null);
    api<QuoteSession>(`/quote-sessions/${sessionId}`, {
      signal: controller.signal,
    })
      .then(value => {
        if (controller.signal.aborted) return;
        setSelected(current => current.filter(id => value.quotes.some(quote => quote.id === id)));
        setExpired(Date.parse(value.expiresAt) <= Date.now());
        setSession(value);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e instanceof RequestError && e.status === 404 ? "missing" : "temporary");
      });
    return () => controller.abort();
  }, [sessionId, attempt]);
  useEffect(() => {
    if (!session) return;
    const expiry = Math.min(Date.parse(session.expiresAt), ...session.quotes.map(quote => Date.parse(quote.expiresAt)));
    const update = () => setExpired(expiry <= Date.now());
    const timer = window.setTimeout(update, Math.max(0, expiry - Date.now()));
    document.addEventListener("visibilitychange", update);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", update); };
  }, [session]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setMax(media.matches ? 2 : 3);
      if (media.matches) setSelected((v) => v.slice(0, 2));
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const ids = [...new Set(requestedSelection.split(",").filter(Boolean))].slice(0, max);
    setSelected(session ? ids.filter(id => session.quotes.some(quote => quote.id === id)) : ids);
  }, [requestedSelection, max, session]);
  const comparing = !!search.get("compare");
  useEffect(() => {
    if (wasComparing.current && !comparing) resultHeading.current?.focus({ preventScroll: true });
    wasComparing.current = comparing;
  }, [comparing]);
  function selectPlans(next: string[]) {
    setSelected(next);
    const query = new URLSearchParams(search.toString());
    query.delete("compare"); query.delete("differences");
    if (next.length) query.set("selected", next.join(",")); else query.delete("selected");
    router.replace(`/${locale}/quotes/${sessionId}${query.size ? `?${query}` : ""}`, { scroll: false });
  }
  function toggle(id: string) {
    if (selected.includes(id)) {
      selectPlans(selected.filter((v) => v !== id));
      setLimitMessage(false);
    } else if (selected.length < max) {
      selectPlans([...selected, id]);
      setLimitMessage(false);
    } else setLimitMessage(true);
  }
  if (error)
    return (
      <div className="container page-space">
        <div className="empty-state panel">
          <CircleHelp size={36} />
          <h1>{error === "missing" ? p("notFound") : design("loadFailed")}</h1>
          <p>{design(error === "missing" ? "missingText" : "loadFailedText")}</p>
          {error === "temporary" && <Button onClick={() => setAttempt(value => value + 1)}>{c("retry")}</Button>}
          <Link className="button" href={`/${locale}?product=travel#quote`}>
            {p("refresh")}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  if (!session)
    return (
      <div className="container page-space loading-page" role="status">
        <Spinner />
        <p>{c("loading")}</p>
      </div>
    );
  if (expired) return <QuoteRecovery key={session.id} session={session} />;
  const comparisonIds = new Set((search.get("compare") ?? "").split(","));
  const comparisonQuotes = session.quotes.filter(quote => comparisonIds.has(quote.id)).slice(0, max);
  if (comparisonQuotes.length >= 2) return <QuoteComparison quotes={comparisonQuotes} sessionId={session.id} trip={session.trip} />;
  return (
    <div
      className={`container page-space results-page ${selected.length ? "has-compare-tray" : ""}`}
    >
      <Link href={`/${locale}?product=travel#quote`} className="back-link" onClick={() => saveTripDraft(session.trip)}>
        <ArrowLeft size={16} />
        {p("back")}
      </Link>
      <FlowProgress flow="quote" current={1} />
      <header className="results-heading"><PageIdentity illustration="travel">
        <h1 ref={resultHeading} tabIndex={-1}>{design("resultsTitle")}</h1>
        <p>{design("resultsIntro")}</p></PageIdentity>
      </header>
      <TripSummary trip={session.trip} editHref={`/${locale}?product=travel#quote`} />
      <CurrencySettlementNote />
      {!session.quotes.length ? (
        <div className="empty-state panel">
          <FileCheck2 size={40} />
          <h2>{p("emptyTitle")}</h2>
          <p>{p("emptyText")}</p>
          <Link className="button" href={`/${locale}?product=travel#quote`} onClick={() => saveTripDraft(session.trip)}>
            {p("back")}
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <div className="results-meta">
            <span className="results-count">{design("count", { count: session.quotes.length })}</span>
            <p>{design("compareHint", { count: max })}</p>
          </div>
          {limitMessage && <Notice>{p("compareLimit", { count: max })}</Notice>}
          <div
            className={`plan-grid ${session.quotes.length === 1 ? "plan-grid-single" : ""}`}
          >
            {session.quotes.map((quote) => (
              <article
                className={`plan-card plan-${quote.plan} ${selected.includes(quote.id) ? "plan-selected" : ""}`}
                key={quote.id}
                aria-labelledby={`plan-${quote.id}`}
              >
                <div className="plan-heading">
                  <h2 id={`plan-${quote.id}`}>{c(quote.plan)}</h2>
                  <p className="plan-provider">
                    {c("provider")} · {quote.provider.split(" · ")[0]}
                  </p>
                </div>
                <p className="plan-description">{design(`${quote.plan}Description`)}</p>
                <div className="plan-price">
                  <strong><Money cents={quote.totalCents} displayCurrency /></strong>
                  <span>{design("totalForTravelers", { count: session.trip.travelers.length })}</span>
                  <small>{p("taxes")}</small>
                </div>
                <Link
                  href={`/${locale}/checkout?quoteId=${quote.id}&sessionId=${session.id}`}
                  className="button plan-select"
                  aria-label={`${p("select", { plan: c(quote.plan) })} · ${quote.provider.split(" · ")[0]}`}
                >
                  {p("select", { plan: c(quote.plan) })}
                  <ArrowRight size={17} />
                </Link>
                <label className="compare-checkbox">
                  <input
                    type="checkbox"
                    aria-label={`${p("compare")} ${c(quote.plan)} · ${quote.provider.split(" · ")[0]}`}
                    checked={selected.includes(quote.id)}
                    onChange={() => toggle(quote.id)}
                  />
                  {p("compare")}
                </label>
                <div className="plan-benefits">
                  <h3>{design("included")}</h3>
                  {quote.coverage.map((v) => (
                    <QuoteBenefit key={v.key} coverage={v} />
                  ))}
                </div>
                <div className="plan-exclusions">
                  <h3>{p("exclusions")}</h3>
                  <p>{quote.exclusions.map((e) => c(e)).join(" · ")}</p>
                </div>
                <PlanDetails quote={quote} />
              </article>
            ))}
          </div>
          <div className="results-disclaimer">
            <p><Clock3 size={16} aria-hidden="true" />{p("quoteValid")}</p>
            <p>{p("priceChanged")}</p>
          </div>
        </>
      )}
      {selected.length > 0 && (
        <div className="compare-tray">
          <div>
            <span className="selection-count">{selected.length}</span>
            <strong>{p("compareSelected", { count: selected.length })}</strong>
          </div>
          <div>
            <Button variant="ghost" onClick={() => selectPlans([])}>
              {p("clear")}
            </Button>
            {selected.length < 2 ? <Button disabled>{p("compare")}<ArrowRight size={18} aria-hidden="true" /></Button> : <Link className="button" href={`/${locale}/quotes/${session.id}?compare=${encodeURIComponent(selected.join(","))}`}>{p("compare")}<ArrowRight size={18} aria-hidden="true" /></Link>}
          </div>
        </div>
      )}

    </div>
  );
}

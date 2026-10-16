"use client";
import { InsuranceIllustration } from "@/components/insurance-illustration";
import { Money } from "./money";
import { PlanDetails, QuoteBenefit } from "./quote-cover";

import { FlowProgress, FieldRequirement } from "./flow-progress";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  LoaderCircle,
  CircleCheck,
  Clock3,
  CircleAlert,
  ChevronDown,
} from "lucide-react";
import { api, RequestError } from "@/lib/client";
import type { Order, Quote, QuoteSession, Traveler, SessionUser } from "@/lib/contracts";
import { TripSummary } from "@/components/ui";
import { deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft } from "@/lib/private-drafts";
import { ExpiredQuoteRecovery } from "./checkout-recovery";
import { TravelerForm } from "./checkout-travelers";

import {
  AuthGate,
  CoverageSummary,
  ErrorNotice,
  Loading,
  Timeline,
  errorCode,
  money,
  localDate,
} from "./account-shared";

export function CheckoutStart({
  quoteId,
  sessionId,
}: {
  quoteId: string;
  sessionId: string;
}) {
  const t = useTranslations("account");
  const locale = useLocale();
  if (!quoteId || !sessionId)
    return (
      <div className="account-empty">
        <ShieldCheck size={40} />
        <h1>{t("missingQuote")}</h1>
        <Link className="button" href={`/${locale}`}>
          {t("choosePlan")}
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  return (
    <AuthGate guestCheckout unauthenticatedContext={<CheckoutSelection key={`${locale}:${sessionId}:${quoteId}`} sessionId={sessionId} quoteId={quoteId} />}>
      {(user) => <CreateOrder key={`${locale}:${quoteId}:${sessionId}`} userId={user.id} quoteId={quoteId} sessionId={sessionId} />}
    </AuthGate>
  );
}
function CheckoutSelection({ sessionId, quoteId }: { sessionId: string; quoteId: string }) {
  const locale = useLocale();
  const t = useTranslations("account");
  const design = useTranslations("checkoutDesign");
  const [session, setSession] = useState<QuoteSession | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void api<QuoteSession>(`/api/v1/quote-sessions/${sessionId}`, { signal: controller.signal })
      .then((current) => {
        if (controller.signal.aborted) return;
        if (!current.quotes.some((quote) => quote.id === quoteId)) {
          setError("NOT_FOUND");
          return;
        }
        setSession(current);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorCode(cause));
      });
    return () => controller.abort();
  }, [sessionId, quoteId, attempt]);
  const quote = session?.quotes.find((item) => item.id === quoteId);
  return (
    <section className="checkout-signin-context" aria-label={design("selectionForReview")}>
      <FlowProgress flow="purchase" current={0} />
      <div className="checkout-signin-selection">
        <div>
          <span>{design("selectionForReview")}</span>
          {quote && <strong>{t(`plan_${quote.plan}`)}<span><Money cents={quote.totalCents} /></span></strong>}
          {!session && !error && <span role="status">{design("loadingSelection")}</span>}
        </div>
        <Link className="account-text-link" href={`/${locale}/quotes/${sessionId}`}><ArrowLeft size={16} />{t("backToQuotes")}</Link>
      </div>
      {session && quote && <TripSummary trip={session.trip} compact />}
      {error && <div className="checkout-selection-error">
        <p role="alert">{design("selectionFailed")}</p>
        <button type="button" className="account-text-link" onClick={() => setAttempt((value) => value + 1)}>{t("retry")}</button>
      </div>}
    </section>
  );
}

function CreateOrder({
  quoteId,
  sessionId,
  userId,
}: {
  quoteId: string;
  sessionId: string;
  userId: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("account");
  const design = useTranslations("checkoutDesign");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [changedTotal, setChangedTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [resumeRequired, setResumeRequired] = useState(false);
  const [resumeChecked, setResumeChecked] = useState(false);
  const request = useRef<AbortController | null>(null);
  const sessionEpoch = useRef(getPrivateSessionEpoch());

  const readPriceDetails = useCallback(async (controller: AbortController) => {
    setDetailsError("");
    const session = await api<QuoteSession>(`/api/v1/quote-sessions/${sessionId}`, {
      signal: controller.signal,
    });
    if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
    const selected = session.quotes.find((item) => item.id === quoteId);
    if (!selected) throw new RequestError("NOT_FOUND", "Quote not found", 404);
    setQuote(selected);
  }, [quoteId, sessionId]);

  const create = useCallback(async (acceptPriceChange = false) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    let navigating = false;
    setBusy(true);
    setError("");
    setDetailsError("");
    setResumeRequired(false);
    setPrivateDraft(userId, `order-create:${quoteId}`, true);
    try {
      const order = await api<Order>("/api/v1/orders", {
        method: "POST",
        body: JSON.stringify({ quoteId, acceptPriceChange }),
        signal: controller.signal,
      });
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      deletePrivateDraft(userId, `order-create:${quoteId}`);
      navigating = true;
      router.replace(`/${locale}/checkout/${order.id}`);
    } catch (cause) {
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      const code = errorCode(cause);
      setError(code);
      if (cause instanceof RequestError && cause.status < 500 && cause.status !== 401) {
        deletePrivateDraft(userId, `order-create:${quoteId}`);
      } else {
        setResumeRequired(true);
        setResumeChecked(false);
      }
      if (code === "PRICE_CHANGED") {
        setQuote(null);
        const total = cause instanceof RequestError
          ? Number(cause.fields?.currentTotalCents)
          : NaN;
        setChangedTotal(Number.isFinite(total) ? total : null);
        try {
          await readPriceDetails(controller);
        } catch (detailCause) {
          if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
          setDetailsError(errorCode(detailCause));
        }
      }
    } finally {
      if (request.current === controller && !navigating) {
        request.current = null;
        setBusy(false);
      }
    }
  }, [quoteId, locale, router, readPriceDetails, userId]);

  const checkExistingOrder = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    let navigating = false;
    setBusy(true);
    setResumeRequired(true);
    setResumeChecked(false);
    setError("");
    try {
      const result = await api<{ orders: Order[] }>("/api/v1/orders", { signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      const existing = result.orders.find((item) => item.quote.id === quoteId);
      if (existing) {
        deletePrivateDraft(userId, `order-create:${quoteId}`);
        navigating = true;
        router.replace(`/${locale}/checkout/${existing.id}`);
      } else {
        setResumeChecked(true);
      }
    } catch (cause) {
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      setError(errorCode(cause));
    } finally {
      if (request.current === controller && !navigating) {
        request.current = null;
        setBusy(false);
      }
    }
  }, [quoteId, userId, locale, router]);

  useEffect(() => {
    // Defer the mutation until the mounted effect survives Strict Mode cleanup.
    const timer = setTimeout(() => {
      if (getPrivateDraft<boolean>(userId, `order-create:${quoteId}`)) void checkExistingOrder();
      else void create();
    }, 0);
    return () => {
      clearTimeout(timer);
      request.current?.abort();
      request.current = null;
    };
  }, [create, checkExistingOrder, userId, quoteId]);

  async function retryPriceDetails() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setDetailsBusy(true);
    try {
      await readPriceDetails(controller);
    } catch (cause) {
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      setDetailsError(errorCode(cause));
    } finally {
      if (request.current === controller) {
        request.current = null;
        setDetailsBusy(false);
      }
    }
  }

  if (busy) return <Loading />;
  if (resumeRequired) return (
    <div className="account-narrow checkout-standalone">
      <div className="panel account-state checkout-state">
        <h1>{design("resumePurchase")}</h1>
        <p>{design(resumeChecked ? "resumeReady" : "resumeCheck")}</p>
        {error && <ErrorNotice code={error} />}
        <button className="button" onClick={() => void (resumeChecked ? create() : checkExistingOrder())}>
          {resumeChecked ? t("continue") : t("checkStatus")}<ArrowRight size={18} />
        </button>
        <Link className="button button-secondary" href={`/${locale}/quotes/${sessionId}`}>{t("backToQuotes")}</Link>
      </div>
    </div>
  );
  if (error === "QUOTE_EXPIRED") return (
    <div className="account-narrow panel checkout-standalone">
      <ExpiredQuoteRecovery sessionId={sessionId} />
    </div>
  );
  return (
    <div className="account-narrow checkout-standalone">
      <div className="panel account-state checkout-state">
        <div className="checkout-state-icon"><Clock3 size={28} aria-hidden="true" /></div>
        <h1>{t(error === "PRICE_CHANGED" ? "priceChanged" : "error")}</h1>
        {error === "PRICE_CHANGED" ? quote && changedTotal !== null ? (
          <>
            <div className="checkout-price-change">
              <div><span>{design("previousPrice")}</span><s><Money cents={quote.totalCents} /></s></div>
              <div><span>{design("updatedPrice")}</span><strong><Money cents={changedTotal} /></strong></div>
              <p>{t("total")}</p>
            </div>
            <button className="button" onClick={() => void create(true)}>
              {design("acceptPrice", { amount: money(changedTotal, locale) })}<ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <p role={detailsError ? "alert" : undefined}>{design("priceDetailsFailed")}</p>
            {detailsError && <ErrorNotice code={detailsError} />}
            <button className="button" disabled={detailsBusy} onClick={() => void (changedTotal === null ? create() : retryPriceDetails())}>
              {detailsBusy && <LoaderCircle className="spin" size={18} />}
              {design("retryPriceDetails")}
            </button>
          </>
        ) : <ErrorNotice code={error} />}
        <Link className="button button-secondary" href={`/${locale}/quotes/${sessionId}`}>{t("backToQuotes")}</Link>
        {error !== "PRICE_CHANGED" && <button className="button" onClick={() => void create()}>{t("retry")}</button>}
      </div>
    </div>
  );
}

export function OrderPage({ id }: { id: string }) {
  const locale = useLocale();
  return <AuthGate>{user => <OrderContent key={`${user.id}:${locale}:${id}`} id={id} user={user} />}</AuthGate>;
}
function OrderContent({ id, user }: { id: string; user: SessionUser }) {
  const t = useTranslations("account");
  const guest = useTranslations("guest");
  const design = useTranslations("checkoutDesign");
  const recovery = useTranslations("checkoutRecovery");
  const locale = useLocale();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [paymentUncertain, setPaymentUncertain] = useState(false);
  const consentInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const sessionEpoch = useRef(getPrivateSessionEpoch());
  const [expiryReached, setExpiryReached] = useState(false);
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setReceiptExpanded(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const stepPanel = useRef<HTMLDivElement>(null);
  const previousPhase = useRef<{ orderId: string; phase: string } | null>(null);
  const acceptConfirmedOrder = useCallback((current: Order) => {
    setOrder(current);
    setError("");
  }, []);
  const unpaidExpiry =
    order?.paymentStatus === "paid" ? null : order?.quote.expiresAt;
  useEffect(() => {
    if (!unpaidExpiry) {
      setExpiryReached(false);
      return;
    }
    const remaining = Date.parse(unpaidExpiry) - Date.now();
    setExpiryReached(remaining <= 0);
    if (remaining > 0) {
      const timer = setTimeout(() => setExpiryReached(true), remaining);
      return () => clearTimeout(timer);
    }
  }, [unpaidExpiry]);
  const load = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const current = await api<Order>(`/api/v1/orders/${id}`, { signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      setOrder(current);
      const hasTravelerDraft = getPrivateDraft<Traveler[]>(current.userId, `travelers:${id}`) !== undefined;
      const hasContactDraft = getPrivateDraft<string>(current.userId, `contact:${id}`) !== undefined;
      setEditing(current.paymentStatus !== "paid" && (hasTravelerDraft || hasContactDraft));
      setPaymentUncertain(false);
      setError("");
    } catch (cause) {
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      setError(errorCode(cause));
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }, [id]);

  const action = useCallback(async (name: "pay" | "reconcile", background = false) => {
    if (request.current || (name === "pay" && paymentUncertain)) return;
    const controller = new AbortController();
    request.current = controller;
    if (!background) setBusy(true);
    setError("");
    try {
      const current = await api<Order>(`/api/v1/orders/${id}/${name}`, {
        method: "POST",
        body: "{}",
        signal: controller.signal,
      });
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      setOrder(current);
      setPaymentUncertain(false);
    } catch (cause) {
      if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
      // A transport/server failure can hide a successful payment. Read this order;
      // never automatically repeat the payment or create another order.
      const uncertain = name === "pay" && (!(cause instanceof RequestError) || cause.status >= 500);
      if (uncertain) {
        setPaymentUncertain(true);
        try {
          const current = await api<Order>(`/api/v1/orders/${id}`, { signal: controller.signal });
          if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
          setOrder(current);
          setPaymentUncertain(false);
          setError(current.paymentStatus === "paid" ? "" : errorCode(cause));
        } catch (checkCause) {
          if (controller.signal.aborted || request.current !== controller || sessionEpoch.current !== getPrivateSessionEpoch()) return;
          setError(errorCode(checkCause));
        }
      } else {
        setError(errorCode(cause));
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (!background) setBusy(false);
      }
    }
  }, [id, paymentUncertain]);

  useEffect(() => {
    void load();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [load]);

  const pollingStatus = order?.status;
  useEffect(() => {
    if (!pollingStatus || !["issuance_pending", "bind_unknown"].includes(pollingStatus)) return;
    const timer = setInterval(() => void action("reconcile", true), 5000);
    return () => clearInterval(timer);
  }, [pollingStatus, action]);
  const expired = Boolean(
    order &&
      order.paymentStatus !== "paid" &&
      !busy &&
      (expiryReached || error === "QUOTE_EXPIRED"),
  );
  const details = order?.status === "awaiting_details" || editing;
  const pending = Boolean(
    order && ["issuance_pending", "bind_unknown"].includes(order.status),
  );
  const complete = order?.status === "issued";
  const visiblePhase = !order
    ? null
    : expired
      ? "expired"
      : complete
        ? "issued"
        : pending
          ? "issuing"
          : details
            ? "travelers"
            : "review";

  useEffect(() => {
    if (!order || !visiblePhase || busy) return;
    const previous = previousPhase.current;
    if (!previous || previous.orderId !== order.id) {
      // Expiry is initialized by an effect. Treat an already-expired first load
      // as its final phase, so that initialization does not move the user's focus.
      previousPhase.current = {
        orderId: order.id,
        phase:
          order.paymentStatus !== "paid" &&
          Date.parse(order.quote.expiresAt) <= Date.now()
            ? "expired"
            : visiblePhase,
      };
      return;
    }
    if (previous.phase === visiblePhase) return;
    previousPhase.current = { orderId: order.id, phase: visiblePhase };
    const heading = stepPanel.current?.querySelector<HTMLHeadingElement>("h1");
    if (!heading) return;
    // The active heading is a programmatic focus target, never an extra tab stop.
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: "instant", block: "start" });
  }, [busy, order, visiblePhase]);

  if (!order)
    return error ? (
      <div className="account-narrow">
        <ErrorNotice code={error} />
        <button className="button" onClick={() => void load()}>
          {t("retry")}
        </button>
      </div>
    ) : (
      <Loading />
    );
  const stage = complete ? 4 : pending ? 3 : details ? 1 : 2;
  return (
    <div className="account-page checkout-page">
      <div className="checkout-topbar">
        <Link className="account-back" href={`/${locale}/account`}>
          <ArrowLeft size={16} />{t("backToAccount")}
        </Link>
      </div>
      <FlowProgress flow="purchase" current={stage} complete={complete} />
      <TripSummary trip={order.trip} />
      <div className={`checkout-layout${expired ? " checkout-expired" : ""}`}>
        <aside className="checkout-summary" aria-label={design("selectedPlan")}>
          <div className="checkout-summary-overview">
            <div className="checkout-plan-identity"><InsuranceIllustration name="travel" thumbnail className="checkout-plan-art" />
              <h2>{t(`plan_${order.quote.plan}`)}</h2>
              <p className="checkout-provider">{order.quote.provider.split(" · ")[0]}</p>
              <p>{design("travelerCount", { count: order.trip.travelers.length })}</p>
            </div>
            <div className="checkout-total">
              <span>{expired ? recovery("previousTotal") : order.paymentStatus === "paid" ? design("totalPaid") : t("total")}</span>
              <strong><Money cents={order.quote.totalCents} /></strong>
              <span>{t("perTrip")}</span>
            </div>
          </div>
          <details className="checkout-receipt-details" open={receiptExpanded} onToggle={(event) => setReceiptExpanded(event.currentTarget.open)}>
            <summary>{design("receiptDetails")}<ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="checkout-receipt-cover">
              {order.quote.coverage.filter(item => item.key === "medical" || item.key === "baggage").map(item => <QuoteBenefit key={item.key} coverage={item} />)}
              <PlanDetails quote={order.quote} />
            </div>
            <dl className="checkout-summary-meta">
              <div><dt>{t("orderReference")}</dt><dd className="reference-text">{order.id.slice(0, 12).toUpperCase()}</dd></div>
            </dl>
          </details>
          <p className="checkout-summary-demo">{t("demo")}</p>
        </aside>
        <section className="checkout-main">
          {error && !expired && <ErrorNotice code={error} />}
          <div className="checkout-panel" ref={stepPanel}>
            {expired ? (
              <ExpiredQuoteRecovery
                orderId={id}
                onOrder={acceptConfirmedOrder}
              />
            ) : complete ? (
              <div className="account-state checkout-state">
                <div className="account-success-mark">
                  <CircleCheck size={36} />
                </div>
                <p className="eyebrow">{t("status_issued")}</p>
                <h1>{t("issuedTitle")}</h1>
                <p>{t("issuedText")}</p>
                <div className="account-notice">{t("policyDemo")}</div>
                {order.policyId && (
                  <Link
                    className="button"
                    href={`/${locale}/account/policies/${order.policyId}`}
                  >
                    {t("viewPolicy")}
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            ) : pending ? (
              <div className="account-state checkout-state">
                <div className="account-pending-mark">
                  <Clock3 size={32} />
                </div>
                <p className="eyebrow">{t("paymentReceived")}</p>
                <h1>
                  {t(
                    order.status === "bind_unknown"
                      ? "unknownTitle"
                      : "issuingTitle",
                  )}
                </h1>
                <p>
                  {t(
                    order.status === "bind_unknown"
                      ? "unknownText"
                      : "issuingText",
                  )}
                </p>
                <div className="issuance-progress">
                  <div>
                    <Check size={18} />
                    <span>{t("paymentStage")}</span>
                    <strong>{t("completed")}</strong>
                  </div>
                  <div>
                    <LoaderCircle size={18} className="spin" />
                    <span>{t("policyStage")}</span>
                    <strong>{t("waiting")}</strong>
                  </div>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => void action("reconcile")}
                  disabled={busy}
                >
                  {busy ? <LoaderCircle className="spin" size={18} /> : null}
                  {t("checkStatus")}
                </button>
                <Link className="account-text-link" href={`/${locale}/account`}>
                  {t("viewWallet")}
                </Link>
              </div>
            ) : details ? (
              <TravelerForm
                order={order}
                requireContact={!!user.isGuest}
                onSave={(updated) => {
                  setOrder(updated);
                  setEditing(false);
                  setConsent(false);
                }}
                onCancel={order.status !== "awaiting_details" ? () => setEditing(false) : undefined}
              />
            ) : (
              <form className="checkout-review-form" noValidate onSubmit={(event) => {
                event.preventDefault();
                if (busy || paymentUncertain) return;
                if (!consent) {
                  setConsentError(true);
                  consentInput.current?.focus();
                  return;
                }
                void action("pay");
              }}>
                <header className="checkout-section-heading">
                  <h1>{design("reviewTitle")}</h1>
                  <p className="account-lead">{t("payIntro")}</p>
                </header>
                {order.status === "payment_declined" && (
                  <div
                    className="account-notice account-notice-error"
                    role="alert"
                  >
                    {t("paymentDeclined")}
                  </div>
                )}
                <div className="account-review-travelers">
                  {order.contactEmail && <p className="checkout-contact-review"><span className="muted">{guest("email")}</span><strong>{order.contactEmail}</strong></p>}
                  <div className="account-section-heading">
                    <h2>{t("insured")}</h2>
                    <button
                      type="button"
                      className="account-text-link"
                      disabled={busy}
                      onClick={() => setEditing(true)}
                    >
                      {t("editTravelers")}
                    </button>
                  </div>
                  {order.travelers.map((person, i) => (
                    <div key={i} className="checkout-traveler-review">
                      <strong>
                        {person.firstName} {person.lastName}
                      </strong>
                      <time className="muted" dateTime={person.dateOfBirth}>
                        {localDate(person.dateOfBirth, locale)}
                      </time>
                    </div>
                  ))}
                </div>
                <section className="checkout-coverage-section" aria-label={design("coverageReview")}>
                  <h2 className="sr-only">{design("coverageReview")}</h2>
                  <CoverageSummary quote={order.quote} />
                </section>
                <div className="checkout-payment-method">
                  <h2>{design("simulatedPayment")}</h2>
                  <p>{t("demoPayment")}</p>
                </div>
                <label className="account-consent">
                  <input
                    ref={consentInput}
                    type="checkbox"
                    required
                    checked={consent}
                    disabled={busy}
                    aria-invalid={consentError || undefined}
                    aria-describedby={consentError ? "checkout-consent-error" : undefined}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setConsentError(false);
                    }}
                  />
                  <span>{t("consent")}<FieldRequirement /></span>
                </label>
                {consentError && <p className="checkout-consent-error" id="checkout-consent-error" role="alert"><CircleAlert size={18} aria-hidden="true" />{design("consentRequired")}</p>}
                {paymentUncertain && <div className="account-notice checkout-payment-check" role="status">
                  <p>{design("paymentCheckRequired")}</p>
                  <button type="button" className="button button-secondary" disabled={busy} onClick={() => void load()}>
                    {busy && <LoaderCircle size={18} className="spin" />}{t("checkStatus")}
                  </button>
                </div>}
                <div className="checkout-pay-action">
                  <div><span>{t("total")}</span><strong><Money cents={order.quote.totalCents} /></strong></div>
                  <button className="button" disabled={busy || paymentUncertain}>
                    {busy ? <LoaderCircle size={18} className="spin" /> : null}
                    {t("pay", { amount: money(order.quote.totalCents, locale) })}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>
          {(pending || complete) && (
            <div className="checkout-activity">
              <Timeline events={order.events} />
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

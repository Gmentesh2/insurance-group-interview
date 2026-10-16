"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Clock3, LoaderCircle } from "lucide-react";
import { api } from "@/lib/client";
import type { Order, QuoteSession, TripInput } from "@/lib/contracts";
import { getPrivateSessionEpoch } from "@/lib/private-drafts";
import { saveTripDraft } from "@/lib/trip-draft";
import { ErrorNotice, Loading, errorCode } from "./account-shared";

type RecoverySource =
  | { orderId: string; onOrder: (order: Order) => void; sessionId?: never }
  | { orderId?: never; onOrder?: never; sessionId: string };

/** Always check payment before replacing an expired order; a new quote needs a new selection. */
export function ExpiredQuoteRecovery({ orderId, onOrder, sessionId }: RecoverySource) {
  const t = useTranslations("checkoutRecovery");
  const locale = useLocale();
  const router = useRouter();
  const [working, setWorking] = useState<"refresh" | "edit" | null>(null);
  const [error, setError] = useState("");
  const [confirmedTrip, setConfirmedTrip] = useState<TripInput | null>(null);
  const [checkError, setCheckError] = useState("");
  const verification = useRef<{ controller: AbortController; promise: Promise<TripInput | null> } | null>(null);
  const recovery = useRef<AbortController | null>(null);

  const confirmOrder = useCallback((): Promise<TripInput | null> => {
    if (!orderId || !onOrder) return Promise.resolve(null);
    if (verification.current) return verification.current.promise;
    const controller = new AbortController();
    const epoch = getPrivateSessionEpoch();
    const current = () => !controller.signal.aborted && verification.current?.controller === controller && epoch === getPrivateSessionEpoch();
    setConfirmedTrip(null);
    setCheckError("");
    setError("");
    const promise = api<Order>(`/api/v1/orders/${orderId}`, { signal: controller.signal })
      .then((order) => {
        if (!current()) return null;
        if (order.paymentStatus === "paid") {
          onOrder(order);
          return null;
        }
        setConfirmedTrip(order.trip);
        return order.trip;
      })
      .catch((cause) => {
        if (!current()) return null;
        setCheckError(errorCode(cause));
        throw cause;
      })
      .finally(() => {
        if (verification.current?.controller === controller) verification.current = null;
      });
    verification.current = { controller, promise };
    return promise;
  }, [orderId, onOrder]);

  useEffect(() => {
    if (orderId) void confirmOrder().catch(() => {});
    return () => {
      verification.current?.controller.abort();
      verification.current = null;
      recovery.current?.abort();
      recovery.current = null;
    };
  }, [orderId, sessionId, locale, confirmOrder]);

  async function recover(action: "refresh" | "edit") {
    if (recovery.current) return;
    const controller = new AbortController();
    const epoch = getPrivateSessionEpoch();
    recovery.current = controller;
    const current = () => !controller.signal.aborted && recovery.current === controller && epoch === getPrivateSessionEpoch();
    let navigating = false;
    setWorking(action);
    setError("");
    try {
      const original = orderId
        ? await confirmOrder()
        : (await api<QuoteSession>(`/api/v1/quote-sessions/${sessionId}`, { signal: controller.signal })).trip;
      if (!current() || !original) return;
      const refreshedTrip: TripInput = {
        ...original,
        scenario: original.scenario === "quote_expired" ? "success" : original.scenario,
      };
      saveTripDraft(refreshedTrip);
      if (action === "edit") {
        navigating = true;
        router.push(`/${locale}?product=travel#quote`);
        return;
      }
      const session = await api<QuoteSession>("/api/v1/quotes", {
        method: "POST",
        body: JSON.stringify(refreshedTrip),
        signal: controller.signal,
      });
      if (!current()) return;
      navigating = true;
      router.push(`/${locale}/quotes/${session.id}`);
    } catch (cause) {
      if (current()) setError(errorCode(cause));
    } finally {
      if (current() && !navigating) {
        recovery.current = null;
        setWorking(null);
      }
    }
  }

  if (orderId && !confirmedTrip) return (
    <div className="account-state checkout-state">
      <div className="checkout-state-icon"><Clock3 size={28} aria-hidden="true" /></div>
      <h1>{t("checkingTitle")}</h1>
      <p>{t(checkError ? "checkingFailed" : "checkingDescription")}</p>
      {checkError ? <>
        <ErrorNotice code={checkError} />
        <button className="button" onClick={() => void confirmOrder().catch(() => {})}>{t("checkAgain")}</button>
      </> : <Loading />}
    </div>
  );

  return (
    <div className="account-state checkout-state">
      <div className="checkout-state-icon"><Clock3 size={28} aria-hidden="true" /></div>
      <h1>{t("expiredLabel")}</h1>
      <p>{t("expiredDescription")}</p>
      <div className="account-notice">{t("expiredUnpaid")}</div>
      {error && <ErrorNotice code={error} />}
      <div className="checkout-actions">
        <button className="button" disabled={working !== null} onClick={() => void recover("refresh")}>
          {working === "refresh" ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}
          {t("refreshQuotes")}
        </button>
        <button className="button button-secondary" disabled={working !== null} onClick={() => void recover("edit")}>
          {working === "edit" && <LoaderCircle size={18} className="spin" />}{t("editTrip")}
        </button>
      </div>
    </div>
  );
}

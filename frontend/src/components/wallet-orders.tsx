"use client";
import { Money } from "./money";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Clock3 } from "lucide-react";
import type { Order } from "@/lib/contracts";
import { countryName } from "@/lib/countries";
import { CountryFlag } from "./country-flag";
import { localDate, StatusBadge } from "./account-shared";
import { ProductIcon } from "./product-icon";

function isAwaitingConfirmation(order: Order) {
  return order.status !== "issued" && (
    order.paymentStatus === "paid" ||
    order.status === "issuance_pending" ||
    order.status === "bind_unknown"
  );
}

/** A pending purchase takes the place of the wallet's first-purchase empty state. */
export function hasPendingWalletOrders(orders: Order[]) {
  return orders.some(isAwaitingConfirmation);
}

export function WalletOrders({ orders }: { orders: Order[] }) {
  const t = useTranslations("walletDesign");
  const pending = orders.filter(isAwaitingConfirmation);
  const drafts = orders.filter(order => order.status !== "issued" && !isAwaitingConfirmation(order));

  if (!pending.length && !drafts.length) return null;

  return <div className="wallet-orders">
    {pending.length > 0 && <section className="wallet-confirmation" aria-labelledby="wallet-confirmation-title">
      <div className="wallet-confirmation-heading">
        <span className="wallet-confirmation-icon" aria-hidden="true"><ProductIcon name="policies" size={28} /></span>
        <div><h2 id="wallet-confirmation-title">{t("confirmationTitle")}</h2><p>{t("confirmationDescription")}</p></div>
        <span className="wallet-order-count">{pending.length}</span>
      </div>
      {pending.map(order => <WalletOrder key={order.id} order={order} pending />)}
    </section>}
    {drafts.length > 0 && <details className="wallet-purchase-drafts">
      <summary><span>{t("purchaseDrafts")}</span><span className="wallet-order-count">{drafts.length}</span></summary>
      {drafts.map(order => <WalletOrder key={order.id} order={order} />)}
    </details>}
  </div>;
}

function WalletOrder({ order, pending = false }: { order: Order; pending?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("walletDesign");
  const account = useTranslations("account");
  const paid = order.paymentStatus === "paid";
  const PaymentIcon = paid ? Check : Clock3;

  return <article className="wallet-purchase-row">
    <div className="wallet-purchase-main">
      <div className="wallet-purchase-trip">
        <h3>{order.trip.destinationCountries.map(code => <span key={code}><CountryFlag code={code} size="small" />{countryName(code, locale)}</span>)}</h3>
        <p><time dateTime={order.trip.startDate}>{localDate(order.trip.startDate, locale)}</time> — <time dateTime={order.trip.endDate}>{localDate(order.trip.endDate, locale)}</time></p>
        <span>{account(`plan_${order.quote.plan}`)} · {t("orderReference", { reference: order.id.slice(0, 8).toUpperCase() })}</span>
      </div>
      <div className="wallet-purchase-total"><span>{t(paid ? "amountPaid" : "orderTotal")}</span><strong><Money cents={order.quote.totalCents} /></strong></div>
    </div>
    {pending ? <>
      <div className="wallet-purchase-stages">
        <span className={paid ? "wallet-payment-confirmed" : ""}><PaymentIcon size={16} aria-hidden="true" />{t(paid ? "paymentConfirmed" : "paymentUnconfirmed")}</span>
        <span><Clock3 size={16} aria-hidden="true" />{t(order.status === "bind_unknown" ? "issuanceUnconfirmed" : "policyNotIssued")}</span>
      </div>
      <p className="wallet-purchase-explanation">{t(paid ? "paidAwaitingPolicy" : "awaitingPaymentConfirmation")}</p>
    </> : <StatusBadge status={order.status} />}
    <Link className={`button ${pending ? "" : "button-secondary"}`} href={`/${locale}/checkout/${order.id}`}>
      {account(pending ? "checkStatus" : "continueOrder")}<ArrowRight size={16} aria-hidden="true" />
    </Link>
  </article>;
}

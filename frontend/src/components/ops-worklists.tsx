"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, FileSearch, LoaderCircle, RefreshCw } from "lucide-react";
import type { Claim, Order } from "@/lib/contracts";
import { destinationNames } from "@/lib/countries";
import { localDate, money, StatusBadge, Timeline } from "./account-shared";
import { ClaimRecord } from "./ops-claim-record";

export type OperationsAction = (
  id: string,
  body: Record<string, string>,
) => Promise<void>;
export const needsRecovery = (order: Order) =>
  order.status === "issuance_pending" || order.status === "bind_unknown";
export const needsReview = (claim: Claim) =>
  claim.status === "submitted" || claim.status === "under_review";

type FilterOption = { value: string; label: string; count: number };
function WorklistFilters({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="operations-filters" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          <span>{option.count}</span>
        </button>
      ))}
    </div>
  );
}
function EmptyWorklist({
  type,
  reset,
}: {
  type: "orders" | "claims";
  reset: () => void;
}) {
  const d = useTranslations("operationsDesign");
  return (
    <div className="operations-empty">
      <FileSearch size={28} aria-hidden="true" />
      <h3>{d(type === "orders" ? "noOrders" : "noClaims")}</h3>
      <p>{d("emptyHint")}</p>
      <button type="button" className="button button-secondary" onClick={reset}>
        {d("resetFilters")}
      </button>
    </div>
  );
}

export function OrderWorklist({
  orders,
  busy,
  action,
  resetSearch,
}: {
  orders: Order[];
  busy: string;
  action: OperationsAction;
  resetSearch: () => void;
}) {
  const t = useTranslations("account");
  const d = useTranslations("operationsDesign");
  const locale = useLocale();
  const [filter, setFilter] = useState("all");
  const visible = orders.filter(
    (order) =>
      filter === "all" ||
      (filter === "recovery"
        ? needsRecovery(order)
        : order.status === "issued"),
  );
  return (
    <section
      className="operations-worklist"
      aria-labelledby="operations-orders-title"
    >
      <div className="operations-section-heading">
        <div>
          <h2 id="operations-orders-title">{t("orders")}</h2>
          <p>{d("ordersIntro")}</p>
        </div>
        <span className="operations-count">{orders.length}</span>
      </div>
      <WorklistFilters
        label={d("orderFilters")}
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: d("all"), count: orders.length },
          {
            value: "recovery",
            label: d("recovery"),
            count: orders.filter(needsRecovery).length,
          },
          {
            value: "issued",
            label: d("issued"),
            count: orders.filter((order) => order.status === "issued").length,
          },
        ]}
      />
      <div className="operations-records">
        {visible.map((order) => (
          <article key={order.id} className="operations-record">
            <div className="operations-order-main">
              <div className="operations-record-title">
                <p className="operations-reference">
                  {order.id.slice(0, 12).toUpperCase()}
                </p>
                <h3>
                  {destinationNames(order.trip.destinationCountries, locale)}
                </h3>
                <p>
                  {t(`plan_${order.quote.plan}`)}{" "}
                  <span aria-hidden="true">·</span>{" "}
                  {localDate(order.createdAt, locale)}
                </p>
              </div>
              <dl className="operations-stages">
                <div>
                  <dt>{t("paymentStage")}</dt>
                  <dd>
                    <StatusBadge status={order.paymentStatus} />
                  </dd>
                </div>
                <div>
                  <dt>{t("policyStage")}</dt>
                  <dd>
                    <StatusBadge status={order.status} />
                  </dd>
                </div>
              </dl>
              <div className="operations-order-total">
                <span>{t("total")}</span>
                <strong>{money(order.quote.totalCents, locale)}</strong>
              </div>
            </div>
            <div className="operations-record-bottom">
              <details className="operations-record-detail">
                <summary>
                  {d("history")}
                  <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <div className="operations-record-detail-body">
                  <dl className="operations-detail-facts">
                    <div>
                      <dt>{t("orderReference")}</dt>
                      <dd className="operations-full-reference">{order.id}</dd>
                    </div>
                    <div>
                      <dt>{d("tripDates")}</dt>
                      <dd>
                        {localDate(order.trip.startDate, locale)} –{" "}
                        {localDate(order.trip.endDate, locale)}
                      </dd>
                    </div>
                  </dl>
                  <Timeline events={order.events} />
                </div>
              </details>
              {needsRecovery(order) ? (
                <div className="operations-recovery">
                  <p>{d("recoverHint")}</p>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={!!busy}
                    onClick={() =>
                      void action(order.id, {
                        action: "reconcile",
                        orderId: order.id,
                      })
                    }
                  >
                    {busy === order.id ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : (
                      <RefreshCw size={17} />
                    )}
                    {t("reconcile")}
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {!visible.length && (
          <EmptyWorklist
            type="orders"
            reset={() => {
              setFilter("all");
              resetSearch();
            }}
          />
        )}
      </div>
    </section>
  );
}

export function ClaimWorklist({
  claims,
  busy,
  action,
  resetSearch,
}: {
  claims: Claim[];
  busy: string;
  action: OperationsAction;
  resetSearch: () => void;
}) {
  const t = useTranslations("account");
  const d = useTranslations("operationsDesign");
  const [filter, setFilter] = useState("all");
  const matches = (claim: Claim, value: string) =>
    value === "all" ||
    (value === "review"
      ? needsReview(claim)
      : value === "waiting"
        ? claim.status === "more_information"
        : value === "drafts"
          ? claim.status === "draft"
          : claim.status === "approved" || claim.status === "declined");
  const visible = claims.filter((claim) => matches(claim, filter));
  return (
    <section
      className="operations-worklist"
      aria-labelledby="operations-claims-title"
    >
      <div className="operations-section-heading">
        <div>
          <h2 id="operations-claims-title">{t("claims")}</h2>
          <p>{d("claimsIntro")}</p>
        </div>
        <span className="operations-count">{claims.length}</span>
      </div>
      <WorklistFilters
        label={d("claimFilters")}
        value={filter}
        onChange={setFilter}
        options={["all", "review", "waiting", "drafts", "closed"].map(
          (value) => ({
            value,
            label: d(value),
            count: claims.filter((claim) => matches(claim, value)).length,
          }),
        )}
      />
      <div className="operations-claims-grid">
        {visible.map((claim) => (
          <ClaimRecord
            key={`${claim.id}-${claim.status}`}
            claim={claim}
            busy={busy}
            action={action}
          />
        ))}
      </div>
      {!visible.length && (
        <EmptyWorklist
          type="claims"
          reset={() => {
            setFilter("all");
            resetSearch();
          }}
        />
      )}
    </section>
  );
}

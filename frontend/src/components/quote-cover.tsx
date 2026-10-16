"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Minus, X } from "lucide-react";
import type { Coverage, Quote } from "@/lib/contracts";
import { Money } from "./money";

export function QuoteBenefit({
  coverage,
  expanded = false,
}: {
  coverage: Coverage;
  expanded?: boolean;
}) {
  const c = useTranslations("common"),
    policy = useTranslations("policyDesign");
  const Icon =
    coverage.status === "covered" || coverage.status === "conditional"
      ? Check
      : coverage.status === "unknown"
        ? CircleHelp
        : Minus;
  return (
    <div className={`benefit benefit-${coverage.status}`}>
      <Icon size={16} aria-hidden="true" />
      <div className="benefit-content">
        <span>{c(coverage.key)}</span>
        <strong>
          {coverage.status === "excluded" || coverage.status === "unknown"
            ? c(coverage.status)
            : coverage.limitCents === null
              ? policy("included")
              : <Money cents={coverage.limitCents} />}
        </strong>
        {coverage.status !== "excluded" && coverage.status !== "unknown" && <>
          <small>{c(coverage.scope)}</small>
          <small>{policy("excess")}: <Money cents={coverage.deductibleCents} /></small>
        </>}
        {!expanded && coverage.status === "conditional" && coverage.condition && (
          <details className="benefit-condition">
            <summary aria-label={`${c(coverage.key)}: ${c("conditional")}`}>{c("conditional")}<ChevronDown size={14} aria-hidden="true" /></summary>
            <p>{c(coverage.condition)}</p>
          </details>
        )}
        {coverage.status === "conditional" && (expanded || !coverage.condition) && <small>{c("conditional")}</small>}
        {expanded && coverage.status !== "excluded" && coverage.status !== "unknown" && (
          <>
            {coverage.limitCents === null && <small>{policy("noLimit")}</small>}
            {coverage.condition && <small>{c(coverage.condition)}</small>}
          </>
        )}
      </div>
    </div>
  );
}
export function PlanDetails({ quote }: { quote: Quote }) {
  const p = useTranslations("plans"),
    c = useTranslations("common");
  return (
    <Dialog.Root>
      <Dialog.Trigger className="plan-details-trigger" aria-label={`${p("terms")} · ${c(quote.plan)} · ${quote.provider.split(" · ")[0]}`}>
        {p("terms")}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog-popup details-dialog">
          <Dialog.Close
            className="icon-button dialog-close"
            aria-label={c("close")}
          >
            <X size={20} aria-hidden="true" />
          </Dialog.Close>
          <p className="plan-details-identity">
            {c(quote.plan)} / {quote.provider.split(" · ")[0]}
          </p>
          <Dialog.Title className="dialog-title">
            {p("terms")}
          </Dialog.Title>
          <Dialog.Description className="muted">
            {p("demoTerms")}
          </Dialog.Description>
          <div className="expanded-benefits">
            {quote.coverage.map((item) => (
              <QuoteBenefit key={item.key} coverage={item} expanded />
            ))}
          </div>
          <h3>{p("exclusions")}</h3>
          <ul className="terms-exclusions">
            {quote.exclusions.map((item) => (
              <li key={item}>{c(item)}</li>
            ))}
          </ul>
          <p className="small muted">{quote.termsVersion}</p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

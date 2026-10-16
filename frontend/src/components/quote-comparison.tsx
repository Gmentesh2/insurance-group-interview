"use client";
import { Money } from "./money";
import { CurrencySettlementNote } from "./currency-provider";

import { FlowProgress } from "./flow-progress";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { Quote, TripInput } from "@/lib/contracts";
import { comparisonBenefits, exclusionsDiffer } from "@/lib/quote-comparison";
import { TripSummary } from "./trip-summary";
import { ProductIcon } from "./product-icon";

/** A full customer task, with native page scrolling and persistent public selection. */
export function QuoteComparison({ quotes, sessionId, trip }: { quotes: Quote[]; sessionId: string; trip: TripInput }) {
  const p = useTranslations("plans"), c = useTranslations("common"), design = useTranslations("quoteDesign"), policy = useTranslations("policyDesign");
  const locale = useLocale(), router = useRouter(), params = useSearchParams();
  const differences = params.get("differences") === "1";
  const rows = comparisonBenefits(quotes, differences);
  const showExclusions = !differences || exclusionsDiffer(quotes);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const base = `/${locale}/quotes/${sessionId}`;
  const selected = quotes.map(quote => quote.id).join(",");
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  function toggleDifferences(checked: boolean) {
    const query = new URLSearchParams(params.toString());
    if (checked) query.set("differences", "1"); else query.delete("differences");
    router.replace(`${base}?${query}`, { scroll: false });
  }
  return <div className="container comparison-screen">
    <Link className="back-link comparison-back" href={`${base}?selected=${encodeURIComponent(selected)}`}><ArrowLeft size={18} aria-hidden="true" />{design("allPlans")}</Link>
    <FlowProgress flow="quote" current={1} />
    <header className="comparison-intro"><div><h1 ref={heading} tabIndex={-1}>{design("compareTitle")}</h1><p>{design("resultsIntro")}</p></div><label className="comparison-difference-control"><input type="checkbox" checked={differences} onChange={event => toggleDifferences(event.target.checked)} />{p("differences")}</label></header>
    <TripSummary trip={trip} editHref={`/${locale}?product=travel#quote`} />
    <CurrencySettlementNote />
    <div className="comparison-surface">
      <table className="comparison-matrix" role="table" style={{ "--plan-count": quotes.length } as React.CSSProperties}>
        <caption className="sr-only">{design("compareTitle")}</caption>
        <thead role="rowgroup"><tr role="row"><th scope="col" className="comparison-label-header">{design("benefitLabel")}</th>{quotes.map(quote => <th scope="col" role="columnheader" id={`${id}-${quote.id}`} key={quote.id}>
          <div className="comparison-plan"><h2>{c(quote.plan)}</h2><strong><Money cents={quote.totalCents} displayCurrency /></strong><span>{design("totalForTravelers", { count: trip.travelers.length })}</span><Link className="button button-secondary" href={`/${locale}/checkout?quoteId=${quote.id}&sessionId=${sessionId}`}>{p("select", { plan: c(quote.plan) })}</Link></div>
        </th>)}</tr></thead>
        <tbody role="rowgroup">
          <tr role="row"><th scope="row" role="rowheader" id={`${id}-provider`}>{c("provider")}</th>{quotes.map(quote => <td role="cell" headers={`${id}-provider ${id}-${quote.id}`} key={quote.id}>{quote.provider.split(" · ")[0]}</td>)}</tr>
          {rows.map(key => <tr role="row" key={key}><th scope="row" role="rowheader" id={`${id}-${key}`}><span className="comparison-benefit-name"><ProductIcon name={key} size={24} />{c(key)}</span></th>{quotes.map(quote => {
            const benefit = quote.coverage.find(item => item.key === key);
            const applicable = benefit && (benefit.status === "covered" || benefit.status === "conditional");
            return <td role="cell" headers={`${id}-${key} ${id}-${quote.id}`} key={quote.id}><div className="comparison-value">
              <strong>{!benefit ? c("unknown") : !applicable ? c(benefit.status) : benefit.limitCents === null ? policy("included") : <Money cents={benefit.limitCents} />}</strong>
              {applicable && <><span>{c(benefit.scope)}</span><small>{p("deductible")}: <Money cents={benefit.deductibleCents} /></small>{benefit.limitCents === null && <small>{policy("noLimit")}</small>}
                {benefit.status === "conditional" ? benefit.condition ? <details className="comparison-condition"><summary aria-label={`${c(quote.plan)} · ${c(key)}: ${c("conditional")}`}>{c("conditional")}<ChevronDown size={14} aria-hidden="true" /></summary><p>{c(benefit.condition)}</p></details> : <span>{c("conditional")}</span> : <span className="comparison-covered">{c("covered")}</span>}</>}
            </div></td>;
          })}</tr>)}
          {showExclusions && <tr role="row"><th scope="row" role="rowheader" id={`${id}-exclusions`}>{p("exclusions")}</th>{quotes.map(quote => <td role="cell" headers={`${id}-exclusions ${id}-${quote.id}`} key={quote.id}><ul className="comparison-exclusions">{quote.exclusions.map(key => <li key={key}>{c(key)}</li>)}</ul></td>)}</tr>}
          {differences && !rows.length && !showExclusions && <tr role="row"><td role="cell" colSpan={quotes.length + 1}><p role="status">{p("noDifferences")}</p></td></tr>}
        </tbody>
      </table>
    </div>
    <p className="comparison-demo-note">{p("demoTerms")}</p>
    <Link className="comparison-back back-link" href={`${base}?selected=${encodeURIComponent(selected)}`}><ArrowLeft size={18} aria-hidden="true" />{design("allPlans")}</Link>
  </div>;
}

"use client";
import { Money } from "./money";

import { useLocale, useTranslations } from "next-intl";
import { CircleHelp, Check, Minus } from "lucide-react";
import type { Policy } from "@/lib/contracts";
import { countryName } from "@/lib/countries";
import { localDate } from "./account-shared";
import { ProductIcon } from "./product-icon";

export function PolicyCoverage({ policy }: { policy: Policy }) {
  const t = useTranslations("policyDesign"), c = useTranslations("common"), a = useTranslations("account");
  const locale = useLocale();
  return <>
    <section className="policy-cover-widget" id="cover" aria-labelledby="policy-cover-title">
      <div className="policy-cover-heading"><h2 id="policy-cover-title">{t("title")}</h2><span>{c(policy.quote.plan)}</span></div>
      <p className="policy-cover-intro">{t("snapshot")}</p>
      <dl className="policy-benefits">
        {policy.quote.coverage.map(item => {
          const covered = item.status === "covered" || item.status === "conditional";
          const StatusIcon = item.status === "unknown" ? CircleHelp : covered ? Check : Minus;
          return <div className={`policy-benefit policy-benefit-${item.status}`} key={item.key}>
            <dt><span className="policy-benefit-icon"><ProductIcon name={item.key} size={28} /></span><span>{c(item.key)}<small><StatusIcon size={13} aria-hidden="true" />{c(item.status)}</small></span></dt>
            <dd>
              <strong>{covered ? item.limitCents === null ? t("included") : <Money cents={item.limitCents} /> : c(item.status)}</strong>
              {covered && <>
                <span>{c(item.scope)}</span>
                {item.limitCents === null && <small>{t("noLimit")}</small>}
                <small>{t("excess")}: <Money cents={item.deductibleCents} /></small>
                {item.condition && <small className="policy-condition">{t("conditions")}: {c.has(item.condition) ? c(item.condition) : c("unknown")}</small>}
              </>}
            </dd>
          </div>;
        })}
      </dl>
      <p className="policy-limits-help">{t("limitsHelp")}</p>
    </section>
    <section className="policy-terms-widget" id="conditions" aria-labelledby="policy-terms-title">
      <h2 id="policy-terms-title">{t("terms")}</h2>
      <h3>{t("exclusions")}</h3>
      <ul>{policy.quote.exclusions.map(key => <li key={key}>{c.has(key) ? c(key) : c("unknown")}</li>)}</ul>
      <p className="policy-terms-version">{a("termsVersion", { version: policy.quote.termsVersion })}</p>
      <p>{t("termsHelp")}</p>
      <h3>{t("details")}</h3>
      <dl className="policy-contract-details">
        <div><dt>{t("insurer")}</dt><dd>{policy.quote.provider.split(" · ")[0]}</dd></div>
        <div><dt>{t("residence")}</dt><dd>{countryName(policy.trip.residenceCountry, locale)}</dd></div>
        <div><dt>{t("period")}</dt><dd>{localDate(policy.trip.startDate, locale)} — {localDate(policy.trip.endDate, locale)}</dd></div>
        <div><dt>{t("currency")}</dt><dd>{policy.quote.currency}</dd></div>
        <div><dt>{t("purchased")}</dt><dd>{localDate(policy.createdAt.slice(0, 10), locale)}</dd></div>
      </dl>
    </section>
  </>;
}

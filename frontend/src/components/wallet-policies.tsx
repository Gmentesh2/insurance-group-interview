"use client";
import { InsuranceIllustration } from "@/components/insurance-illustration";
import { Money } from "./money";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Search, X } from "lucide-react";
import { ProductIcon } from "./product-icon";
import type { Policy } from "@/lib/contracts";
import { destinationNames } from "@/lib/countries";
import { localDate, StatusBadge } from "./account-shared";

const filters = ["all", "active", "upcoming", "expired"] as const;
type PolicyFilter = (typeof filters)[number];

export function WalletPolicies({ policies }: { policies: Policy[] }) {
  const t = useTranslations("walletDesign");
  const locale = useLocale();
  const [filter, setFilter] = useState<PolicyFilter>("all");
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase(locale);
  const visible = policies.filter(policy =>
    (filter === "all" || policy.status === filter) &&
    (!search || `${destinationNames(policy.trip.destinationCountries, locale)} ${policy.number}`.toLocaleLowerCase(locale).includes(search))
  );
  const featured = filter === "all" && !search
    ? visible.find(policy => policy.status === "active") ?? visible.find(policy => policy.status === "upcoming")
    : undefined;
  const remaining = visible.filter(policy => policy.id !== featured?.id);

  return <section className="wallet-policies" id="policies" aria-label={t("title")}>
    <div className="wallet-filter-bar">
      <div className="wallet-filters" role="group" aria-label={t("filterLabel")}>
        {filters.map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
          {t(value)}<span>{value === "all" ? policies.length : policies.filter(p => p.status === value).length}</span>
        </button>)}
      </div>
      <div className="wallet-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" aria-label={t("search")} placeholder={t("search")} value={query} onChange={event => setQuery(event.target.value)} />
        {query && <button type="button" className="icon-button" onClick={() => setQuery("")} aria-label={t("clearSearch")}><X size={16} /></button>}
      </div>
    </div>
    <p className="sr-only" role="status">{t("showing", { count: visible.length, total: policies.length })}</p>
    {featured && <LeadPolicy policy={featured} />}
    {remaining.length > 0 && <div className="wallet-trip-list">
      <h2 className={featured ? "wallet-list-heading" : "sr-only"}>{t(featured ? "otherTrips" : filter)}</h2>
      {remaining.map(policy => <PolicyRow key={policy.id} policy={policy} />)}
    </div>}
    {visible.length === 0 && <div className="wallet-no-results"><Search size={32} aria-hidden="true" /><h2>{t("noMatches")}</h2><p>{t("noMatchesText")}</p><button className="button button-secondary" onClick={() => { setQuery(""); setFilter("all"); }}>{t("reset")}</button></div>}
  </section>;
}

function LeadPolicy({ policy }: { policy: Policy }) {
  const t = useTranslations("account");
  const design = useTranslations("walletDesign");
  const c = useTranslations('common');
  const locale = useLocale();
  return <article className="wallet-lead-trip">
    <div className="wallet-lead-top"><span>{design(policy.status === "active" ? "currentTrip" : "nextTrip")}</span><StatusBadge status={policy.status} /></div>
    <div className="wallet-lead-body">
      <div><h2>{destinationNames(policy.trip.destinationCountries, locale)}</h2><p>{localDate(policy.trip.startDate, locale)} — {localDate(policy.trip.endDate, locale)}</p><span className="wallet-lead-plan"><small>{design('travelType')}</small>{t(`plan_${policy.quote.plan}`)}</span></div>
      <InsuranceIllustration name="travel" className="wallet-trip-art" />
    </div>
    <dl className="wallet-plan-facts">
      <div><dt>{design('insurer')}</dt><dd>{policy.quote.provider}</dd></div>
      <div><dt>{design('insured')}</dt><dd>{policy.travelers.length}</dd></div>
      <div><dt>{design('premium')}</dt><dd><Money cents={policy.quote.totalCents} /></dd></div>
    </dl>
    <WalletCoverHighlights policy={policy} />
    {policy.quote.exclusions.length > 0 && <p className="wallet-key-exclusions"><strong>{design('exclusions')}: </strong>{policy.quote.exclusions.map(key => c.has(key) ? c(key) : c('unknown')).join('; ')}. <Link href={`/${locale}/account/policies/${policy.id}#conditions`}>{design('conditions')}</Link></p>}
    <div className="wallet-lead-footer">
      <div className="wallet-lead-traveler"><strong>{policy.travelers.map(person => person.firstName).join(", ")}</strong><span>{policy.number} · {t("demo")}</span></div>
      <Link className="wallet-lead-open" href={`/${locale}/account/policies/${policy.id}`}>{t("viewPolicy")}<ArrowRight size={18} aria-hidden="true" /></Link>
    </div>
    <div className="wallet-lead-actions"><PolicyActions policy={policy} /></div>
  </article>;
}

function PolicyRow({ policy }: { policy: Policy }) {
  const t = useTranslations("account");
  const design = useTranslations("walletDesign");
  const workspace = useTranslations('workspaceDesign');
  const locale = useLocale();
  return <article className="wallet-trip-row">
    <div className="wallet-trip-information">
      <h3><Link href={`/${locale}/account/policies/${policy.id}`}>{destinationNames(policy.trip.destinationCountries, locale)}</Link></h3>
      <p>{localDate(policy.trip.startDate, locale)} — {localDate(policy.trip.endDate, locale)}</p>
      <span>{design('travelType')} · {t(`plan_${policy.quote.plan}`)} · {policy.number}</span>
      <p className="wallet-row-facts">{policy.quote.provider} · {workspace('insured', { count: policy.travelers.length })}</p>
    </div>
    <StatusBadge status={policy.status} />
    <div className="wallet-trip-actions"><PolicyActions policy={policy} /><Link className="wallet-row-open" href={`/${locale}/account/policies/${policy.id}`}>{t("viewPolicy")}<ArrowRight size={16} aria-hidden="true" /></Link></div>
  </article>;
}

/** Read the purchased snapshot; never infer benefits from a plan name. */
function WalletCoverHighlights({ policy }: { policy: Policy }) {
  const c = useTranslations('common'), t = useTranslations('policyDesign');
  return <dl className="wallet-cover-highlights" aria-label={t('title')}>
    {(['medical', 'baggage'] as const).map(key => {
      const benefit = policy.quote.coverage.find(item => item.key === key);
      const covered = benefit?.status === 'covered' || benefit?.status === 'conditional';
      return <div key={key}><dt><ProductIcon name={key} size={18} />{c(key)}</dt><dd>
        <strong>{!benefit ? c('unknown') : !covered ? c(benefit.status) : benefit.limitCents === null ? t('included') : <Money cents={benefit.limitCents} />}</strong>
        {covered && benefit && <><small>{c(benefit.scope)}</small>{benefit.limitCents === null && <small>{t('noLimit')}</small>}<small>{t('excess')}: <Money cents={benefit.deductibleCents} /></small>{benefit.status === 'conditional' && <small>{c('conditional')}{benefit.condition && <> · {c.has(benefit.condition) ? c(benefit.condition) : c('unknown')}</>}</small>}</>}
      </dd></div>;
    })}
  </dl>;
}

function PolicyActions({ policy }: { policy: Policy }) {
  const t = useTranslations("account");
  const locale = useLocale();
  return <>
    <Link href={`/${locale}/account/policies/${policy.id}#cover`}><ProductIcon name="cover" size={22} />{t('cover')}</Link>
    <Link href={`/${locale}/account/policies/${policy.id}#documents`}><ProductIcon name="documents" size={22} />{t("documents")}</Link>
    <Link href={`/${locale}/account/policies/${policy.id}#assistance`}><ProductIcon name="assistance" size={22} />{t("assistance")}</Link>
  </>;
}

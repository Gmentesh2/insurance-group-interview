"use client";
import { Money } from "./money";

import { CircleHelp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Claim } from "@/lib/contracts";
import { localDate } from "./account-shared";

/** Only saved server data belongs in the overview and submitted receipt. */
export function ClaimOverview({ claim }: { claim: Claim }) {
  const t = useTranslations("account");
  const s = useTranslations("supportDesign");
  const locale = useLocale();
  return (
    <dl className="claim-overview" aria-label={s("claimOverview")}>
      <div>
        <dt>{s("requestedAmount")}</dt>
        <dd>{claim.amountCents ? <Money cents={claim.amountCents} /> : s("notAdded")}</dd>
      </div>
      <div>
        <dt>{t("incidentDate")}</dt>
        <dd>{claim.incidentDate ? localDate(claim.incidentDate, locale) : s("notAdded")}</dd>
      </div>
      <div>
        <dt>{t("documents")}</dt>
        <dd>{s("attachmentCount", { count: claim.documents.length })}</dd>
      </div>
    </dl>
  );
}

export function ClaimNextStep({ claim }: { claim: Claim }) {
  const s = useTranslations("supportDesign");
  const latest = [...claim.events].reverse().find(event => event.status === claim.status);
  const note = latest?.note?.trim();
  return (
    <section className="claim-next-step">
      <CircleHelp size={24} aria-hidden="true" />
      <h2>{s("nextStep")}</h2>
      <p>{s(`next_${claim.status}`)}</p>
      {note && <div className="claim-operator-note"><strong>{s(claim.status === "more_information" ? "informationRequested" : "decisionNote")}</strong><p>{note}</p></div>}
    </section>
  );
}

export function ClaimReceipt({ claim, title }: { claim: Claim; title?: string }) {
  const t = useTranslations("account");
  const s = useTranslations("supportDesign");
  const locale = useLocale();
  return (
    <section className="claim-section claim-receipt">
      <div className="claim-section-heading"><span>01</span><h2>{title ?? s("savedDetails")}</h2></div>
      <dl>
        <div><dt>{t("incidentType")}</dt><dd>{t(`type_${claim.incidentType}`)}</dd></div>
        <div><dt>{t("incidentDate")}</dt><dd>{claim.incidentDate ? localDate(claim.incidentDate, locale) : s("notAdded")}</dd></div>
        <div className="claim-receipt-description"><dt>{t("description")}</dt><dd>{claim.description || s("notAdded")}</dd></div>
        <div><dt>{s("requestedAmount")}</dt><dd><Money cents={claim.amountCents} /></dd></div>
      </dl>
    </section>
  );
}

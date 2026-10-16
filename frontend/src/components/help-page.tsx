"use client";

import { InsuranceIllustration, PageIdentity } from "@/components/insurance-illustration";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, LockKeyhole } from "lucide-react";
import { ProductIcon } from "./product-icon";

export function HelpPage() {
  const t = useTranslations("help");
  const assistant = useTranslations("assistant");
  const s = useTranslations("supportDesign");
  const h = useTranslations("homepage");
  const locale = useLocale();
  return <div className="container page-space support-page">
    <header className="support-intro"><PageIdentity illustration="support"><h1>{s("helpTitle")}</h1><p>{s("helpDescription")}</p><Link className="support-assistant-link" href={`/${locale}/assistant`}>{assistant("action")}<ArrowRight size={17} aria-hidden="true"/></Link></PageIdentity></header>
    <div className="support-directory-layout">
      <section className="support-directory" aria-labelledby="support-task-title">
        <h2 id="support-task-title">{s("chooseTask")}</h2>
        <Link className="support-task-row" href={`/${locale}?product=travel#quote`}><InsuranceIllustration name="travel" thumbnail className="support-task-art" /><div><h3>{h("compareAction")}</h3><p>{s("quotesText")}</p></div><ArrowRight size={21} aria-hidden="true" /></Link>
        <Link className="support-task-row" href={`/${locale}/account`}><InsuranceIllustration name="travel" thumbnail className="support-task-art" /><div><h3>{t("policiesTitle")}</h3><p>{t("policiesText")}</p></div><ArrowRight size={21} aria-hidden="true" /></Link>
        <Link className="support-task-row" href={`/${locale}/account/documents`}><InsuranceIllustration name="documents" thumbnail className="support-task-art" /><div><h3>{s("findDocuments")}</h3><p>{s("documentsText")}</p></div><ArrowRight size={21} aria-hidden="true" /></Link>
        <Link className="support-task-row" href={`/${locale}/account/claims`}><InsuranceIllustration name="claims" thumbnail className="support-task-art" /><div><h3>{s("viewClaims")}</h3><p>{s("claimsText")}</p></div><ArrowRight size={21} aria-hidden="true" /></Link>
      </section>
      <section id="emergency" className="support-emergency"><ProductIcon name="assistance" size={30} /><h2>{t("emergencyTitle")}</h2><p>{t("emergencyText")}</p></section>
    </div>
    <section className="support-answers" aria-labelledby="support-answers-title">
      <div><h2 id="support-answers-title">{s("answers")}</h2><p>{s("answersIntro")}</p></div>
      <div className="support-accordion">
        {(["Products", "Guest"] as const).map(topic => <details key={topic}><summary>{h(`q${topic}`)}<ChevronDown size={20} aria-hidden="true" /></summary><p>{h(`a${topic}`)}</p></details>)}
        {(["Documents", "Claim", "Payment"] as const).map((topic) => <details key={topic}><summary>{s(`question${topic}`)}<ChevronDown size={20} aria-hidden="true" /></summary><p>{s(`answer${topic}`)}</p></details>)}
      </div>
    </section>
    <section id="privacy" className="support-privacy"><LockKeyhole size={22} aria-hidden="true" /><div><h2>{t("privacyTitle")}</h2><p>{t("privacyText")}</p></div><details><summary>{t("termsTitle")}<ChevronDown size={18} aria-hidden="true" /></summary><p>{t("termsText")}</p></details></section>
    <p className="support-demo-note"><strong>{s("demoLabel")}</strong> {s("demoText")}</p>
  </div>;
}

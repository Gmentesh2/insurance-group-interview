"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { ArrowRight, Compass, RefreshCw, Route } from "lucide-react";
import { CustomerWorkspace } from "./customer-workspace";

export function PageFeedback({ kind, onRetry }: { kind: "error" | "missing"; onRetry?: () => void }) {
  const t = useTranslations("platformDesign");
  const locale = useLocale();
  const Icon = kind === "error" ? Route : Compass;
  return <div className="container page-space platform-feedback">
    <div className="platform-feedback-art" aria-hidden="true"><Icon size={56} strokeWidth={1.2} /></div>
    <p className="eyebrow">{t(`${kind}Label`)}</p>
    <h1>{t(`${kind}Title`)}</h1>
    <p className="platform-feedback-description">{t(`${kind}Text`)}</p>
    <div className="platform-feedback-actions">
      {onRetry ? <button className="button" onClick={onRetry}><RefreshCw size={18} />{t("retry")}</button> : <Link className="button" href={`/${locale}`}>{t("home")}<ArrowRight size={18} /></Link>}
      <Link className="button button-secondary" href={`/${locale}/account`}>{t("wallet")}</Link>
    </div>
  </div>;
}

export function PageLoading() {
  const t = useTranslations("platformDesign");
  const path = usePathname();
  const locale = useLocale();
  const account = path.startsWith(`/${locale}/account`);
  const content = <div className={account ? "platform-loading workspace-loading" : "container page-space platform-loading"} role="status">
    <span className="sr-only">{t("loading")}</span>
    <div aria-hidden="true"><div className="skeleton-title" /><div className="skeleton-description" /><div className="skeleton-navigation" /><div className="skeleton-panels">{[0, 1, 2].map(key => <div key={key}><span /><span /><span /></div>)}</div></div>
  </div>;
  return account ? <CustomerWorkspace>{content}</CustomerWorkspace> : content;
}

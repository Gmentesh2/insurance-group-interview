"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Download } from "lucide-react";
import type { Policy } from "@/lib/contracts";
import { ErrorNotice } from "./account-shared";
import { DocumentLanguage, useDocumentLanguage } from "./document-language";
import { useCertificateDownload } from "./use-certificate-download";
import { Spinner } from "./ui";
import { ProductIcon } from "./product-icon";

export function PolicyDocuments({ policy, onRefresh }: { policy: Policy; onRefresh: () => Promise<void> }) {
  const t = useTranslations("account");
  const d = useTranslations("workspaceDesign");
  const locale = useLocale();
  const [language, setLanguage] = useDocumentLanguage(policy.userId);
  const { busy, downloaded, error, download } = useCertificateDownload(policy, language);
  return (
    <section className="panel account-panel policy-documents-panel" id="documents">
      <div className="account-feature-icon"><ProductIcon name="documents" /></div>
      <h2>{t("documents")}</h2>
      <p className="muted">{t("policyDemo")}</p>
      <DocumentLanguage value={language} onChange={setLanguage} />
      <p className="policy-document-hint">{d("languageHint")}</p>
      {policy.documentStatus === "pending" ? <>
        <div className="account-notice">{t("documentPending")}</div>
        <button className="button button-secondary account-full" type="button" onClick={() => void onRefresh()}>{t("refresh")}</button>
      </> : <button className="button account-full" type="button" onClick={() => void download()} disabled={busy} aria-busy={busy}>
        {busy ? <Spinner /> : <Download size={18} aria-hidden="true" />}
        {d(busy ? "downloading" : "download")} · {language.toUpperCase()}
      </button>}
      {error && <ErrorNotice code={error} />}
      {downloaded && <p className="policy-download-status" role="status"><Check size={16} aria-hidden="true" />{d("downloaded")}</p>}
      <Link className="policy-library-link" href={`/${locale}/account/documents`}>{d("library")}<ArrowRight size={16} aria-hidden="true" /></Link>
    </section>
  );
}

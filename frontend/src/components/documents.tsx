"use client";

import { InsuranceIllustration, PageIdentity } from "@/components/insurance-illustration";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight, Check, Clock3, Download, LockKeyhole, RefreshCw, Search,
} from "lucide-react";
import { api } from "@/lib/client";
import { destinationNames } from "@/lib/countries";
import { getPrivateDraft, setPrivateDraft } from "@/lib/private-drafts";
import type { Locale, Policy } from "@/lib/contracts";
import { CustomerWorkspace } from "./customer-workspace";
import { AuthGate, ErrorNotice, Loading, errorCode, localDate } from "./account-shared";
import { Button, Input, Spinner } from "./ui";
import { DocumentLanguage, useDocumentLanguage } from "./document-language";
import { useCertificateDownload } from "./use-certificate-download";
import { ProductIcon } from "./product-icon";

type DocumentFilter = "all" | Policy["documentStatus"];
type LibraryPreferences = { search: string; filter: DocumentFilter };

export function DocumentsPage() {
  return <AuthGate>{user => <DocumentLibrary userId={user.id} />}</AuthGate>;
}

function DocumentLibrary({ userId }: { userId: string }) {
  const t = useTranslations("workspaceDesign");
  const a = useTranslations("account");
  const locale = useLocale();
  const id = useId();
  const [policies, setPolicies] = useState<Policy[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [search, setSearch] = useState(() => getPrivateDraft<LibraryPreferences>(userId, "documents-preferences")?.search ?? "");
  const [filter, setFilter] = useState<DocumentFilter>(() => getPrivateDraft<LibraryPreferences>(userId, "documents-preferences")?.filter ?? "all");
  const [language, setLanguage] = useDocumentLanguage(userId);
  const request = useRef<AbortController | null>(null);
  useEffect(() => { setPrivateDraft(userId, "documents-preferences", { search, filter }); }, [userId, search, filter]);

  const load = useCallback(async (manual = false) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setRefreshing(true);
    setRefreshed(false);
    setError("");
    try {
      const data = await api<{ policies: Policy[] }>("/api/v1/policies", {
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setPolicies(data.policies);
        setRefreshed(manual);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorCode(cause));
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [load]);

  const query = search.trim().toLocaleLowerCase(locale);
  const matching = (policies ?? [])
    .filter((policy) => {
      const text = `${destinationNames(policy.trip.destinationCountries, locale)} ${policy.number}`;
      return (filter === "all" || policy.documentStatus === filter)
        && (!query || text.toLocaleLowerCase(locale).includes(query));
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const counts = {
    all: policies?.length ?? 0,
    ready: policies?.filter((policy) => policy.documentStatus === "ready").length ?? 0,
    pending: policies?.filter((policy) => policy.documentStatus === "pending").length ?? 0,
  };

  function clearFilters() {
    setSearch("");
    setFilter("all");
  }

  return (
    <CustomerWorkspace>
      <div className="account-page documents-workspace">
        <header className="documents-heading">
          <PageIdentity illustration="documents"><h1>{t("title")}</h1></PageIdentity>
          <span className="documents-private"><LockKeyhole size={14} aria-hidden="true" />{t("privateFiles")}</span>
        </header>
        {error && <div className="documents-load-error"><ErrorNotice code={error} /><Button variant="secondary" onClick={() => void load(true)} disabled={refreshing}>{a("retry")}</Button></div>}
        <p className="sr-only" role="status">{refreshed ? t("refreshed") : ""}</p>
        {!policies && !error && <Loading />}
        {policies && <section className="documents-library" aria-label={t("library")}>
          <div className="documents-toolbar">
            <label className="documents-search" htmlFor={`${id}-search`}>
              <span className="sr-only">{t("search")}</span><Search size={18} aria-hidden="true" />
              <Input id={`${id}-search`} type="search" placeholder={t("searchPlaceholder")} value={search} onChange={event => setSearch(event.target.value)} />
            </label>
            <DocumentLanguage value={language} onChange={setLanguage} />
            <button className="icon-button documents-refresh" type="button" onClick={() => void load(true)} disabled={refreshing} aria-label={t("refresh")}>
              <RefreshCw size={18} className={refreshing ? "spin" : undefined} aria-hidden="true" />
            </button>
          </div>
          <div className="documents-filter-row">
            <div className="documents-filters" role="group" aria-label={t("documentFilter")}>
              {(["all", "ready", "pending"] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(value)}<span>{counts[value]}</span></button>)}
            </div>
            <span className="documents-count" role="status">{t("certificateCount", { count: matching.length })}</span>
          </div>
          {matching.length ? <div className="documents-list">{matching.map(policy => <CertificateCard key={policy.id} policy={policy} language={language} />)}</div> :
            <div className="documents-empty"><InsuranceIllustration name="documents" className="empty-illustration" /><h2>{t(policies.length ? "noMatchTitle" : "emptyTitle")}</h2><p>{t(policies.length ? "noMatchText" : "emptyText")}</p>
              {policies.length ? <Button variant="secondary" onClick={clearFilters}>{t("clearFilters")}</Button> : <Link className="button" href={`/${locale}?product=travel#quote`}>{t("emptyAction")}<ArrowRight size={18} /></Link>}
            </div>}
          <p className="documents-footnote">{t("demoText")}</p>
        </section>}
      </div>
    </CustomerWorkspace>
  );
}

function CertificateCard({ policy, language }: { policy: Policy; language: Locale }) {
  const t = useTranslations("workspaceDesign");
  const a = useTranslations("account");
  const locale = useLocale();
  const { busy, downloaded, error, download } = useCertificateDownload(policy, language);
  const destination = destinationNames(policy.trip.destinationCountries, locale);
  const ready = policy.documentStatus === "ready";

  return (
    <article className="certificate-row">
      <span className="certificate-file" aria-hidden="true"><ProductIcon name="documents" size={32} /><small>PDF</small></span>
      <div className="certificate-copy">
        <h2><Link href={`/${locale}/account/policies/${policy.id}`}>{destination}</Link></h2>
        <p>{t("certificate")} · {a(`plan_${policy.quote.plan}`)}</p>
        <span className="certificate-reference">{policy.number}</span>
      </div>
      <div className="certificate-period"><span>{localDate(policy.trip.startDate, locale)} — {localDate(policy.trip.endDate, locale)}</span><small>{t("insured", { count: policy.travelers.length })}</small></div>
      <span className={`certificate-availability ${ready ? "is-ready" : "is-pending"}`}><span aria-hidden="true" />{t(ready ? "ready" : "pending")}</span>
      <div className="certificate-action">
        {ready ? <Button variant="ghost" onClick={() => void download()} disabled={busy} aria-busy={busy} aria-label={`${t(busy ? "downloading" : "download")} ${language.toUpperCase()} · ${policy.number}, ${destination}`}>
          {busy ? <Spinner /> : <Download size={18} aria-hidden="true" />}<span>{t(busy ? "downloading" : "download")}</span><small>{language.toUpperCase()}</small>
        </Button> : <span className="certificate-pending-action"><Clock3 size={18} aria-hidden="true" />{t("pending")}</span>}
      </div>
      {!ready && <p className="certificate-pending-note">{t("pendingNote")}</p>}
      {error && <div className="certificate-feedback"><ErrorNotice code={error} /></div>}
      {downloaded && <p className="certificate-download-status" role="status"><Check size={15} aria-hidden="true" />{t("downloaded")}</p>}
    </article>
  );
}

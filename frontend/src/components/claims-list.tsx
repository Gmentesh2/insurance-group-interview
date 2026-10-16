"use client";
import { InsuranceIllustration, PageIdentity } from "@/components/insurance-illustration";
import { Money } from "./money";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, LoaderCircle, Plus, RefreshCw, Search, X } from "lucide-react";
import { ProductIcon } from "./product-icon";
import { api } from "@/lib/client";
import { destinationNames } from "@/lib/countries";
import { deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft } from "@/lib/private-drafts";
import type { Claim, Policy, SessionUser } from "@/lib/contracts";
import { CustomerWorkspace } from "./customer-workspace";
import { ErrorNotice, Loading, StatusBadge, errorCode, localDate } from "./account-shared";

const filters = ["all", "action", "review", "closed"] as const;
type Filter = typeof filters[number];
function inFilter(claim: Claim, filter: Filter) {
  return filter === "all" || (filter === "action" ? ["draft", "more_information"] : filter === "review" ? ["submitted", "under_review"] : ["approved", "declined"]).includes(claim.status);
}

export function ClaimsList({ user }: { user: SessionUser }) {
  const t = useTranslations("account");
  const s = useTranslations("supportDesign");
  const locale = useLocale();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [policies, setPolicies] = useState<Policy[] | null>(null);
  const [policyError, setPolicyError] = useState("");
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);
  const request = useRef<AbortController | null>(null);
  const policyRequest = useRef<AbortController | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const result = await api<{ claims: Claim[] }>("/claims", { signal: controller.signal });
      if (!controller.signal.aborted) { setClaims(result.claims); setError(""); }
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    return () => { request.current?.abort(); policyRequest.current?.abort(); mutation.current?.abort(); };
  }, [load, locale]);

  async function loadPolicies() {
    policyRequest.current?.abort();
    const controller = new AbortController();
    policyRequest.current = controller;
    setPolicyError("");
    try {
      const result = await api<{ policies: Policy[] }>("/policies", { signal: controller.signal });
      if (!controller.signal.aborted) setPolicies(result.policies);
    } catch (e) {
      if (!controller.signal.aborted) setPolicyError(errorCode(e));
    }
  }
  function openPicker(open: boolean) {
    setPicker(open);
    if (open) void loadPolicies();
    else { policyRequest.current?.abort(); mutation.current?.abort(); mutation.current = null; setCreating(false); }
  }
  async function create() {
    if (!selected || mutation.current) return;
    const controller = new AbortController();
    mutation.current = controller;
    const epoch = getPrivateSessionEpoch();
    const key = `claim-create:${selected}`;
    const attempt = getPrivateDraft<string>(user.id, key) ?? crypto.randomUUID();
    setPrivateDraft(user.id, key, attempt);
    setCreating(true);
    setPolicyError("");
    let completed = false;
    try {
      const claim = await api<Claim>("/claims", { method: "POST", headers: { "Idempotency-Key": attempt }, body: JSON.stringify({ policyId: selected }), signal: controller.signal });
      if (controller.signal.aborted || epoch !== getPrivateSessionEpoch()) return;
      completed = true;
      deletePrivateDraft(user.id, key);
      router.push(`/${locale}/account/claims/${claim.id}`);
    } catch (e) {
      if (!controller.signal.aborted) setPolicyError(errorCode(e));
    } finally {
      if (!completed && !controller.signal.aborted) { mutation.current = null; setCreating(false); }
    }
  }
  const needle = search.trim().toLocaleLowerCase(locale);
  const visible = (claims ?? []).filter((claim) => inFilter(claim, filter) && (!needle || `${claim.id} ${claim.incidentType} ${t(`type_${claim.incidentType}`)}`.toLocaleLowerCase(locale).includes(needle)));
  const picked = policies?.find((policy) => policy.id === selected);
  return (
    <CustomerWorkspace><div className="account-page claims-workspace">
      <div className="account-page-header">
        <PageIdentity illustration="claims"><h1>{t("claims")}</h1></PageIdentity>
        <button className="button" onClick={() => openPicker(true)}><Plus size={18} aria-hidden="true" />{s("newClaim")}</button>
      </div>
      {error && <ErrorNotice code={error} />}
      <div className="claim-toolbar">
        <label className="claim-search"><Search size={18} aria-hidden="true" /><span className="visually-hidden">{s("searchClaims")}</span><input type="search" value={search} placeholder={s("searchClaims")} onChange={(event) => setSearch(event.target.value)} /></label>
        <button className="button button-secondary icon-button" disabled={loading} onClick={() => void load()} aria-label={s("refreshStatus")}><RefreshCw size={18} className={loading ? "spin" : undefined} /></button>
      </div>
      <div className="claim-filters" aria-label={s("filterClaims")}>
        {filters.map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{s(`filter_${item}`)}<span>{claims?.filter((claim) => inFilter(claim, item)).length ?? 0}</span></button>)}
      </div>
      {!claims && !error && <Loading />}
      {claims && <p className="claim-results-count" role="status">{s("allClaims", { count: visible.length })}</p>}
      {!!visible.length && <section className="claim-records" aria-label={t("claims")}>
        {visible.map((claim) => <Link className="claim-record" key={claim.id} href={`/${locale}/account/claims/${claim.id}`}>
          <ProductIcon name="claims" size={26} />
          <div className="claim-record-description"><h2>{t(`type_${claim.incidentType}`)}</h2><p>{claim.id.slice(0, 12).toUpperCase()} · {t("updatedAt", { date: localDate(claim.updatedAt, locale) })}</p></div>
          <StatusBadge status={claim.status} />
          <div className="claim-record-amount"><span>{s("requestedAmount")}</span><strong><Money cents={claim.amountCents} /></strong></div>
          <ArrowRight size={19} aria-hidden="true" />
        </Link>)}
      </section>}
      {claims && !visible.length && <div className="claim-empty">
        <InsuranceIllustration name="claims" className="empty-illustration" /><h2>{claims.length ? s("noMatches") : t("noClaims")}</h2><p>{claims.length ? s("noMatchesHint") : t("noClaimsText")}</p>
        {claims.length ? <button className="button button-secondary" onClick={() => { setSearch(""); setFilter("all"); }}>{s("resetFilters")}</button> : <button className="button button-secondary" onClick={() => openPicker(true)}>{s("newClaim")}<ArrowRight size={18} /></button>}
      </div>}
      <Dialog.Root open={picker} onOpenChange={openPicker}>
        <Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Popup className="dialog-popup claim-picker">
          <Dialog.Close className="button button-ghost icon-button claim-dialog-close" aria-label={s("close")}><X size={20} /></Dialog.Close>
          <Dialog.Title className="dialog-title">{s("selectPolicy")}</Dialog.Title>
          <Dialog.Description className="muted">{s("selectPolicyHint")}</Dialog.Description>
          {policyError && <><ErrorNotice code={policyError} />{!policies && <button className="button button-secondary" onClick={() => void loadPolicies()}>{t("retry")}</button>}</>}
          {!policies && !policyError && <Loading />}
          {policies?.length ? <>
            <fieldset className="claim-policy-options"><legend className="visually-hidden">{s("selectPolicy")}</legend>
              {policies.map((policy) => <label key={policy.id}><input type="radio" name="claim-policy" value={policy.id} checked={selected === policy.id} disabled={creating} onChange={() => setSelected(policy.id)} /><span><strong>{destinationNames(policy.trip.destinationCountries, locale)}</strong><span>{localDate(policy.trip.startDate, locale)} — {localDate(policy.trip.endDate, locale)}</span><small>{policy.number}</small></span></label>)}
            </fieldset>
            {picked && <p className="claim-picker-confirm">{s("selectedPolicy", { number: picked.number })}</p>}
            <button className="button account-full" disabled={!picked || creating} onClick={() => void create()}>{creating && <LoaderCircle size={18} className="spin" />}{s("createDraft")}<ArrowRight size={18} /></button>
            {policyError && <p className="claim-picker-confirm">{s("createRetryHint")}</p>}
          </> : policies && <div className="claim-empty"><p>{s("noPolicies")}</p><Link className="button button-secondary" href={`/${locale}/account`}>{s("viewPolicy")}</Link></div>}
        </Dialog.Popup></Dialog.Portal>
      </Dialog.Root>
    </div></CustomerWorkspace>
  );
}

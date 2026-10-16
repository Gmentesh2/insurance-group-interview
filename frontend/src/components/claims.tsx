"use client";

import { DeleteClaimDraft } from "./delete-claim-draft";
import { PageIdentity } from "@/components/insurance-illustration";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/client";
import { claimDetailsErrors, restoredClaimStep, type ClaimForm, type ClaimStep } from "@/lib/claim-flow";
import { FlowProgress, FieldRequirement } from "./flow-progress";
import { ClaimDetailsForm } from "./claim-details-form";
import { deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft } from "@/lib/private-drafts";
import type { Claim, ClaimInput, SessionUser } from "@/lib/contracts";
import { AuthGate, ErrorNotice, Loading, StatusBadge, Timeline, errorCode } from "./account-shared";
import { CustomerWorkspace } from "./customer-workspace";
import { ClaimNextStep, ClaimOverview, ClaimReceipt } from "./claim-overview";
import { ClaimsList } from "./claims-list";
import { ClaimEvidence } from "./claim-evidence";

export function ClaimsPage() {
  const locale = useLocale();
  return <AuthGate>{(user) => <ClaimsList key={`${user.id}:${locale}`} user={user} />}</AuthGate>;
}
export function ClaimPage({ id }: { id: string }) {
  const locale = useLocale();
  return <AuthGate>{(user) => <ClaimContent key={`${user.id}:${id}:${locale}`} id={id} user={user} />}</AuthGate>;
}

type PrivateClaimDraft = { form: ClaimForm; baseline: ClaimForm; updatedAt: string; status?: Claim['status']; uncertain?: boolean; step?: ClaimStep };
type FieldErrors = Partial<Record<"incidentDate" | "description" | "amount" | "consent", string>>;
function formFrom(claim: Claim): ClaimForm {
  return { incidentType: claim.incidentType, incidentDate: claim.incidentDate, description: claim.description, amount: claim.amountCents ? String(claim.amountCents / 100) : "" };
}
function payload(form: ClaimForm): Partial<ClaimInput> {
  return { incidentType: form.incidentType, incidentDate: form.incidentDate, description: form.description.trim(), amountCents: Math.round(Number(form.amount || 0) * 100) };
}
function sameForm(left: ClaimForm, right: ClaimForm) { return JSON.stringify(payload(left)) === JSON.stringify(payload(right)); }
function isEditable(claim: Claim) { return ["draft", "more_information"].includes(claim.status); }
const blank: ClaimForm = { incidentType: "medical", incidentDate: "", description: "", amount: "" };

function ClaimContent({ id, user }: { id: string; user: SessionUser }) {
  const t = useTranslations("account");
  const s = useTranslations("supportDesign");
  const f = useTranslations("flow");
  const locale = useLocale();
  const router = useRouter();
  const draftKey = `claim-edit:${id}`;
  const [step, setStep] = useState<ClaimStep>(0);
  const flowHeading = useRef<HTMLHeadingElement>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [form, setForm] = useState<ClaimForm>(blank);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [queued, setQueued] = useState(() => !!getPrivateDraft(user.id, `claim-upload:${id}`));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [conflict, setConflict] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const loadRequest = useRef<AbortController | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const baseline = useRef<PrivateClaimDraft | null>(null);
  const mounted = useRef(false);
  const leaveIntent = useRef(0);
  const editable = !!claim && isEditable(claim);
  const dirty = editable && !!claim && !sameForm(form, formFrom(claim));

  const acceptClaim = useCallback((next: Claim, fromEvidence = false) => {
    const stored = getPrivateDraft<PrivateClaimDraft>(user.id, draftKey);
    const saved = formFrom(next);
    const hasLocalChanges = !!stored && !sameForm(stored.form, stored.baseline);
    const changedElsewhere = hasLocalChanges && !sameForm(saved, stored.baseline) && !sameForm(saved, stored.form);
    setClaim(next);
    if (!isEditable(next)) {
      setForm(saved); setConflict(false); setUncertain(false); setConfirmed(false);
      baseline.current = null;
      deletePrivateDraft(user.id, draftKey);
      return;
    }
    const nextDraft: PrivateClaimDraft = {
      form: hasLocalChanges ? stored.form : saved,
      baseline: changedElsewhere ? stored.baseline : saved,
      updatedAt: changedElsewhere ? stored.updatedAt : next.updatedAt,
      status: next.status,
      uncertain: stored?.uncertain,
      step: hasLocalChanges || changedElsewhere ? 0 : restoredClaimStep(next, stored, fromEvidence && !!stored && sameForm(saved, stored.baseline)),
    };
    baseline.current = nextDraft;
    setPrivateDraft(user.id, draftKey, nextDraft);
    setForm(nextDraft.form);
    setStep(nextDraft.step ?? 0);
    setConflict(changedElsewhere);
    setUncertain(!!nextDraft.uncertain);
  }, [draftKey, user.id]);

  const load = useCallback(async (acknowledgeRecovery = false) => {
    loadRequest.current?.abort();
    const controller = new AbortController();
    loadRequest.current = controller;
    setRefreshing(true);
    try {
      const next = await api<Claim>(`/claims/${id}`, { signal: controller.signal });
      if (!controller.signal.aborted) {
        acceptClaim(next); setError("");
        if (acknowledgeRecovery && baseline.current) {
          const reviewed = { ...baseline.current, uncertain: false };
          baseline.current = reviewed;
          setPrivateDraft(user.id, draftKey, reviewed);
          setUncertain(false);
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, [acceptClaim, draftKey, id, user.id]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      // This is a mutable navigation generation, not a DOM ref captured by the effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++leaveIntent.current;
      loadRequest.current?.abort();
      mutation.current?.abort();
    };
  }, [load, locale]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href);
      if (target.origin !== location.origin || target.pathname === location.pathname) return;
      // Language navigation preserves this owner-scoped draft without an extra prompt.
      if (target.pathname.replace(/^\/(en|de|ru)/, "") === location.pathname.replace(/^\/(en|de|ru)/, "")) return;
      event.preventDefault(); event.stopPropagation(); ++leaveIntent.current; setLeaving(target.pathname + target.search + target.hash);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);

  function updateForm(next: ClaimForm) {
    if (!baseline.current) return;
    const draft = { ...baseline.current, form: next, step: 0 as ClaimStep };
    setStep(0);
    baseline.current = draft;
    setPrivateDraft(user.id, draftKey, draft);
    setForm(next); setMessage(""); setConfirmed(false);
  }
  function reviewLocal(keep: boolean) {
    if (!claim) return;
    const saved = formFrom(claim);
    const draft = { form: keep ? form : saved, baseline: saved, updatedAt: claim.updatedAt, status: claim.status, step: 0 as ClaimStep };
    setStep(0);
    baseline.current = draft;
    setPrivateDraft(user.id, draftKey, draft);
    setForm(draft.form); setConflict(false); setUncertain(false); setError(""); setConfirmed(false);
  }
  function validate(submit: boolean, completeDetails = submit) {
    const issues = claimDetailsErrors(form, completeDetails);
    const errors: FieldErrors = Object.fromEntries(Object.entries(issues).map(([field, code]) => [field, s(code)]));
    if (submit && !confirmed) errors.consent = s("consentRequired");
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) { if (first !== "consent") setStep(0); requestAnimationFrame(() => document.getElementById(`claim-${first}`)?.focus()); return false; }
    return true;
  }
  async function persist(submit = false): Promise<boolean> {
    if (!claim || !baseline.current || mutation.current || refreshing || uncertain || queued || conflict || !validate(submit)) return false;
    const controller = new AbortController();
    mutation.current = controller;
    const epoch = getPrivateSessionEpoch();
    const current = () => mounted.current && !controller.signal.aborted && epoch === getPrivateSessionEpoch();
    const pending = { ...baseline.current, form, uncertain: true };
    setPrivateDraft(user.id, draftKey, pending);
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await api<Claim>(`/claims/${id}`, { method: "PATCH", body: JSON.stringify({ ...payload(form), expectedUpdatedAt: pending.updatedAt }), signal: controller.signal });
      if (!current()) return false;
      const nextDraft = { form: formFrom(saved), baseline: formFrom(saved), updatedAt: saved.updatedAt, status: saved.status, uncertain: submit, step };
      baseline.current = nextDraft; setPrivateDraft(user.id, draftKey, nextDraft);
      acceptClaim(saved);
      if (submit) {
        const submitted = await api<Claim>(`/claims/${id}/submit`, { method: "POST", body: JSON.stringify({ expectedUpdatedAt: saved.updatedAt }), signal: controller.signal });
        if (!current()) return false;
        acceptClaim(submitted); setMessage("claimSubmitted");
        requestAnimationFrame(() => flowHeading.current?.focus());
      } else setMessage("savedDraft");
      setUncertain(false);
      return true;
    } catch (e) {
      if (!current()) return false;
      setError(errorCode(e));
      try {
        const authoritative = await api<Claim>(`/claims/${id}`, { signal: controller.signal });
        if (!current()) return false;
        acceptClaim(authoritative);
        if (!isEditable(authoritative)) { setError(""); setMessage("claimSubmitted"); requestAnimationFrame(() => flowHeading.current?.focus()); return true; }
        setUncertain(true);
      } catch {
        if (current()) setUncertain(true);
      }
      return false;
    } finally {
      if (current()) { mutation.current = null; setBusy(false); }
    }
  }
  async function leaveAfterSave() {
    const target = leaving;
    const intent = ++leaveIntent.current;
    setLeaving(null);
    if (target && await persist() && mounted.current && intent === leaveIntent.current) router.push(target);
  }
  function discardAndLeave() {
    if (!leaving) return;
    deletePrivateDraft(user.id, draftKey);
    ++leaveIntent.current;
    const target = leaving; setLeaving(null); router.push(target);
  }
  function goToStep(next: ClaimStep) {
    if (!mounted.current || busy || refreshing || queued || conflict || uncertain || !baseline.current) return;
    baseline.current = { ...baseline.current, step: next };
    setPrivateDraft(user.id, draftKey, baseline.current);
    setStep(next); setConfirmed(false); setMessage("");
    requestAnimationFrame(() => flowHeading.current?.focus());
  }
  async function continueDetails() {
    if (busy || refreshing || queued || conflict || uncertain) return;
    if (!validate(false, true)) return;
    if (await persist()) goToStep(1);
  }

  if (!claim) return <CustomerWorkspace>{error ? <div className="claim-load-error"><ErrorNotice code={error} /><button className="button button-secondary" onClick={() => void load()}>{t("retry")}</button></div> : <Loading />}</CustomerWorkspace>;
  return <CustomerWorkspace><div className="account-page claims-workspace">
    <Link className="account-back" href={`/${locale}/account/claims`}><ArrowLeft size={16} />{t("backToClaims")}</Link>
    <div className="account-page-header"><PageIdentity illustration="claims"><p className="claim-reference">{t("claimReference")} {claim.id.slice(0, 12).toUpperCase()}</p><h1 ref={flowHeading} tabIndex={-1} className="claim-flow-title">{editable ? f(step === 0 ? "detailsTitle" : step === 1 ? "evidenceTitle" : "reviewTitle") : t(`type_${claim.incidentType}`)}</h1></PageIdentity><StatusBadge status={claim.status} /></div>
    <FlowProgress flow="claim" current={editable ? step : 3} complete={!editable} onStep={editable ? index => goToStep(index as ClaimStep) : undefined} canGoToStep={index => index <= step && index < 3 && !busy && !refreshing && !queued && !conflict && !uncertain} />
    <DeleteClaimDraft claim={claim} ownerId={user.id} disabled={busy || refreshing || queued || conflict || uncertain} />
    {(!editable || claim.incidentDate || claim.amountCents > 0 || claim.documents.length > 0) && <ClaimOverview claim={claim} />}
    <div className="claim-detail-layout">
      {claim.status !== "draft" && <ClaimNextStep claim={claim} />}
      <div className="account-stack claim-main">
        {error && <ErrorNotice code={error} />}
        {message && <div className="account-notice account-notice-success" role="status"><Check size={18} />{t(message)}</div>}
        {editable && uncertain && <div className="claim-recovery-notice" role="status"><p>{s("uncertainSave")}</p><button className="button button-secondary" disabled={busy || refreshing} onClick={() => void load(true)}><RefreshCw size={16} />{s("reloadClaim")}</button></div>}
        {editable && conflict && <section className="claim-conflict"><h2>{s("changedTitle")}</h2><p>{s("changedHint")}</p><ClaimReceipt claim={claim} title={f("savedDetails")} /><div className="claim-upload-actions"><button className="button button-secondary" onClick={() => reviewLocal(false)}>{s("useSavedDetails")}</button><button className="button button-secondary" onClick={() => reviewLocal(true)}>{s("keepMyChanges")}</button></div></section>}
        {editable && step === 0 && <ClaimDetailsForm form={form} errors={fieldErrors} busy={busy} blocked={queued || conflict || uncertain || refreshing} dirty={dirty} onChange={updateForm} onSave={() => void persist()} onContinue={() => void continueDetails()} />}
        {(!editable || step === 2) && <ClaimReceipt claim={claim} title={editable ? f("savedDetails") : undefined} />}
        {(!editable || step > 0 || queued) && <ClaimEvidence claim={claim} user={user} disabled={busy || refreshing} readOnly={!editable || step !== 1} onClaim={next => acceptClaim(next, true)} onQueueChange={setQueued} />}
        {editable && step === 1 && <><p className="flow-form-hint">{f("evidenceHint")}</p><div className="claim-flow-actions"><button className="button" disabled={busy || refreshing || queued || conflict || uncertain} onClick={() => goToStep(2)}>{f("reviewClaim")}<ArrowRight size={18} /></button><button className="button button-ghost" disabled={busy || queued} onClick={() => goToStep(0)}>{f("backDetails")}</button></div></>}
        {editable && step === 2 && <form className="claim-section claim-submit-panel" noValidate onSubmit={(event) => { event.preventDefault(); void persist(true); }}>
          <div className="claim-section-heading"><span>03</span><h2>{s("reviewAndSend")}</h2></div><p>{f("reviewHint")}</p>
          <label className="account-consent"><input id="claim-consent" type="checkbox" required checked={confirmed} disabled={busy} aria-invalid={!!fieldErrors.consent} aria-describedby={fieldErrors.consent ? "claim-consent-error" : undefined} onChange={(event) => setConfirmed(event.target.checked)} /><span>{t("claimConfirm")}<FieldRequirement /></span></label>
          {fieldErrors.consent && <p id="claim-consent-error" className="claim-field-error" role="alert">{fieldErrors.consent}</p>}
          {queued && <p className="claim-submit-hint">{s("resolveUpload")}</p>}
          <button className="button" disabled={busy || refreshing || queued || conflict || uncertain}>{busy && <LoaderCircle size={18} className="spin" />}{claim.status === "more_information" ? s("resubmitClaim") : t("submitClaim")}<ArrowRight size={18} /></button>
          <button type="button" className="button button-ghost" disabled={busy} onClick={() => goToStep(1)}>{f("backEvidence")}</button>
        </form>}
      </div>
      {claim.status === "draft" && <ClaimNextStep claim={claim} />}
      <aside className="account-stack claim-sidebar"><section className="claim-history"><Timeline events={claim.events} /><button className="button button-secondary" disabled={refreshing || busy} onClick={() => void load()}><RefreshCw size={17} className={refreshing ? "spin" : undefined} />{s("refreshStatus")}</button></section><Link className="account-text-link" href={`/${locale}/account/policies/${claim.policyId}`}><ArrowLeft size={16} />{t("backToPolicy")}</Link></aside>
    </div>
    <Dialog.Root open={!!leaving} onOpenChange={(open) => { if (!open) { ++leaveIntent.current; setLeaving(null); } }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Popup className="dialog-popup claim-leave-dialog"><Dialog.Title className="dialog-title">{s("leaveTitle")}</Dialog.Title><Dialog.Description>{s("leaveHint")}</Dialog.Description><div className="claim-leave-actions"><button className="button" disabled={busy || queued || conflict} onClick={() => void leaveAfterSave()}>{s("saveAndLeave")}</button><button className="button button-secondary" disabled={busy} onClick={discardAndLeave}>{s("discardAndLeave")}</button><Dialog.Close className="button button-ghost">{s("keepEditing")}</Dialog.Close></div></Dialog.Popup></Dialog.Portal></Dialog.Root>
  </div></CustomerWorkspace>;
}

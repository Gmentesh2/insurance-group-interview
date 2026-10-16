"use client";
import { InsuranceIllustration, PageIdentity } from "@/components/insurance-illustration";
import { Money } from "./money";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Plus,
  UsersRound,
} from "lucide-react";
import { api } from "@/lib/client";
import { clearPrivateDrafts, deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft } from "@/lib/private-drafts";
import { destinationNames } from "@/lib/countries";
import type { Order, Policy, SessionUser, Claim } from "@/lib/contracts";
import { TripSummary } from "@/components/ui";
import { WalletPolicies } from "./wallet-policies";
import { WalletOrders, hasPendingWalletOrders } from "./wallet-orders";
import { CustomerWorkspace } from "./customer-workspace";
import { PolicyDocuments } from "./policy-documents";
import { PolicyCoverage } from "./policy-coverage";
import { ProductIcon } from "./product-icon";
import { GuestSaveAccess } from "./guest-save-access";
import {
  AuthGate,
  ErrorNotice,
  Loading,
  StatusBadge,
  errorCode,
  localDate,
} from "./account-shared";

export function AccountPage() {
  return <AuthGate>{(user) => <Wallet user={user} />}</AuthGate>;
}
function Wallet({ user }: { user: SessionUser }) {
  const t = useTranslations("account");
  const guest = useTranslations("guest");
  const design = useTranslations("walletDesign");
  const workspace = useTranslations("workspaceDesign");
  const locale = useLocale();
  const [data, setData] = useState<{
    policies: Policy[];
    orders: Order[];
  } | null>(null);
  const [error, setError] = useState("");
  const walletRequest = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    walletRequest.current?.abort();
    const controller = new AbortController();
    walletRequest.current = controller;
    setError("");
    try {
      const [policies, orders] = await Promise.all([
        api<{ policies: Policy[] }>("/api/v1/policies", { signal: controller.signal }),
        api<{ orders: Order[] }>("/api/v1/orders", { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      setData({
        policies: policies.policies,
        orders: orders.orders.filter((order) => order.status !== "issued"),
      });
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    }
  }, []);
  useEffect(() => {
    void load();
    return () => walletRequest.current?.abort();
  }, [load]);
  async function signOut() {
    try {
      await api("/api/v1/auth/sign-out", { method: "POST", body: "{}" });
      clearPrivateDrafts();
      window.dispatchEvent(new Event("auth-change"));
      // A full navigation clears private in-memory drafts after sign-out.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/${locale}/account`);
    } catch (e) {
      setError(errorCode(e));
    }
  }
  const ordered = data
    ? [...data.policies].sort(
        (a, b) =>
          Number(a.status === "expired") - Number(b.status === "expired") ||
          a.trip.startDate.localeCompare(b.trip.startDate),
      )
    : [];
  return (
    <CustomerWorkspace><div className="account-page wallet-page">
      <div className="account-page-header wallet-header">
        <PageIdentity illustration="travel"><h1>{design("title")}</h1></PageIdentity>
        <Link className="button" href={`/${locale}?product=travel#quote`}>
          <Plus size={18} />
          {workspace("newTrip")}
        </Link>
      </div>
      {error && (
        <>
          <ErrorNotice code={error} />
          <button
            className="button button-secondary"
            onClick={() => void load()}
          >
            {t("retry")}
          </button>
        </>
      )}
      {!data && !error ? <Loading /> : null}
      {data && (
        <>
          <WalletOrders orders={data.orders} />
          {ordered.length ? (
            <WalletPolicies policies={ordered} />
          ) : hasPendingWalletOrders(data.orders) ? null : (
            <div className="wallet-no-results">
              <InsuranceIllustration name="travel" className="empty-illustration" />
              <h2>{t("noPolicies")}</h2>
              <p>{t("noPoliciesText")}</p>
              <Link className="button button-secondary" href={`/${locale}`}>
                {t("choosePlan")}
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </>
      )}
      <div className="account-identity wallet-identity">
        <span className="account-user-avatar" aria-hidden="true">{user.isGuest ? "G" : user.email.slice(0, 1).toUpperCase()}</span>
        <span>{user.isGuest ? guest("identity") : user.email}</span>
        <button onClick={() => void signOut()}>{user.isGuest ? guest("end") : t("signOut")}</button>
      </div>
      {user.isGuest && <p className="flow-form-hint">{guest("access")}</p>}
      {user.isGuest && <GuestSaveAccess user={user} />}
    </div></CustomerWorkspace>
  );
}

export function PolicyPage({ id }: { id: string }) {
  return <AuthGate>{user => <PolicyContent key={`${user.id}:${id}`} id={id} user={user} />}</AuthGate>;
}
function PolicyContent({ id, user }: { id: string; user: SessionUser }) {
  const isGuest = !!user.isGuest;
  const t = useTranslations("account");
  const guest = useTranslations("guest");
  const common = useTranslations("common");
  const design = useTranslations("policyDesign");
  const locale = useLocale();
  const router = useRouter();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mutation = useRef<AbortController | null>(null);
  const policyRequest = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    policyRequest.current?.abort();
    const controller = new AbortController();
    policyRequest.current = controller;
    try {
      const current = await api<Policy>(`/api/v1/policies/${id}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPolicy(current);
      setError("");
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    }
  }, [id]);
  useEffect(() => {
    void load();
    return () => policyRequest.current?.abort();
  }, [load]);
  useEffect(() => {
    setBusy(false);
    return () => { mutation.current?.abort(); mutation.current = null; };
  }, [id, locale]);
  useEffect(() => {
    if (policy?.documentStatus !== "pending") return;
    const timer = setInterval(() => {
      void load();
    }, 6000);
    return () => clearInterval(timer);
  }, [policy?.documentStatus, load]);
  async function claim() {
    if (busy || mutation.current || !policy) return;
    const controller = new AbortController();
    mutation.current = controller;
    const requestEpoch = getPrivateSessionEpoch();
    const draftKey = `claim-create:${id}`;
    const attempt = getPrivateDraft<string>(policy.userId, draftKey) ?? crypto.randomUUID();
    setPrivateDraft(policy.userId, draftKey, attempt);
    setBusy(true);
    setError("");
    let completed = false;
    try {
      const result = await api<Claim>("/api/v1/claims", {
        method: "POST",
        body: JSON.stringify({ policyId: id }),
        headers: { "Idempotency-Key": attempt },
        signal: controller.signal,
      });
      if (controller.signal.aborted || requestEpoch !== getPrivateSessionEpoch()) return;
      completed = true;
      deletePrivateDraft(policy.userId, draftKey);
      router.push(`/${locale}/account/claims/${result.id}`);
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    } finally {
      if (!completed && !controller.signal.aborted) { mutation.current = null; setBusy(false); }
    }
  }
  if (!policy)
    return error ? (
      <div className="account-narrow">
        <ErrorNotice code={error} />
        <button className="button" onClick={() => void load()}>
          {t("retry")}
        </button>
      </div>
    ) : (
      <Loading workspace />
    );
  return (
    <CustomerWorkspace><div className="account-page policy-page">
      <Link className="account-back" href={`/${locale}/account`}>
        <ArrowLeft size={16} />
        {t("backToAccount")}
      </Link>
      <div className="policy-overview">
      <div className="policy-hero">
        <div className="policy-hero-content">
          <div className="policy-hero-top"><p className="eyebrow">{policy.number}</p><StatusBadge status={policy.status} /></div>
          <PageIdentity illustration="travel"><h1>{destinationNames(policy.trip.destinationCountries, locale)}</h1></PageIdentity>
          <div className="policy-hero-meta"><span><ProductIcon name="cover" size={20} />{t(`plan_${policy.quote.plan}`)}</span><span><UsersRound size={18} />{common("travelersCount", { count: policy.travelers.length })}</span><span>{t("demo")}</span></div>
        </div>
      </div>
      <TripSummary trip={policy.trip} />
      </div>
      <div className="policy-action-dock">
        <a href="#cover"><span><ProductIcon name="cover" /></span><strong>{design("coverageAction")}</strong></a>
        <a href="#documents"><span><ProductIcon name="documents" /></span><strong>{t("documents")}</strong></a>
        <button onClick={() => void claim()} disabled={busy}><span>{busy ? <LoaderCircle size={23} className="spin" aria-hidden="true" /> : <ProductIcon name="claims" />}</span><strong>{t("claimStart")}</strong></button>
        <a href="#assistance"><span><ProductIcon name="assistance" /></span><strong>{t("assistance")}</strong></a>
      </div>
      {error && <ErrorNotice code={error} />}
      <div className="policy-detail-layout">
        <div className="account-stack">
          <PolicyCoverage policy={policy} />
          <section className="panel account-panel">
            <h2>{t("insured")}</h2>
            <div className="insured-list">
              {policy.travelers.map((person, i) => (
                <div key={i}>
                  <div className="traveler-avatar">
                    {person.firstName.slice(0, 1)}
                    {person.lastName.slice(0, 1)}
                  </div>
                  <div>
                    <strong>
                      {person.firstName} {person.lastName}
                    </strong>
                    <span>{localDate(person.dateOfBirth, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel account-panel policy-support-panel" id="assistance">
            <div className="account-feature-icon">
              <ProductIcon name="assistance" />
            </div>
            <h2>{t("assistanceTitle")}</h2>
            <p className="account-prose">{t("assistanceText")}</p>
            <Link className="button button-secondary" href={`/${locale}/account/claims`}>
              {t("claims")}
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
        <aside className="account-stack">
          <PolicyDocuments key={id} policy={policy} onRefresh={load} />
          {isGuest && <p className="flow-form-hint">{guest("access")}</p>}
          {isGuest && <GuestSaveAccess user={user} defaultEmail={policy.contactEmail} />}
          <section className="panel account-panel policy-receipt">
            <p className="eyebrow">{t("total")}</p>
            <strong><Money cents={policy.quote.totalCents} /></strong>
            <StatusBadge status="paid" />
            <p className="muted">{t("demoPayment")}</p>
          </section>
        </aside>
      </div>
    </div></CustomerWorkspace>
  );
}

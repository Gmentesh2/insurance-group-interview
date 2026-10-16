"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ClipboardList,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "@/lib/client";
import type { OperationsData, SessionUser } from "@/lib/contracts";
import {
  AuthGate,
  ErrorNotice,
  Loading,
  Timeline,
  errorCode,
} from "./account-shared";
import {
  ClaimWorklist,
  OrderWorklist,
  needsRecovery,
  needsReview,
} from "./ops-worklists";

export function OpsPage() {
  return (
    <AuthGate>{(user) => <Operations key={user.id} user={user} />}</AuthGate>
  );
}
function Operations({ user }: { user: SessionUser }) {
  const t = useTranslations("account");
  const d = useTranslations("operationsDesign");
  const locale = useLocale();
  const [data, setData] = useState<OperationsData | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  // A synchronous guard also covers a second click before React renders.
  const inFlight = useRef(false);
  const fetchData = useCallback(async (search: string) => {
    const result = await api<OperationsData>(
      `/api/v1/ops?search=${encodeURIComponent(search)}`,
    );
    setData(result);
    setAppliedQuery(search);
  }, []);
  const refresh = useCallback(
    async (search: string) => {
      if (user.role !== "operator" || inFlight.current) return;
      inFlight.current = true;
      setBusy("search");
      setError("");
      setNotice("");
      try {
        await fetchData(search);
      } catch (e) {
        setError(errorCode(e));
      } finally {
        inFlight.current = false;
        setBusy("");
      }
    },
    [fetchData, user.role],
  );
  useEffect(() => {
    void refresh("");
  }, [refresh]);
  function search(event: FormEvent) {
    event.preventDefault();
    void refresh(query.trim());
  }
  function clearSearch() {
    if (inFlight.current) return;
    setQuery("");
    void refresh("");
  }
  async function action(id: string, body: Record<string, string>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await api("/api/v1/ops", { method: "POST", body: JSON.stringify(body) });
      setNotice(body.action === "reconcile" ? "reconciled" : "claimUpdated");
      await fetchData(appliedQuery);
    } catch (e) {
      setError(errorCode(e));
    } finally {
      inFlight.current = false;
      setBusy("");
    }
  }
  if (user.role !== "operator")
    return (
      <div className="account-narrow operations-restricted">
        <div className="operations-lock">
          <LockKeyhole size={28} />
        </div>
        <p className="eyebrow">Insurance Group / {d("workspace")}</p>
        <h1>{d("restricted")}</h1>
        <p>{d("restrictedText")}</p>
        <Link className="button" href={`/${locale}/account`}>
          {t("backToAccount")}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    );
  const metrics = data
    ? [
        {
          label: d("recoveryCount"),
          value: data.orders.filter(needsRecovery).length,
          hint: d("recoveryHint"),
          Icon: RefreshCw,
        },
        {
          label: d("reviewCount"),
          value: data.claims.filter(needsReview).length,
          hint: d("reviewHint"),
          Icon: ClipboardList,
        },
        {
          label: d("issuedCount"),
          value: data.orders.filter((order) => order.status === "issued")
            .length,
          hint: d("issuedHint"),
          Icon: ShieldCheck,
        },
      ]
    : [];
  return (
    <div className="account-page operations-page">
      <header className="operations-header">
        <div>
          <p className="eyebrow">Insurance Group / {d("workspace")}</p>
          <h1>{d("title")}</h1>
          <p className="account-lead">{d("intro")}</p>
        </div>
        <div className="operations-header-actions">
          <span className="account-status">{t("demo")}</span>
          <button
            type="button"
            className="button button-secondary"
            disabled={!!busy}
            onClick={() => void refresh(appliedQuery)}
          >
            <RefreshCw
              size={18}
              className={busy === "search" ? "spin" : undefined}
            />
            {d("refresh")}
          </button>
        </div>
      </header>
      {data && (
        <>
          <div className="operations-overview">
            {metrics.map(({ label, value, hint, Icon }) => (
              <section className="operations-metric" key={label}>
                <div>
                  <p>{label}</p>
                  <Icon size={21} aria-hidden="true" />
                </div>
                <strong>{value}</strong>
                <p>{hint}</p>
              </section>
            ))}
          </div>
          <p className="operations-scope">{d("scope")}</p>
        </>
      )}
      <form className="operations-search" onSubmit={search}>
        <label className="field">
          <span>{d("searchLabel")}</span>
          <div className="operations-search-input">
            <Search size={20} aria-hidden="true" />
            <input
              className="input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={d("searchPlaceholder")}
              maxLength={100}
              disabled={!!busy}
              aria-describedby="operations-search-hint"
            />
          </div>
        </label>
        <button className="button" disabled={!!busy}>
          {busy === "search" ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <Search size={18} />
          )}
          {t("searchButton")}
        </button>
        <p id="operations-search-hint">{d("searchHint")}</p>
      </form>
      {appliedQuery && (
        <div className="operations-search-result">
          <p>{d("searchResults", { query: appliedQuery })}</p>
          <button type="button" disabled={!!busy} onClick={clearSearch}>
            <X size={16} />
            {d("clearSearch")}
          </button>
        </div>
      )}
      {error && <ErrorNotice code={error} />}
      {notice && (
        <div className="account-notice account-notice-success" role="status">
          <Check size={18} />
          {t(notice)}
        </div>
      )}
      {!data && !error && <Loading />}
      {data && (
        <>
          <p className="visually-hidden" role="status">
            {d("loaded", {
              orders: data.orders.length,
              claims: data.claims.length,
            })}
          </p>
          <OrderWorklist
            orders={data.orders}
            busy={busy}
            action={action}
            resetSearch={clearSearch}
          />
          <ClaimWorklist
            claims={data.claims}
            busy={busy}
            action={action}
            resetSearch={clearSearch}
          />
          <details className="operations-activity">
            <summary>
              <CheckCheck size={20} />
              <span>{d("recentActivity")}</span>
              <span className="operations-count">
                {Math.min(12, data.events.length)}
              </span>
            </summary>
            <p>{d("activityHint")}</p>
            <Timeline
              events={data.events
                .slice(0, 12)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
            />
          </details>
        </>
      )}
      <aside className="operations-demo">
        <div className="operations-demo-icon">
          <FlaskConical size={24} aria-hidden="true" />
        </div>
        <div>
          <h2>{d("demoTools")}</h2>
          <p>{d("demoToolsHint")}</p>
        </div>
        <Link className="button button-secondary" href={`/${locale}/demo`}>
          {d("openDemo")}
          <ArrowUpRight size={18} />
        </Link>
      </aside>
    </div>
  );
}

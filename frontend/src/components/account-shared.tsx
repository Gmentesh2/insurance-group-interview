"use client";
import { SignIn } from "./password-auth";
import { Money } from "./money";


import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Fragment,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  LoaderCircle,
} from "lucide-react";
import { GuestCheckout } from "./guest-checkout";
import { ErrorNotice, errorCode } from "./account-feedback";
export { ErrorNotice, errorCode } from "./account-feedback";
import { CustomerWorkspace } from "./customer-workspace";
import { api } from "@/lib/client";
import { activatePrivateOwner, getPrivateSessionEpoch, suspendPrivateDrafts } from "@/lib/private-drafts";
import { SESSION_EXPIRED } from "@/lib/session-recovery";
import type {
  AuthSession,
  Quote,
  SessionUser,
  TimelineEvent,
} from "@/lib/contracts";

export { money } from "@/lib/countries";
export function localDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}
export function Loading({ workspace = false }: { workspace?: boolean }) {
  const t = useTranslations("account");
  const content = (
    <div className="account-loading" role="status">
      <LoaderCircle size={24} className="spin" />
      <span>{t("loading")}</span>
    </div>
  );
  return workspace ? <CustomerWorkspace>{content}</CustomerWorkspace> : content;
}
export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("account");
  const key = `status_${status}`;
  return (
    <span className={`account-status status-${status}`}>
      {t.has(key) ? t(key) : t("unknownEvent")}
    </span>
  );
}
export function Timeline({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations("account");
  const locale = useLocale();
  return (
    <section className="account-timeline">
      <h3>{t("timeline")}</h3>
      {events.length ? (
        <ol>
          {[...events].reverse().map((event) => (
            <li key={event.id}>
              <span className="timeline-dot" />
              <div>
                <strong>
                  {t.has(`status_${event.status}`)
                    ? t(`status_${event.status}`)
                    : t("unknownEvent")}
                </strong>
                <time dateTime={event.createdAt}>
                  {localDate(event.createdAt, locale)} ·{" "}
                  {new Intl.DateTimeFormat(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(event.createdAt))}
                </time>
                {event.note?.trim() && <p className="account-timeline-note">{event.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">{t("emptyActivity")}</p>
      )}
    </section>
  );
}

export function AuthGate({
  children,
  unauthenticatedContext,
  guestCheckout = false,
}: {
  children: (user: SessionUser) => ReactNode;
  unauthenticatedContext?: ReactNode;
  guestCheckout?: boolean;
}) {
  const t = useTranslations("account");
  const path = usePathname();
  const locale = useLocale();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [signInSelected, setSignInSelected] = useState(() =>
    guestCheckout && typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("access") === "signin",
  );
  const chooseSignIn = (selected: boolean) => {
    // Preserve only the public access choice across locale navigation and refresh.
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set("access", "signin");
    else url.searchParams.delete("access");
    window.history.replaceState(window.history.state, "", url.href);
    setSignInSelected(selected);
  };
  const [recoverSignIn, setRecoverSignIn] = useState(false);
  const guest = useTranslations("guest");
  const sessionRequest = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const accept = useCallback((nextSession: AuthSession) => {
    if (!mounted.current) return;
    ++sessionRequest.current;
    controller.current?.abort();
    if (nextSession.user) activatePrivateOwner(nextSession.user.id, nextSession.user.accessOwnerIds);
    else suspendPrivateDrafts();
    setSession(nextSession);
    setExpired(false);
    setError("");
    setRecoverSignIn(false);
  }, []);
  const load = useCallback(() => {
    const request = ++sessionRequest.current;
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    const requestEpoch = getPrivateSessionEpoch();
    setError("");
    api<AuthSession>("/api/v1/auth/session", { signal: pending.signal })
      .then((nextSession) => {
        if (pending.signal.aborted || request !== sessionRequest.current || requestEpoch !== getPrivateSessionEpoch()) return;
        if (nextSession.user) activatePrivateOwner(nextSession.user.id, nextSession.user.accessOwnerIds);
        else suspendPrivateDrafts();
        setSession(nextSession);
      })
      .catch((e) => {
        if (!pending.signal.aborted && request === sessionRequest.current) setError(errorCode(e));
      });
  }, []);
  useEffect(() => {
    mounted.current = true;
    load();
    const changed = () => { setSession(null); load(); };
    const recover = () => { setExpired(true); setSession(null); load(); };
    window.addEventListener("auth-change", changed);
    window.addEventListener(SESSION_EXPIRED, recover);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      window.removeEventListener("auth-change", changed);
      window.removeEventListener(SESSION_EXPIRED, recover);
    };
  }, [load]);
  if (recoverSignIn) return <SignIn onSuccess={accept} />;
  if (error)
    return (
      <div className="account-narrow">
        <ErrorNotice code={error} />
        <button
          className="button button-secondary"
          aria-label={t("retry")}
          onClick={load}
        >
          ↻
        </button>
        <button className="button button-ghost" onClick={() => setRecoverSignIn(true)}>{t("signIn")}</button>
      </div>
    );
  if (!session) return <Loading workspace={path.startsWith(`/${locale}/account`)} />;
  if (!session.user) {
    const notice = expired ? <ErrorNotice code="AUTH_REQUIRED" /> : null;
    if (guestCheckout && !expired && !signInSelected) return <>{unauthenticatedContext}<GuestCheckout key={locale} onGuest={accept} onSignIn={() => chooseSignIn(true)} /></>;
    return <SignIn onSuccess={accept} context={<>{notice}{unauthenticatedContext}{guestCheckout && !expired && <button className="account-text-link" onClick={() => chooseSignIn(false)}>{guest("back")}</button>}</>} />;
  }
  return <Fragment key={session.user.id}>{children(session.user)}</Fragment>;
}

export function CoverageSummary({ quote }: { quote: Quote }) {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const policy = useTranslations("policyDesign");
  return (
    <div className="account-coverage">
      <h3>{t("cover")}</h3>
      <dl>
        {quote.coverage.map((item) => (
          <div key={item.key}>
            <dt>
              {t(item.key)}
              <small>
                {t(item.scope === "per_person" ? "scope_person" : "scope_trip")}
              </small>
            </dt>
            <dd>
              <strong>
                {item.status === "excluded"
                  ? t("excluded")
                  : item.status === "unknown"
                    ? t("unknown")
                    : item.limitCents !== null
                      ? <Money cents={item.limitCents} />
                      : t("included")}
              </strong>
              {item.limitCents === null && item.status !== "excluded" && item.status !== "unknown" && <small>{policy("noLimit")}</small>}
              {item.status === "conditional" && (
                <small>
                  {t("conditional")}
                  {item.condition && common.has(item.condition)
                    ? ` · ${common(item.condition)}`
                    : ""}
                </small>
              )}
              {item.status !== "excluded" && item.status !== "unknown" && (
                <small>
                  {policy("excess")}: <Money cents={item.deductibleCents} />
                </small>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <section className="account-exclusions">
        <h4>{t("exclusions")}</h4>
        <ul>
          {quote.exclusions.map((key) => (
            <li key={key}>{common.has(key) ? common(key) : t("unknown")}</li>
          ))}
        </ul>
        <p className="muted">
          {t("termsVersion", { version: quote.termsVersion })}
        </p>
      </section>
    </div>
  );
}

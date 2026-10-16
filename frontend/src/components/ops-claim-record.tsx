"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Download, LoaderCircle } from "lucide-react";
import { ProductIcon } from "./product-icon";
import type { Claim, ClaimStatus } from "@/lib/contracts";
import { localDate, money, StatusBadge, Timeline, ErrorNotice, errorCode } from "./account-shared";
import { downloadDocument } from "@/lib/download";

const CLAIM_TRANSITIONS: ClaimStatus[] = [
  "under_review",
  "more_information",
  "approved",
  "declined",
];
export function ClaimRecord({
  claim,
  busy,
  action,
}: {
  claim: Claim;
  busy: string;
  action: (id: string, body: Record<string, string>) => Promise<void>;
}) {
  const t = useTranslations("account");
  const d = useTranslations("operationsDesign");
  const locale = useLocale();
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus>(
    claim.status,
  );
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const downloadRequest = useRef<AbortController | null>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const noteId = useId();
  const needsNote = selectedStatus === "more_information" || selectedStatus === "declined";
  useEffect(() => () => downloadRequest.current?.abort(), []);
  function updateStatus(event: FormEvent) {
    event.preventDefault();
    if (busy || selectedStatus === claim.status) return;
    if (note.trim().length > 1000 || (needsNote && note.trim().length < 10)) {
      setNoteError(true); noteInput.current?.focus(); return;
    }
    setNoteError(false);
    void action(claim.id, { action: "claim_status", claimId: claim.id, status: selectedStatus, note: note.trim() });
  }
  async function download(id: string, name: string) {
    if (downloadRequest.current) return;
    const controller = new AbortController();
    downloadRequest.current = controller;
    setDownloading(id); setDownloadError("");
    try { await downloadDocument(`/api/v1/ops/claims/${claim.id}/documents/${id}`, name, controller.signal); }
    catch (error) { if (!controller.signal.aborted) setDownloadError(errorCode(error)); }
    finally {
      if (!controller.signal.aborted) { downloadRequest.current = null; setDownloading(""); }
    }
  }
  const closed = claim.status === "approved" || claim.status === "declined";
  const editable = claim.status !== "draft" && !closed;
  return (
    <article className="operations-record operations-claim-record">
      <div className="operations-claim-main">
        <div className="operations-record-title">
          <p className="operations-reference">
            {claim.id.slice(0, 12).toUpperCase()}
          </p>
          <h3>{t(`type_${claim.incidentType}`)}</h3>
          <p>{d("updated", { date: localDate(claim.updatedAt, locale) })}</p>
        </div>
        <StatusBadge status={claim.status} />
        <strong className="operations-claim-amount">
          {money(claim.amountCents, locale)}
        </strong>
      </div>
      <div className="operations-claim-detail">
        <p>{claim.description || d("noDescription")}</p>
        <details className="operations-record-detail operations-evidence">
          <summary>{d("documents", { count: claim.documents.length })}<ChevronDown size={16} aria-hidden="true" /></summary>
          {claim.documents.length ? <><p className="operations-evidence-hint">{d("evidencePrivate")}</p><ul>{claim.documents.map(document => <li key={document.id}>
            <ProductIcon name="documents" size={24} /><div><strong>{document.name}</strong><small>{Math.max(1, Math.round(document.size / 1024))} KB</small></div>
            <button type="button" className="button button-ghost icon-button" disabled={!!downloading} onClick={() => void download(document.id, document.name)} aria-label={d("downloadEvidence", { name: document.name })}>{downloading === document.id ? <LoaderCircle size={18} className="spin" /> : <Download size={18} />}</button>
          </li>)}</ul></> : <p>{d("noEvidence")}</p>}
          {downloadError && <ErrorNotice code={downloadError} />}
        </details>
      </div>
      {editable ? (
        <form className="operations-claim-controls" onSubmit={updateStatus} noValidate>
          <label className="field">
            <span>{t("updateStatus")}</span>
            <select
              className="input"
              disabled={!!busy}
              aria-label={`${t("updateStatus")} ${claim.id.slice(0, 8)}`}
              value={selectedStatus}
              onChange={(event) => { setSelectedStatus(event.target.value as ClaimStatus); setNoteError(false); }}
            >
              <option value={claim.status} disabled>
                {t(`status_${claim.status}`)}
              </option>
              {CLAIM_TRANSITIONS.filter(
                (status) => status !== claim.status,
              ).map((status) => (
                <option key={status} value={status}>
                  {t(`status_${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="field operations-claim-note" htmlFor={noteId}>
            <span>{d(needsNote ? "customerNoteRequired" : "customerNote")}</span>
            <textarea id={noteId} ref={noteInput} className="input" rows={3} value={note} maxLength={1000} disabled={!!busy} aria-required={needsNote} aria-invalid={noteError} aria-describedby={`${noteId}-hint${noteError ? ` ${noteId}-error` : ""}`} onChange={event => { setNote(event.target.value); setNoteError(false); }} />
            <small id={`${noteId}-hint`}>{d("customerNoteHint")}</small>
            {noteError && <small id={`${noteId}-error`} className="operations-field-error" role="alert">{d("customerNoteValidation")}</small>}
          </label>
          <button
            type="submit"
            className="button button-secondary"
            disabled={!!busy || selectedStatus === claim.status}
          >
            {busy === claim.id ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}
            {t("save")}
          </button>
        </form>
      ) : (
        <p className="operations-record-hint">
          {d(closed ? "claimFinal" : "claimDraft")}
        </p>
      )}
      <details className="operations-record-detail">
        <summary>
          {d("history")}
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="operations-record-detail-body">
          <dl className="operations-detail-facts">
            <div>
              <dt>{d("policyReference")}</dt>
              <dd className="operations-full-reference">{claim.policyId}</dd>
            </div>
            {claim.incidentDate && (
              <div>
                <dt>{d("incidentDate")}</dt>
                <dd>{localDate(claim.incidentDate, locale)}</dd>
              </div>
            )}
          </dl>
          <Timeline events={claim.events} />
        </div>
      </details>
    </article>
  );
}

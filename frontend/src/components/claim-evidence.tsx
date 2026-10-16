"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, LoaderCircle, LockKeyhole, Upload, X } from "lucide-react";
import { FieldRequirement } from "./flow-progress";
import { ProductIcon } from "./product-icon";
import { api } from "@/lib/client";
import { downloadDocument } from "@/lib/download";
import { deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft } from "@/lib/private-drafts";
import { notifySessionExpired } from "@/lib/session-recovery";
import type { Claim, SessionUser } from "@/lib/contracts";
import { ErrorNotice, errorCode } from "./account-shared";

type UploadDraft = { file: File; attemptId: string; code: string };
const retryable = new Set(["UPLOAD_PAUSED", "UPLOAD_CANCELED", "UPLOAD_TIMEOUT", "UPLOAD_FAILED", "UNKNOWN", "SERVER_ERROR", "REQUEST_FAILED"]);

export function ClaimEvidence({ claim, user, disabled, readOnly = false, onClaim, onQueueChange }: {
  claim: Claim; user: SessionUser; disabled: boolean; readOnly?: boolean;
  onClaim: (claim: Claim) => void; onQueueChange: (queued: boolean) => void;
}) {
  const t = useTranslations("account");
  const s = useTranslations("supportDesign");
  const draftKey = `claim-upload:${claim.id}`;
  const [queued, setQueued] = useState<UploadDraft | null>(() => getPrivateDraft<UploadDraft>(user.id, draftKey) ?? null);
  const [active, setActive] = useState(false);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const request = useRef<AbortController | null>(null);
  const downloadRequest = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const onClaimRef = useRef(onClaim);
  useEffect(() => { onClaimRef.current = onClaim; }, [onClaim]);
  const claimEditable = ["draft", "more_information"].includes(claim.status);
  const editable = !readOnly && claimEditable;
  function remember(next: UploadDraft | null) {
    if (next) setPrivateDraft(user.id, draftKey, next);
    else deletePrivateDraft(user.id, draftKey);
    setQueued(next);
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      downloadRequest.current?.abort();
      if (xhr.current) {
        xhr.current.onload = xhr.current.onerror = xhr.current.onabort = xhr.current.ontimeout = null;
        xhr.current.upload.onprogress = null;
        xhr.current.abort();
      }
    };
  }, []);
  useEffect(() => { onQueueChange(!!queued); }, [queued, onQueueChange]);
  useEffect(() => {
    if (queued && claim.documents.some((document) => document.id === queued.attemptId)) {
      deletePrivateDraft(user.id, draftKey);
      setQueued(null);
    }
  }, [claim.documents, draftKey, queued, user.id]);

  async function reconcile(attempt: UploadDraft, failureCode: string) {
    if (!mounted.current) return;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setChecking(true);
    remember({ ...attempt, code: failureCode });
    try {
      const current = await api<Claim>(`/claims/${claim.id}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      onClaimRef.current(current);
      if (current.documents.some((document) => document.id === attempt.attemptId)) remember(null);
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  }
  function send(attempt: UploadDraft) {
    if (xhr.current || checking || disabled) return;
    const epoch = getPrivateSessionEpoch();
    const pending = new XMLHttpRequest();
    xhr.current = pending;
    remember({ ...attempt, code: "UPLOAD_PAUSED" });
    setError(""); setProgress(0); setActive(true);
    const current = () => mounted.current && epoch === getPrivateSessionEpoch() && xhr.current === pending;
    const finish = () => { xhr.current = null; setActive(false); };
    pending.open("POST", `/api/v1/claims/${claim.id}/documents`);
    pending.timeout = 60_000;
    pending.upload.onprogress = (event) => { if (current() && event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    pending.onload = () => {
      if (!current()) return;
      let result: Claim | { error?: { code?: string } } | null = null;
      try { result = JSON.parse(pending.responseText); } catch { /* Reconcile an unreadable response. */ }
      finish();
      if (pending.status === 401) { notifySessionExpired(epoch); return; }
      if (pending.status >= 200 && pending.status < 300 && result && "id" in result && result.id === claim.id) {
        onClaimRef.current(result);
        remember(null);
      } else {
        const code = result && "error" in result ? result.error?.code ?? "UNKNOWN" : "UNKNOWN";
        void reconcile(attempt, code);
      }
    };
    const uncertain = (code: string) => {
      if (!current()) return;
      finish();
      void reconcile(attempt, code);
    };
    pending.onerror = () => uncertain("UPLOAD_FAILED");
    pending.ontimeout = () => uncertain("UPLOAD_TIMEOUT");
    pending.onabort = () => uncertain("UPLOAD_CANCELED");
    const body = new FormData();
    body.append("file", attempt.file);
    body.append("attemptId", attempt.attemptId);
    pending.send(body);
  }
  function choose(file: File) {
    if (!file.size || file.size > 10 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setError("INVALID_FILE"); return;
    }
    send({ file, attemptId: crypto.randomUUID(), code: "UPLOAD_PAUSED" });
  }
  async function dismiss() {
    if (!queued || active || checking) return;
    const controller = new AbortController();
    request.current?.abort(); request.current = controller;
    setChecking(true); setError("");
    try {
      const result = await api<{ claim: Claim; abandoned: boolean }>(`/claims/${claim.id}/uploads/${queued.attemptId}/abandon`, { method: "POST", body: "{}", signal: controller.signal });
      if (controller.signal.aborted) return;
      onClaimRef.current(result.claim);
      remember(null);
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCode(e));
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  }
  async function download(id: string, name: string) {
    if (downloadRequest.current) return;
    const controller = new AbortController();
    downloadRequest.current = controller;
    const epoch = getPrivateSessionEpoch();
    setDownloadBusy(id); setError("");
    try { await downloadDocument(`/api/v1/claims/${claim.id}/documents/${id}`, name, controller.signal); }
    catch (e) { if (mounted.current && !controller.signal.aborted && epoch === getPrivateSessionEpoch()) setError(errorCode(e)); }
    finally {
      downloadRequest.current = null;
      if (mounted.current && epoch === getPrivateSessionEpoch()) setDownloadBusy(null);
    }
  }
  const localCode = queued && ["UPLOAD_PAUSED", "UPLOAD_CANCELED", "UPLOAD_TIMEOUT"].includes(queued.code);
  return <section className="claim-section claim-evidence" aria-labelledby="claim-evidence-title">
    <div className="claim-section-heading"><span>02</span><h2 id="claim-evidence-title">{t("documents")}<FieldRequirement optional /></h2><span className="claim-section-count">{claim.documents.length}/10</span></div>
    <p className="muted">{editable ? t("documentsHint") : s("savedDocumentsHint")}</p>
    {error && <ErrorNotice code={error} />}
    {claim.documents.length ? <ul className="claim-documents">{claim.documents.map((document) => <li key={document.id}>
      <ProductIcon name="documents" size={24} /><div><strong>{document.name}</strong><span>{Math.max(1, Math.round(document.size / 1024))} KB</span></div>
      <button className="button button-ghost icon-button" disabled={!!downloadBusy} onClick={() => void download(document.id, document.name)} aria-label={s("downloadDocument", { name: document.name })}>{downloadBusy === document.id ? <LoaderCircle size={18} className="spin" /> : <Download size={18} />}</button>
    </li>)}</ul> : !editable && <p className="claim-documents-empty">{s("documentsEmpty")}</p>}
    {queued ? <div className="claim-upload-queue">
      <div className="claim-upload-filename"><ProductIcon name="documents" size={24} /><strong>{queued.file.name}</strong><span>{Math.max(1, Math.round(queued.file.size / 1024))} KB</span></div>
      {active ? <>
        <p role="status">{progress >= 100 ? s("uploadFinishing") : s("uploadProgress", { progress })}</p><progress max={100} value={progress} aria-label={t("addDocument")} />
        <button className="button button-secondary" onClick={() => xhr.current?.abort()}><X size={16} />{s("cancelUpload")}</button>
      </> : <>
        {localCode ? <p role="status">{s(queued.code === "UPLOAD_CANCELED" ? "uploadCanceled" : queued.code === "UPLOAD_TIMEOUT" ? "uploadTimeout" : "uploadPaused")}</p> : <ErrorNotice code={queued.code} />}
        <div className="claim-upload-actions">
          {claimEditable && retryable.has(queued.code) && <button className="button button-secondary" disabled={checking || disabled} onClick={() => send(queued)}>{t("retryUpload")}</button>}
          <button className="button button-secondary" disabled={checking || disabled} onClick={() => void reconcile(queued, queued.code)}>{checking && <LoaderCircle size={16} className="spin" />}{s("checkUpload")}</button>
          <button className="button button-ghost" disabled={checking || disabled} onClick={() => void dismiss()}>{s("removeQueuedFile")}</button>
        </div>
      </>}
    </div> : editable && <>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="visually-hidden" tabIndex={-1} aria-label={t("addDocument")} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) choose(selected); event.target.value = ""; }} />
      <button className="claim-upload-target" disabled={disabled || claim.documents.length >= 10} onClick={() => input.current?.click()}><Upload size={21} /><strong>{t("addDocument")}</strong><span>{s("fileTypes")}</span></button>
      {claim.documents.length >= 10 && <p className="muted">{s("uploadLimit")}</p>}
    </>}
    <p className="claim-private-note"><LockKeyhole size={15} aria-hidden="true" />{s("privateFiles")}</p>
  </section>;
}

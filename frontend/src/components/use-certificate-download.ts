"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { Locale, Policy } from "@/lib/contracts";
import { downloadDocument } from "@/lib/download";
import { errorCode } from "./account-shared";

export function useCertificateDownload(policy: Pick<Policy, "id" | "number">, language: Locale) {
  const locale = useLocale();
  const identity = `${policy.id}:${language}:${locale}`;
  const [result, setResult] = useState<{
    identity: string;
    status: "busy" | "downloaded" | "error";
    error?: string;
  } | null>(null);
  const request = useRef<AbortController | null>(null);
  // Forget the previous result so returning to that language cannot revive an aborted request.
  if (result && result.identity !== identity) setResult(null);
  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, [identity]);

  async function download() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setResult({ identity, status: "busy" });
    try {
      await downloadDocument(
        `/api/v1/policies/${policy.id}/documents?locale=${language}`,
        `${policy.number}-${language}-demo.pdf`,
        controller.signal,
      );
      if (!controller.signal.aborted) setResult({ identity, status: "downloaded" });
    } catch (cause) {
      if (!controller.signal.aborted) setResult({ identity, status: "error", error: errorCode(cause) });
    } finally {
      if (request.current === controller) {
        request.current = null;
      }
    }
  }

  const current = result?.identity === identity ? result : null;
  return {
    busy: current?.status === "busy",
    downloaded: current?.status === "downloaded",
    error: current?.error ?? "",
    download,
  };
}

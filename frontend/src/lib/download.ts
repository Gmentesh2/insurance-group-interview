import { getPrivateSessionEpoch } from "./private-drafts";
import { notifySessionExpired } from "./session-recovery";
import { withRequestDeadline } from "./request-deadline";

export async function downloadDocument(url: string, name: string, signal?: AbortSignal) {
  const requestEpoch = getPrivateSessionEpoch();
  const blob = await withRequestDeadline(async pending => {
    const response = await fetch(url, { credentials: "same-origin", signal: pending });
    if (!response.ok) {
      let code = "UNKNOWN";
      try {
        const data = await response.json();
        code = data.error?.code ?? code;
      } catch {}
      pending.throwIfAborted();
      if (response.status === 401 && code === "AUTH_REQUIRED") notifySessionExpired(requestEpoch);
      throw Object.assign(new Error(code), { code });
    }
    const result = await response.blob();
    pending.throwIfAborted();
    return result;
  }, signal, 45_000);
  signal?.throwIfAborted();
  if (requestEpoch !== getPrivateSessionEpoch()) throw Object.assign(new Error("AUTH_REQUIRED"), { code: "AUTH_REQUIRED" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

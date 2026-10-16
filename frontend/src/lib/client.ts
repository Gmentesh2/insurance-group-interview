import { getPrivateSessionEpoch } from "./private-drafts";
import { notifySessionExpired } from "./session-recovery";
import { withRequestDeadline } from "./request-deadline";

export class RequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const requestEpoch = getPrivateSessionEpoch();
  const protectedRequest = !/^\/(?:api\/v1\/)?(?:auth|quotes|quote-sessions)(?:\/|$)/.test(path);
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const { timeoutMs, ...requestOptions } = options;
  return withRequestDeadline(async signal => {
    const response = await fetch(
      path.startsWith("/api/") ? path : `/api/v1${path}`,
      { ...requestOptions, signal, headers, cache: "no-store", credentials: "same-origin" },
    );
    const result = await response.json().catch(() => null);
    signal.throwIfAborted();
    if (!response.ok) {
      if (response.status === 401 && result?.error?.code === "AUTH_REQUIRED" && protectedRequest) notifySessionExpired(requestEpoch);
      throw new RequestError(
        result?.error?.code ?? "REQUEST_FAILED",
        result?.error?.message ?? "Something went wrong. Please try again.",
        response.status,
        result?.error?.fields,
      );
    }
    if (result === null) throw new RequestError("INVALID_RESPONSE", "The server response could not be confirmed.", 502);
    if (protectedRequest && requestEpoch !== getPrivateSessionEpoch()) throw new DOMException("The private session changed.", "AbortError");
    return result as T;
  }, options.signal, timeoutMs);
}

export class RequestTimeoutError extends Error {
  readonly code = 'REQUEST_TIMEOUT';
  readonly status = 408;
  constructor() { super('The request timed out. Check its status before retrying.'); }
}

/** Bound headers and response-body reads; never retry the operation automatically. */
export async function withRequestDeadline<T>(run: (signal: AbortSignal) => Promise<T>, caller?: AbortSignal | null, timeoutMs = 30_000): Promise<T> {
  caller?.throwIfAborted();
  const controller = new AbortController();
  let timeout = false;
  let rejectAbort!: (reason: unknown) => void;
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const cancel = () => controller.abort(caller?.reason ?? new DOMException('Request canceled', 'AbortError'));
  const onAbort = () => rejectAbort(timeout ? new RequestTimeoutError() : controller.signal.reason);
  controller.signal.addEventListener('abort', onAbort, { once: true });
  caller?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timeout = true; controller.abort(); }, timeoutMs);
  try { return await Promise.race([run(controller.signal), aborted]); }
  finally {
    clearTimeout(timer);
    caller?.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', onAbort);
  }
}

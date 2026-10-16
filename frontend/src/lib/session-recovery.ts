import { getPrivateSessionEpoch, suspendPrivateDrafts } from "./private-drafts";

export const SESSION_EXPIRED = "insurance-session-expired";
let lastExpiredEpoch = -1;

/** Coalesce simultaneous failures; an old response cannot expire a newer session. */
export function notifySessionExpired(requestEpoch: number) {
  if (typeof window === "undefined" || requestEpoch !== getPrivateSessionEpoch() || lastExpiredEpoch === requestEpoch) return;
  lastExpiredEpoch = requestEpoch;
  suspendPrivateDrafts();
  window.dispatchEvent(new Event(SESSION_EXPIRED));
}

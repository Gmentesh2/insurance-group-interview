/** Respect an outside click; use a visible fallback when responsive navigation hides its trigger. */
export function popoverFocusTarget(
  popup: HTMLElement | null,
  trigger: HTMLElement | null,
  fallback: HTMLElement | null,
): HTMLElement | false {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body && active !== trigger && !popup?.contains(active)) return false;
  return trigger?.getClientRects().length ? trigger : fallback ?? false;
}

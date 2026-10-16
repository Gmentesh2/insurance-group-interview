import { clearAuthFormDrafts } from './auth-form-draft';
/** Ephemeral personal data. Never serialized into browser storage. */
let owner: string | null = null;
let suspended = true;
let epoch = 0;
let allowedOwners = new Set<string>();
const drafts = new Map<string, unknown>();

export function getPrivateSessionEpoch() { return epoch; }

export function activatePrivateOwner(userId: string, accessOwnerIds: string[] = []) {
  const nextOwners = new Set([userId, ...accessOwnerIds]);
  const scopeChanged = nextOwners.size !== allowedOwners.size || [...nextOwners].some(id => !allowedOwners.has(id));
  if (owner !== userId || scopeChanged) { drafts.clear(); clearAuthFormDrafts(); }
  if (owner !== userId || scopeChanged || suspended) epoch += 1;
  owner = userId;
  allowedOwners = nextOwners;
  suspended = false;
}

export function suspendPrivateDrafts() {
  if (!suspended) epoch += 1;
  suspended = true;
}

export function clearPrivateDrafts() {
  clearAuthFormDrafts();
  drafts.clear();
  owner = null;
  allowedOwners.clear();
  suspended = true;
  epoch += 1;
}

export function getPrivateDraft<T>(userId: string, key: string): T | undefined {
  return !suspended && allowedOwners.has(userId) ? drafts.get(key) as T | undefined : undefined;
}

export function setPrivateDraft<T>(userId: string, key: string, value: T) {
  if (!suspended && allowedOwners.has(userId)) drafts.set(key, value);
}

export function deletePrivateDraft(userId: string, key: string) {
  if (!suspended && allowedOwners.has(userId)) drafts.delete(key);
}

import type { Claim } from './contracts';
import { isCalendarDate } from './date-input';

export type ClaimForm = { incidentType: Claim['incidentType']; incidentDate: string; description: string; amount: string };
export type ClaimDetailsErrors = Partial<Record<'incidentDate' | 'description' | 'amount', 'invalidDate' | 'invalidDescription' | 'invalidAmount'>>;
export type ClaimStep = 0 | 1 | 2;

/** Drafts may be incomplete; advancing to evidence/review requires complete details. */
export function claimDetailsErrors(form: ClaimForm, complete: boolean, today = new Date().toISOString().slice(0, 10)): ClaimDetailsErrors {
  const errors: ClaimDetailsErrors = {};
  if ((complete || form.incidentDate) && (!isCalendarDate(form.incidentDate) || form.incidentDate > today)) errors.incidentDate = 'invalidDate';
  if (complete && form.description.trim().length < 20) errors.description = 'invalidDescription';
  const amount = Number(form.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1000000 || (complete && amount <= 0)) errors.amount = 'invalidAmount';
  return errors;
}
export function savedClaimStep(claim: Claim): ClaimStep {
  if (claim.status === "more_information") return 0;
  const errors = claimDetailsErrors({ incidentType: claim.incidentType, incidentDate: claim.incidentDate, description: claim.description, amount: String(claim.amountCents / 100) }, true);
  return Object.keys(errors).length ? 0 : claim.documents.length ? 2 : 1;
}

/** Preserve navigation for the same valid version or a confirmed evidence-only update. */
export function restoredClaimStep(claim: Claim, remembered?: { step?: ClaimStep; updatedAt: string; status?: Claim['status'] }, evidenceOnly = false): ClaimStep {
  const errors = claimDetailsErrors({ incidentType: claim.incidentType, incidentDate: claim.incidentDate, description: claim.description, amount: String(claim.amountCents / 100) }, true);
  if (Object.keys(errors).length) return 0;
  const sameVersion = remembered?.updatedAt === claim.updatedAt;
  const confirmedEvidence = evidenceOnly && remembered?.status === claim.status;
  return remembered && (sameVersion || confirmedEvidence) ? remembered.step ?? savedClaimStep(claim) : savedClaimStep(claim);
}

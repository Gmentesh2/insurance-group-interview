import { expect, it } from 'vitest';
import type { Claim } from '../src/lib/contracts';
import { claimDetailsErrors, restoredClaimStep, savedClaimStep, type ClaimForm } from '../src/lib/claim-flow';

const valid: ClaimForm = { incidentType: 'cancellation', incidentDate: '2026-10-13', description: 'A fictional cancellation with a documented expense.', amount: '120' };
it('allows saving an incomplete draft but blocks advancing until required details are complete', () => {
  const blank = { ...valid, incidentDate: '', description: '', amount: '' };
  expect(claimDetailsErrors(blank, false, '2026-10-14')).toEqual({});
  expect(Object.keys(claimDetailsErrors(blank, true, '2026-10-14'))).toEqual(['incidentDate','description','amount']);
});
it('rejects invalid and future calendar dates and invalid monetary values before advancing', () => {
  for (const incidentDate of ['2026-02-30','2026-10-15','13/10/20']) expect(claimDetailsErrors({ ...valid, incidentDate }, true, '2026-10-14').incidentDate).toBe('invalidDate');
  for (const amount of ['-1','Infinity','0','1000001']) expect(claimDetailsErrors({ ...valid, amount }, true, '2026-10-14').amount).toBe('invalidAmount');
  expect(claimDetailsErrors(valid, true, '2026-10-14')).toEqual({});
});
it('resumes valid saved details at optional evidence and saved evidence at review', () => {
  const claim = { ...valid, amountCents: 12000, status: 'draft', documents: [] } as unknown as Claim;
  expect(savedClaimStep(claim)).toBe(1);
  expect(savedClaimStep({ ...claim, documents: [{ id: 'saved-evidence' }] as Claim['documents'] })).toBe(2);
  expect(savedClaimStep({ ...claim, description: '' })).toBe(0);
});
it('reopens details when additional information is requested instead of treating submission as approval', () => {
  const claim = { ...valid, amountCents: 12000, status: 'more_information', documents: [{ id: 'saved-evidence' }] } as unknown as Claim;
  expect(savedClaimStep(claim)).toBe(0);
});
it('restores a remembered step only when authoritative details and version permit it', () => {
  const claim = { ...valid, amountCents: 12000, status: 'draft', documents: [], updatedAt: 'v1' } as unknown as Claim;
  expect(restoredClaimStep(claim, { step: 2, updatedAt: 'v1' })).toBe(2);
  expect(restoredClaimStep({ ...claim, description: '' }, { step: 2, updatedAt: 'v1' })).toBe(0);
  expect(restoredClaimStep({ ...claim, status: 'more_information', updatedAt: 'v2' }, { step: 2, updatedAt: 'v1' })).toBe(0);
  expect(restoredClaimStep({ ...claim, status: 'more_information' }, { step: 2, updatedAt: 'v1' })).toBe(2);
});
it('preserves the evidence step when a confirmed upload changes the resubmission version', () => {
  const claim = { ...valid, amountCents: 12000, status: 'more_information', documents: [{ id: 'saved-evidence' }], updatedAt: 'v2' } as unknown as Claim;
  expect(restoredClaimStep(claim, { step: 1, updatedAt: 'v1', status: 'more_information' }, true)).toBe(1);
  expect(restoredClaimStep(claim, { step: 2, updatedAt: 'v1', status: 'submitted' }, true)).toBe(0);
});

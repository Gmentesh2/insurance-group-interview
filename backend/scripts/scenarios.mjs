import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = 'http://localhost:5081/api/v1';
let cookie = '', checks = 0;
async function call(path, body, status = 200, headers = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { cookie, origin: 'http://localhost:3001', ...(body === undefined ? {} : body instanceof FormData ? {} : { 'content-type': 'application/json' }), ...headers }, ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
  const updatedCookie = response.headers.getSetCookie().find(x => x.startsWith('ig.interview.session='));
  if (updatedCookie) cookie = updatedCookie.split(';')[0];
  const data = await response.json(); assert.equal(response.status, status, `${path} ${data.error?.code ?? ''}`); checks++; return data;
}
const today = new Date().toISOString().slice(0, 10);
const trip = { residenceCountry: 'GE', destinationCountries: ['DE'], startDate: today, endDate: today, travelers: [{ age: 30 }] };
const birth = `${Number(today.slice(0, 4)) - 30}${today.slice(4)}`;
const travelers = [{ firstName: 'Demo', lastName: 'Scenario', dateOfBirth: birth }];
const email = `scenario-${randomUUID()}@example.test`, password = 'Interview!Strong2026-' + randomUUID();
const guest = await call('/quotes', { ...trip, scenario: 'single_offer' });
assert.equal(guest.quotes.length, 1);
await call('/auth/register', { email, password }); // registration, independently from login, absorbs current protected guest
await call('/quote-sessions/' + guest.id);
const waiting = [];
for (const scenario of ['no_offers', 'many_offers', 'quote_expired', 'price_changed', 'declined', 'issuance_pending', 'bind_unknown', 'document_delayed']) {
  const session = await call('/quotes', { ...trip, scenario });
  if (scenario === 'no_offers') { assert.equal(session.quotes.length, 0); continue; }
  if (scenario === 'many_offers') { assert.equal(session.quotes.length, 6); continue; }
  const quoteId = session.quotes[0].id;
  if (scenario === 'quote_expired') { assert.equal((await call('/orders', { quoteId }, 409)).error.code, 'QUOTE_EXPIRED'); continue; }
  if (scenario === 'price_changed') {
    const changed = await call('/orders', { quoteId }, 409); assert.equal(changed.error.code, 'PRICE_CHANGED'); assert.equal(Number(changed.error.fields.currentTotalCents), session.quotes[0].totalCents + 500);
  }
  const order = await call('/orders', { quoteId, acceptPriceChange: true });
  await call(`/orders/${order.id}/customer-details`, { travelers });
  const paid = await call(`/orders/${order.id}/pay`, {});
  if (scenario === 'declined') { assert.equal(paid.status, 'payment_declined'); assert.equal(paid.paymentStatus, 'declined'); assert.equal(paid.policyId, null); }
  if (scenario === 'issuance_pending' || scenario === 'bind_unknown') { assert.equal(paid.status, scenario); assert.equal(paid.paymentStatus, 'paid'); assert.equal(paid.policyId, null); waiting.push(paid); }
  if (scenario === 'document_delayed') { assert.equal(paid.status, 'issued'); const p = await call('/policies/' + paid.policyId); assert.equal(p.documentStatus, 'pending'); assert.equal((await call(`/policies/${p.id}/documents`, undefined, 409)).error.code, 'DOCUMENT_PENDING'); waiting.push(paid); }
}
const claimsPolicy = (await call('/policies')).policies[0];
const claim = await call('/claims', { policyId: claimsPolicy.id });
const abandoned = randomUUID(); await call(`/claims/${claim.id}/uploads/${abandoned}/abandon`, {});
const form = new FormData(); form.set('attemptId', abandoned); form.set('file', new Blob(['%PDF-1.7\nexample'], { type: 'application/pdf' }), 'example.pdf');
assert.equal((await call(`/claims/${claim.id}/documents`, form, 409)).error.code, 'UPLOAD_ATTEMPT_EXPIRED');
const assistant = await call('/assistant/status');
if (!assistant.configured) {
  assert.equal((await call('/assistant/chat', { locale: 'en', message: 'Explain travel insurance.' }, 503)).error.code, 'ASSISTANT_NOT_CONFIGURED');
  assert.equal((await call('/assistant/chat', { locale: 'en', message: 'Explain.', policyId: claimsPolicy.id }, 422)).error.code, 'POLICY_CONSENT_REQUIRED');
  await call('/assistant/chat', { locale: 'en', message: 'Explain.', policyId: randomUUID(), sharePolicy: true }, 404);
  await call('/assistant/chat', { locale: 'en', message: 'x'.repeat(1501) }, 422);
  const previous = cookie; cookie = '';
  await call('/assistant/chat', { locale: 'en', message: 'Explain.', policyId: claimsPolicy.id, sharePolicy: true }, 401);
  cookie = previous;
}
await new Promise(resolve => setTimeout(resolve, 15500));
for (const item of waiting) {
  const reconciled = await call(`/orders/${item.id}/reconcile`, {}); assert.equal(reconciled.status, 'issued');
  const policy = await call('/policies/' + reconciled.policyId); assert.equal(policy.documentStatus, 'ready');
}
console.log(`Scenario and assistant-boundary regression passed: ${checks} requests. Provider calls ${assistant.configured ? 'not exercised here' : 'unavailable without key, correctly reported'}.`);

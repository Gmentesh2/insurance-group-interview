import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { config } from '../../scripts/config.mjs';

// Focused integration regression. Creates only fictional accounts; no mail/provider calls.
const env = await config();
const base = env.API_URL ?? 'http://localhost:5081';
const origin = env.FrontendUrl ?? 'http://localhost:3001';
const email = `password-policy-${randomUUID()}@example.test`;
const password = Array.from({ length: 8 }, () => String.fromCharCode(97 + randomInt(26))).join('');
let cookie = '', checks = 0;
async function call(path, body, expected = 200) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { cookie, origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, expected, `${path} status`);
  const updated = response.headers.getSetCookie().find(value => value.startsWith('ig.interview.session='));
  if (updated) {
    assert.match(updated, /httponly/i);
    cookie = updated.split(';')[0];
  }
  const data = await response.json();
  checks++;
  return data;
}
await call('/auth/register', { email, password: password.slice(0, 7) }, 422);
await call('/auth/register', { email, password: 'a'.repeat(129) }, 422);
assert.equal((await call('/auth/session')).user, null);
const registered = await call('/auth/register', { email, password });
assert.equal(registered.user.email, email);
assert.equal(registered.user.isGuest, false);
await call('/auth/sign-out', {});
assert.equal((await call('/auth/session')).user, null);
await call('/auth/login', { email, password: password + 'x' }, 401);
assert.equal((await call('/auth/login', { email, password })).user.id, registered.user.id);
await call('/auth/sign-out', {});
await call('/auth/guest', {});
const guest = await call('/auth/guest-access/credentials', {
  email: `password-policy-guest-${randomUUID()}@example.test`, password, register: true,
});
assert.equal(guest.user.isGuest, false);
await call('/auth/sign-out', {});
if (env.DemoAccount__Username && env.DemoAccount__Password) {
  const demo = await call('/auth/login', { email: env.DemoAccount__Username, password: env.DemoAccount__Password });
  assert.equal(demo.user.username.toLowerCase(), env.DemoAccount__Username.toLowerCase());
  assert.equal(demo.user.role, 'customer');
  assert.equal(demo.user.isGuest, false);
  await call('/auth/sign-out', {});
}
console.log(`Password policy passed: ${checks} HTTP requests; 7/129 rejected, 8 lowercase accepted, login and guest registration verified.`);

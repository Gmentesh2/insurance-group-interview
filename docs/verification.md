# Verification —16 October2026

Scope: this isolated interview adaptation, not a production readiness certification. Original Insurance Group remained at83e0231 with a clean working tree; its preview/services/database were not modified. New preview is localhost3001, API5081 and independent PostgreSQL55462.

## Backend

ASP.NET Core/EF Core10 builds completed with zero warnings/errors. Real checked-in EF migrations were applied to the separate PostgreSQL16 database; no EnsureCreated or Supabase business fallback. A GUID child-tracking defect found during initial integration was fixed with explicit application-generated keys and a metadata migration. Evidence content was split from metadata with an additive migration so list reads never materialize attachment blobs.

`backend/scripts/smoke.mjs` passed61HTTPrequests covering:
- Registration, credential login/logout, password validation, secure cookie attributes, origin rejection and operator denial.
- Guest purchase ownership transfer after valid credentials; contact email does not grant the recipient access. Stale guest access fails after transfer. Two-user orders/quotes/policies/claims/evidence isolation returns inaccessible404.
- Quote/order creation, traveler save, repeat/concurrent simulated payment creating one policy, and private PDFs in EN/DE/RU.
- Claim create/read/update/delete, owner-bound idempotency conflict/retry, stale-version409 including stale DELETE JSON body retaining the draft, status/submission/review/resubmission, operator private evidence download.
- Private multipart evidence, content signature checks and retry attachment identity.

`backend/scripts/scenarios.mjs` passed46HTTPrequests covering all ten demo scenarios: success, no/single/many offers, declined payment, pending/unknown issuance, delayed documents, expired quote and changed price. Pending issuance/documents later reconciled correctly. Also checked guest registration transfer, abandoned upload tombstones, assistant missing-key503, invalid/oversized input422, nonconsensual policy context422, unauthenticated401 and cross-owner404.

`backend/Regression` passed deterministic Gemini adapter checks using a fake HTTP handler, no network and no actual key: canceled acquisition releases the per-client slot, fixed endpoint/header-key/no tools, server source whitelist, bounded64KiB response, malformed/empty reply502, quota429 and missing configuration503. Provider responses/quality/prompt adherence remain unverified without a real key.

Focused independent review found and verified fixes for stale draft deletion ignoring the JSON version, evidence lists loading blobs, assistant cancellation leaking a client slot, and oversized assistant replies violating subsequent history bounds. No remaining blocker was identified in reviewed backend/auth/ownership/provider boundaries. This is focused review, not exhaustive penetration testing.

## Frontend and browser

Final frontend typecheck, full ESLint and production build passed. Build produced31staticpages using two workers and2048MiB heap cap. The existing relevant frontend suite passed46tests in10files. Old Supabase backend tests were not retained as false evidence for C#; HTTP/EF integration has separate checks above. One final integration build was repeated after removing a retired translation hook and replacing the homepage quote generator with fixed presentation-only example data.

A real browser journey against C# passed:
1. Registration with a fictional account; switching EN→DE→EN retained email and registration mode. Passwords were entered only into the mounted form.
2. Residence/destination selection, date/age input, real demo quote results, Comfort selection and persisted order.
3. Traveler save/review, explicit simulated payment and issued demo policy.
4. Policy details, private PDF download and claim creation.
5. Delete confirmation/cancel UI; no existing user data was deleted. Actual DELETE success/version protection is verified by the isolated HTTP fixture script.
6. Claim incident edit/save, upload of the generated fictional PDF, review/consent and submitted state/history. Submission stayed distinct from approval/payment.
7. Assistant unconfigured notice, disabled sending and both consent controls unchecked. No live Gemini request was made.
8. Sign-out and password sign-in screen with transparent illustration backing and card-level back action.

Auth layouts checked in EN/DE/RU at360/390/768/1440px: no horizontal page overflow, localized product-return hrefs,44px widget back targets and transparent computed artwork background. Native required/email/password constraints are enabled (form.noValidate=false); blank submission focuses Email and keeps invalid required fields on the form. The browser tool did not expose native validationMessage text, so exact platform tooltip wording was not asserted. Domain/date and password-confirmation errors remain localized inline text.

Saved previews contain blank authentication/public assistant UI, no credentials or customer records: [auth desktop](previews/auth-transparent-en-desktop.jpg), [Russian auth mobile](previews/auth-transparent-ru-mobile.jpg), [assistant without key](previews/assistant-unconfigured-en-desktop.jpg). A final browser error sample was empty.200%zoom, reduced-motion emulation, screen-reader speech, formal contrast/performance audits and other engines remain unverified.

## Infrastructure and remaining integration

Independent infrastructure review confirmed project-pinned Compose start/stop and per-command secret boundaries after fixes. Frontend child processes receive only runtime variables and API_ORIGIN; database commands receive only their required password. Root.env is mode0600, ignored and generated with random local database/operator credentials. New PostgreSQL is capped256MiB/0.5CPU and measured about59MiB at idle after checks; existing project services remained untouched.

Gemini key must be supplied privately and revoked if exposed. No real key has been committed or used; no artificial live response is shown. README documents limitations, local startup, migrations, model, source reuse and requirements. Current integrations are demo insurer/payment only; production email/reset, background processing, real financial reconciliation, retention and operational hardening remain out of scope.

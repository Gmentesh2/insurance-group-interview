# Interview adaptation implementation plan

Goal: deliver the existing Insurance Group experience in a separate repository using React/TypeScript/Tailwind and a C#/ASP.NET Core Web API backed by PostgreSQL and EF Core. Original source: InnovationEdge/insurance-group at 83e0231ab6adb0e01910878fd301678029889c6c. Never alter the original checkout, database, secrets or running preview.

Architecture: frontend/ retains the Next.js presentation and typed /api/v1 JSON contracts; a same-origin rewrite delegates to backend/. ASP.NET Core Identity owns password hashing and secure cookie authentication. EF Core owns migrations and normalized users/orders/travelers/policies/claims/evidence/events. Snapshot JSON is limited to immutable quote/trip benefit data. PostgreSQL database, credentials, cookie names, ports and private files are isolated.

Tech stack: React, TypeScript, Next.js, Tailwind, Base UI, next-intl; .NET 10, ASP.NET Core, Identity, EF Core, Npgsql, PostgreSQL. Simulated quotes/payment only. No live integration, background service or optional chatbot in this pass.

## 1. Isolation and reproducibility (primary agent)
- [ ] Move existing UI into frontend/, exclude environment files, remove obsolete TypeScript backend/Supabase startup and misleading old verification artefacts from deliverables.
- [ ] Add scoped local database/bootstrap/start scripts, root instructions and .gitignore. Use separate database/user on available local PostgreSQL; do not alter original schema/settings. Separate container only if necessary.
- [ ] Preserve asset provenance, original source credit and clean logical commits. Create private GitHub repository insurance-group-interview.

## 2. ASP.NET Core implementation (backend owner)
- [ ] Typed camelCase DTOs preserving frontend contract/date/cents/status/error codes; bounded request validation and private no-store errors.
- [ ] Identity register/login/logout/session; authorized guest sessions if retained, safe guest-owner transfer after valid credentials, session protection, CSRF/origin checks and operator role provisioned only by explicit seed configuration.
- [ ] EF relational model and real checked-in migration for users/quotes/orders/travelers/policies/claims/evidence/activity, foreign keys/unique constraints. No calls to old Supabase backend.
- [ ] Quotes, customer details, simulated payment/reconciliation and policy endpoints preserve distinct payment/issuance/document states and concurrent idempotency.
- [ ] Claim CRUD (DELETE draft only), optimistic version checks, submission/resubmission, bounded private evidence uploads with attempt IDs, signature checking and owned download; protected operation review.
- [ ] Private generated demo certificate and truthful display-rate availability. Maintain API-compatible response envelopes and binary document behavior.
- [ ] Build backend once after integration; focused executable HTTP regression checks for credentials, ownership, CRUD and duplicate operations.

## 3. Frontend adaptation (primary agent)
- [ ] Replace OTP sign-in with localized registration/password forms while retaining shared UI and session recovery.
- [ ] Replace guest save-access OTP screen with credential-based account linking. Remove obsolete inbox and OTP calls.
- [ ] Route every business request to C#; remove server-side privileged JS persistence. Keep only non-sensitive presentation fixtures in Next.js.
- [ ] Add explicit confirmed draft deletion UI with loading/error/recovery behavior and native return navigation. Preserve forms, progress, comparison, wallet/documents/claims/operations.
- [ ] Update all three locales and public/help/demo descriptions to match actual scope and auth behavior.

## 4. Review and delivery
- [ ] Run registration → quote → travelers → simulated payment → policy → PDF → claim create/read/edit/delete, then submission and operator information-request/resubmission.
- [ ] Check unauthenticated access, two-user ownership isolation, invalid inputs, duplicate payment/creation and upload retry.
- [ ] Focused independent correctness/security and TypeScript reviews; fix blockers. Batch frontend typecheck/lint, backend build, targeted regressions and one final frontend build, sequentially.
- [ ] Inspect desktop/mobile localized sign-in and claim controls, save only synthetic/private-free previews.
- [ ] README covers purpose, dependencies, local startup, EF migrations, model/relations, design choices, limitations and source reuse. Save requirement matrix and verification evidence without real credentials.
- [ ] Commit/push and verify clean branch/remote agreement. Keep original preview/services intact; stop temporary verification processes.

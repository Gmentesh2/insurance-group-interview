# Interview submission completion plan

**Goal:** Deliver an explainable, reproducible full-stack demonstration that meets the supplied assignment by 19 October, without changing the original Insurance Group project.

**Architecture:** Retain the isolated React/Next presentation, ASP.NET Core business API, Identity and EF Core/PostgreSQL. Complete the remaining presentation and handoff checks; add no new framework, service or insurance product to satisfy an already implemented requirement.

**Tech stack:** React, TypeScript, HTML/CSS, Tailwind, C#/ASP.NET Core, Identity, Entity Framework Core, PostgreSQL; optional server-side Gemini.

**Execution:** Work inline in the existing interview repository. Follow its AGENTS.md and existing user preferences: focused verification, low concurrency, no cosmetic test campaign and no changes to the original repository.

## Scope confirmed with the user

The user narrowed delivery to mandatory assignment requirements. Further landing redesigns, live integrations and the optional Gemini milestone are deferred. This plan does not require completing a production insurance platform.

## Current status

Code/evidence baseline: `cf30bc2`, 16 October 2026. No missing mandatory feature was identified in this scoped audit. The mandatory features are implemented and have recorded verification; this is not a claim that every possible defect has been excluded. See [requirements](../../requirements.md) and [actual verification](../../verification.md). This planning pass inspected the current implementation and confirmed API health and HTTP200 for the account preview; it did not rerun previously passing suites.

| Assignment area | Current implementation | Remaining acceptance work |
| --- | --- | --- |
| React/TypeScript/HTML/CSS/Tailwind | Existing localized frontend, reusable controls and C# API integration | Focused review of remaining inconsistent form wrappers and prompts |
| Loading, validation, errors and empty states | Native constraints plus domain validation, first-error focus, recovery/empty UI | Check the changed form paths once together; repair only reproduced defects |
| C#/ASP.NET Core REST API | Feature endpoints, services, domain/infrastructure boundaries and typed failures | Prepare a short endpoint/code explanation for the interview |
| PostgreSQL/EF Core/model/migrations | Relational ownership/workflows, JSONB snapshots, three checked-in migrations | Rehearse setup from a clean checkout/environment without reusing this machine's ignored configuration |
| Complete CRUD | Claims create/read/update/delete; deletion intentionally limited to drafts | Demonstrate all four operations with disposable fictional records |
| Registration/login/password security | ASP.NET Core Identity hashing, sessions, lockout/rate limiting | Show real registration/login/logout and explain why the password remains required by the assignment |
| Protected resources/user isolation | Server ownership/role checks and private files, reviewed guest transfer | Show existing two-user test evidence; repeat only if related code changes |
| Git/README/model/limitations | Private GitHub repository, logical actual history, setup/model/verification/source attribution | Confirm reviewer repository access and present the final branch/commit |
| Optional AI chatbot | UI, C# Gemini adapter, embedded project prompt, consent/ownership bounds | Private key/model/quota configuration and real-provider verification remain pending |

## Ordered remaining work

### 1. Finish consistency where it affects use

Files: `frontend/src/components/{form-field,quote-form,checkout-travelers,claim-details-form,password-auth}.tsx`, `frontend/src/features/products/product-details-widget.tsx`, affected EN/DE/RU messages and existing style modules. Inspect `frontend/DESIGN.md` before edits.

- [ ] Compare the homepage Travel widget, product preferences, traveler details and claim details against the shared field anatomy. Reuse existing components; do not make every widget show the same irrelevant prompt.
- [ ] Keep visible labels, blank numeric/name/email fields and a common localized date-format prompt. Selection prompts name the specific choice; hints/errors remain associated with their control.
- [ ] Check required/invalid/disabled states, typing/deleting in date segments, first-error focus and cancel/edit behavior. Inspect the changed paths on mobile and desktop in EN/DE/RU, rather than checking unrelated pages repeatedly.
- [ ] Check 200% browser zoom and reduced-motion behavior if the available browser supports them. Record any tool limitation instead of claiming a pass.

Completion: no reproduced field inconsistency or broken edit/validation path remains in the reviewed screens. A regression is added only for a substantive defect.

### 2. Make delivery reproducible

Files: `README.md`, `scripts/{configure,run,config}.mjs`, `compose.yaml`, `backend/Migrations`, `docs/verification.md`.

- [x] Rehearse the documented clean-checkout setup with its own generated configuration and fresh database. Preserve the active preview, original services and existing data. Use a separate isolated database name/connection or a separate assessment machine; never reset the current volume for this check.
- [x] Apply the checked-in EF migrations, start API and frontend, register a fictional user and confirm the first empty account screen. Verify no copied `.env` or pre-existing records are needed.
- [ ] Confirm the reviewer has access to the private repository and identify `codex/interview-platform` as the current submission branch. Granting access needs the reviewer's identity and the user's authorization; do not make the repository public as a workaround.
- [x] Update verification with the exact setup result. Fix documentation or startup defects only if observed.

Completion: a reviewer can reproduce the app from the documented prerequisites and repository without receiving credentials in source.

### 3. Rehearse the technical presentation

Files: `docs/architecture.md`, `docs/requirements.md`, `docs/verification.md`, this plan. Reuse existing evidence; change application code only for a reproduced defect.

- [ ] Run the short walkthrough below with disposable fictional records. Finish the previously unobserved browser request-for-information/resubmission path, plus visible draft deletion; backend checks already cover these transitions.
- [x] Prepare explanations of Identity password hashing/session cookies, server ownership checks, EF relationships/migrations, immutable purchased snapshots, idempotency/version conflicts and the demo-wide advisory-lock tradeoff.
- [ ] Record the final commit and remaining limitations. Retain source attribution: the frontend was adapted from an existing project, not created entirely from scratch during this assignment.

Completion: the presenter can demonstrate the requirements and explain the code and limitations in their own words.

### 4. Optional live Gemini check

Files: ignored root `.env`, `backend/Features/AssistantEndpoints.cs`, `frontend/src/components/assistant-page.tsx`, `docs/assistant-system-prompt.md`, `docs/verification.md`.

- [ ] Configure a private server-side API key and an enabled model, then restart only the interview API. Never place the key in Git, screenshots, chat transcripts or frontend variables.
- [ ] Ask one public product/workflow question and one explicitly consented owned-policy question. Confirm answers use available facts and do not promise eligibility, coverage, claim approval or payment.
- [ ] Ask for unavailable information and verify an honest limitation. Check quota/provider failure through the existing deterministic adapter evidence rather than intentionally burning quota.
- [ ] Mark live replies verified only after observing them. Keep the unavailable state if no key is supplied; the chatbot is optional in the assignment.

Completion: real-provider behavior has evidence, or the optional limitation remains clearly documented.

## Interview walkthrough

1. Explain the architecture and show that Next forwards business requests to the C# API. Start at `/en`; explain Travel is the working demo and eight categories are previews.
2. Register a fictional account, sign out and sign in. Show field validation and the account's empty state.
3. Enter a Travel trip, compare total/excess/limits, complete traveler review and the explicitly simulated payment. Open the issued demo policy and download its private certificate.
4. Create a draft claim, read it from the list, edit/save it and delete that disposable draft through the real confirmation. This visibly demonstrates CRUD without deleting a submitted claim.
5. Create another draft, attach fictional evidence and submit it. As the separately provisioned operator, request additional information with a useful customer-visible note. Return as the customer, provide the requested details/evidence, resubmit and show activity history. No status implies reimbursement.
6. Explain the existing two-user isolation and duplicate-operation checks. Show the reviewed source/tests instead of exposing customer data or repeating a broad campaign.
7. Demonstrate the assistant only if configured; otherwise show its truthful unavailable state. End with documented limitations, setup/migrations and source attribution.

## Verification gate after actual code changes

Run relevant tests only for changed behavior. At an integration point, batch:

```sh
pnpm --dir frontend typecheck
pnpm --dir frontend exec eslint src/components/form-field.tsx src/components/quote-form.tsx src/components/checkout-travelers.tsx src/components/claim-details-form.tsx src/components/password-auth.tsx src/features/products/product-details-widget.tsx
NODE_OPTIONS=--max-old-space-size=2048 pnpm --dir frontend build
```

The scoped lint command covers the form modules listed in task 1; adjust it if the actual implementation touches other files. Backend builds/HTTP checks are needed only after related C#/contract/database changes. Do not add a test simply to prove a radius or copy change. Documentation-only work needs content/link checks, not an application build.

## Separate product milestones

Real Flitt/insurer activation, Health purchasing, the remaining categories, native apps, social/phone/QR authentication, production password recovery/email verification and operational deployment are outside this assignment's mandatory scope. They belong to later product work and must not be represented as completed or required for interview submission.

## Execution checkpoint —16 October2026

Mandatory acceptance evidence is recorded in docs/verification.md. Clean-clone setup and browser registration/empty state passed with an isolated temporary database; temporary services/data/checkout were removed. Draft create/read/update/reload passed; confirmation/cancel UI was checked and guarded authenticated DELETE removed only the disposable draft. Browser permanent-delete activation was not performed, so that checkbox above remains qualified rather than overstated. Operator request/customer resubmission/history passed with the existing fictional evidence retained. Existing shared-field checks were reused; no new cosmetic pass, packages or application patch was needed.

The presentation guide is docs/interview-presentation.md. Reviewer GitHub access and the human presenter's own rehearsal are handoff items. Optional Gemini,200%zoom, reduced-motion emulation and screen-reader speech remain outside the completed evidence. Unchecked broader design/optional tasks are deferred by the narrowed user scope, not missing mandatory features.

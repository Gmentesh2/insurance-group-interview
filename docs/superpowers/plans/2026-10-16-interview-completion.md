# Interview submission completion checkpoint

**Goal:** An explainable full-stack demonstration meeting the supplied assignment by 19 October, isolated from the original Insurance Group project.

**Scope:** React/TypeScript/HTML/CSS/Tailwind, ASP.NET Core Web API, Identity password authentication, EF Core/PostgreSQL, complete draft-claim CRUD, protected owner data, documentation and Git history. The user subsequently resumed the optional Gemini assistant; that bounded feature is also implemented.

## Completed work and evidence

| Area | Current status |
| --- | --- |
| Frontend and API integration | Localized reusable controls, validation, loading/error/empty states; C# owns business operations. Shared-field and date editing checks recorded. |
| Authentication and isolation | Identity password-only registration/login/logout (8–128 characters, no composition rules), private sessions/files, owner and role enforcement; A/B denial and guest-transfer checks recorded. |
| Purchase and claims | Travel demo purchase → issued policy → private PDF → claim/evidence → submission; operator information request and customer-browser resubmission recorded. |
| CRUD | Disposable draft created/read/edited/saved/reloaded. Delete confirmation/cancel UI inspected; actual versioned deletion exercised through authenticated API. Permanent-delete button activation was not repeated in the browser. |
| Reproducibility | Clean local clone with generated private configuration, fresh database/role, all three migrations, temporary API/web and browser registration/empty state. Existing package caches/prerequisites were used; temporary resources were removed. |
| Optional assistant | Shared public widget/full-page chat, server-only key, explicit message sharing and separately consented owner-checked policy context. Six bounded live EN/DE/RU/fictional-policy examples recorded. |
| Checks and reviews | Relevant frontend tests/typecheck/lint/build, backend build/HTTP suites and deterministic adapter checks recorded. Latest regression-script fix keeps four pre-provider assistant boundary checks active with or without a key. Focused independent review found no blocker. |
| Handoff | README/model/requirements/verification/source attribution, Georgian presentation guide and root SUBMISSION.md. User confirmed assessor repository access. |

The application baseline before the final script/documentation follow-up is `1c2ae81`; use the submission branch HEAD for the delivered version. Exact commands, observations and limits are in [verification](../../verification.md). Historical checks were not rerun merely to refresh a report.

## Remaining human preparation

The presenter should rehearse the [Georgian walkthrough](../../interview-presentation.md), explain the implementation in their own words and keep fictional demo records ready. The private repository is on branch `codex/interview-platform`; assessor access was confirmed by the user. See [SUBMISSION.md](../../../SUBMISSION.md) for the delivery entry point.

## Explicit limits

Only Travel is purchasable as a demo; eight categories are preference previews. Live insurer/Flitt activation, native apps, production email/reset, operational deployment and further product expansion remain separate work. No public Internet deployment was requested for submission.

Registration OTP/email delivery was explicitly declined by the user; it is not implemented. 200% zoom, OS reduced-motion emulation, screen-reader speech and other browser engines remain unverified. Clean-clone evidence covers this machine with installed prerequisites/caches, not every environment. Observed AI answers do not guarantee model correctness. These limitations must remain visible rather than be replaced with unchecked completion claims.

## Further changes

Add application code only for a reproduced in-scope defect. Run the smallest relevant checks; batch builds after real integration changes, never for documentation alone. Keep local services/load low and preserve both previews and the original repository.

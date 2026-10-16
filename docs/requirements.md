# Assignment requirements and implementation

The supplied assignment requires a working full-stack application by 19 October, emphasizing mandatory quality over extra complexity. This repository is a separate adaptation of an existing Insurance Group interface; source reuse is explicitly credited in UPSTREAM.md.

| Requirement | Implementation / evidence |
| --- | --- |
| React, TypeScript, HTML/CSS, Tailwind | frontend/src, package.json; Next.js uses React and is not prohibited by the supplied assignment. |
| Logical reusable components and API integration | Shared form/navigation/feedback/illustration controls; same-origin /api/v1 forwarding to C#. |
| Form validation and loading/error/empty states | Native required/email/password constraints plus localized inline domain/date validation; loading/retry/empty/version-conflict UI. |
| C#, ASP.NET Core Web API | backend/InsuranceGroup.Api.csproj and Program.cs; feature-organized minimal REST endpoints and services. |
| Business/data organization and HTTP status codes | Domain contracts/validation; feature services/endpoints; Infrastructure EF/Identity/provider adapters; typed 401/403/404/409/413/422/429/5xx envelope. |
| PostgreSQL or SQL Server | Independent PostgreSQL 16 database and named volume; original database is never used. |
| Entity Framework Core | InsuranceDbContext, typed relationships, constraints, checked-in EF migrations and local dotnet-ef manifest. |
| Complete CRUD | Claims GET list/detail, POST, PATCH, DELETE saved drafts. Submitted claims/policies are not deleted to demonstrate CRUD artificially. |
| Registration, login, password security | ASP.NET Core Identity, 8–128-character passwords without composition rules, hashing/validation, login lockout and rate limits; separate HttpOnly session cookie. No password storage in frontend drafts. |
| Protected resources / user isolation | Authoritative owner-filtered orders/policies/claims/private files; operator role checks; A/B denial tests, credential-verified guest transfer. |
| Optional contextual AI chatbot | C# Gemini adapter + localized frontend + embedded prompt. Public product/workflow facts; consent-gated minimal owned-policy cover. A private local key now supports live public EN/DE/RU examples and a consented fictional-policy answer; compact widget requires no sign-in. An unconfigured installation still shows unavailable. See verification for limits. |
| Git repository / logical commits | Dedicated private GitHub repository; actual adaptation history, no fabricated backdated commits. |
| README: purpose/features/tech/startup/DB/migrations/architecture/limitations | Root README and docs/architecture.md. |
| Data model description | docs/architecture.md with relationships and snapshot/evidence boundaries. |
| Explain unfinished functionality | README limitations and docs/verification.md separate checked behavior from remaining integration work. |

Out of scope: live insurer/Flitt activation, native apps, purchasing eight preview categories, production email/password reset, full operational deployment and a claim that AI answers are correct without live verification.

## Delivery status — 16 October 2026

All mandatory feature areas above have implementations and recorded evidence. Clean-clone migration/startup/registration, disposable draft CRUD and customer-browser additional-information resubmission were rehearsed. Optional Gemini was subsequently configured privately and checked with six bounded live examples; the public widget requires no sign-in. See [verification](verification.md) for the exact scope and remaining limitations.

The user confirmed that the assessor already has access to the private repository. The submission branch is `codex/interview-platform`. The remaining human task is the presenter's own demo/code rehearsal; no additional insurance product or public deployment is required by the supplied assignment. See [submission handoff](../SUBMISSION.md) and the [completed plan](superpowers/plans/2026-10-16-interview-completion.md).

Registration email OTP was considered and explicitly declined by the user. Authentication remains password-only; email delivery/confirmation is not represented as implemented.

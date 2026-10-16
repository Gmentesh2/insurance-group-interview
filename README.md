# Insurance Group — interview edition

A travel-insurance **demonstration** adapted to the interview assignment: React/TypeScript frontend, C#/ASP.NET Core Web API, EF Core and PostgreSQL. The interface supports English, German and Russian. Providers, payment and policy cover are fictional; certificates state **DEMO — NOT VALID INSURANCE**.

The interface is reused and adapted from an existing project; [UPSTREAM.md](UPSTREAM.md) identifies its source commit and the new work. The original Insurance Group repository and database remain separate. [Requirements](docs/requirements.md), [architecture/data model](docs/architecture.md), [verification](docs/verification.md), [assistant prompt](docs/assistant-system-prompt.md), [completion and presentation plan](docs/superpowers/plans/2026-10-16-interview-completion.md).

## Features

- Password registration, sign-in/sign-out, secure server-managed sessions, optional guest checkout and credential-verified guest purchase linking.
- Travel quotes/comparison → travelers → explicit simulated payment → issued policy → private certificate in EN/DE/RU.
- Claims: create, read, edit and permanently delete **drafts only**; submit, attach evidence, follow status, and resubmit requested information. Requested amounts never imply approval/payment.
- Operator workspace for search, order reconciliation, claim review and requests for information. Operator access is provisioned from private configuration, not a public registration email rule.
- Optional Gemini customer assistant with public workflow guidance and explicit, owner-checked policy-cover sharing. It performs no account or purchase actions.
- Field validation, progress, loading/error/empty states, retry and version conflicts; responsive shared controls and illustration system.

Only Travel is purchasable as a demo. The other eight categories are explicitly marked preference previews. EUR is the settlement/snapshot currency; USD is an optional reference display using ECB public data. No live insurer, Flitt charge, real insurance or native application is included.

## Technology

Frontend: React 19, TypeScript, Next.js 16, HTML/CSS, Tailwind 4, Base UI, next-intl, Zod. Next.js owns presentation and forwards `/api/v1` to C#; there is no Supabase or TypeScript business API fallback. `/api/display-rates` reads public ECB reference data only.

Backend: .NET 10 / ASP.NET Core minimal REST APIs, ASP.NET Core Identity with EF stores and password hashing, EF Core 10, Npgsql, PostgreSQL 16, PDFsharp with locally supplied Source Sans 3. Immutable quote/benefit snapshots use JSONB; users, ownership, travelers, policies, claims, evidence and history have relational records and constraints. Private evidence bodies are separate from metadata so lists do not load file contents.

## Local setup

Requires .NET 10 SDK (developed with 10.0.201), Node.js 22+, pnpm 10 and Docker Compose. Commands below run from the repository root.

```sh
node scripts/configure.mjs
node scripts/run.mjs db
pnpm --dir frontend install --frozen-lockfile
cd backend
dotnet tool restore
dotnet restore
cd ..
node scripts/run.mjs migrate
dotnet build backend/InsuranceGroup.Api.csproj --no-restore
```

`configure.mjs` creates an ignored, mode-0600 `.env` with random local database and operator passwords; it preserves existing configuration. `.env.example` documents names, not real credentials. The new database is isolated in its own named Docker volume, bound to `127.0.0.1:55462`. Compose is pinned to this project and capped at 256 MiB / 0.5 CPU. No original project services or settings are changed.

Start these in separate terminals:

```sh
node scripts/run.mjs api
node scripts/run.mjs web
```

Open **http://localhost:3001/en**. The API listens on **http://127.0.0.1:5081**; `/health` checks its own database. Use `localhost:3001` in the browser: mutation origins must match `FrontendUrl`. The original preview on port 3000 can continue running independently. Frontend subprocesses receive no database, operator or Gemini secrets.

Register your own fictional test account in the UI. Registration passwords require 12–128 characters with uppercase/lowercase letters, a digit and a symbol. For operations, use `Operator__Email` and the generated `Operator__Password` in your local `.env`; credentials are never committed. Stop each web/API terminal with Ctrl-C. Stop only the interview database with `node scripts/run.mjs db:stop`; its data volume is preserved.

### Database configuration and migrations

`ConnectionStrings__Insurance` in `.env` points to the independent database. `node scripts/run.mjs migrate` invokes `dotnet ef database update` with that private configuration. Migrations are checked in under `backend/Migrations`; `EnsureCreated` is not used. A fresh database applies all migrations. After pulling schema changes, stop the interview API, rerun migration, rebuild and restart it.

For a new migration, edit the EF model, then run from `backend/`:

```sh
dotnet ef migrations add MeaningfulChangeName
```

The design-time factory uses an offline schema-generation connection string when no runtime connection is provided; applying migrations always uses the configured wrapper. See [architecture.md](docs/architecture.md) for tables, relationships and constraints. Do not point this version at the original Supabase database.

### Optional Gemini setup

The assistant is intentionally unavailable until configured. In the ignored root `.env`, add:

```dotenv
Gemini__ApiKey=your-private-key
Gemini__Model=gemini-3.5-flash
```

Restart the API. Model availability depends on the Google account; choose an enabled `generateContent` model using `Gemini__Model` if needed. `GEMINI_API_KEY` / `GEMINI_MODEL` environment names are also accepted. Key handling and REST request structure follow [Google's API reference](https://ai.google.dev/api/generate-content).

Open `/en/assistant` or follow the Help link. Messages go to Google only after the user consents and sends a question. Policy sharing is independently opt-in and sends only plan/benefit/exclusion facts after server-side ownership checking. Names, emails, travel dates, claim narratives and evidence are not added to context. Do not type sensitive information into chat. Conversation history stays in page memory. Replies render as text; navigation links come from the server, not generated markup.

The key is sent only from C# in `x-goog-api-key`, never in a browser bundle, URL, repository, screenshot or provider log. **Do not publish a temporary key for assessment**: removing it from a file does not revoke it. The reviewer can supply their own local key or use the owner's configured deployment. Live Gemini response quality is unverified until a real key is supplied; deterministic adapter tests do not claim otherwise.

## Verification

```sh
pnpm --dir frontend typecheck
pnpm --dir frontend lint
pnpm --dir frontend test
NODE_OPTIONS=--max-old-space-size=2048 pnpm --dir frontend build
dotnet build backend/InsuranceGroup.Api.csproj --no-restore
dotnet run --project backend/Regression/InsuranceGroup.Regression.csproj
node backend/scripts/smoke.mjs
node backend/scripts/scenarios.mjs
```

The two HTTP scripts require the API/database to be running. They create fictional users and records in this database and cover authentication, CRUD, A/B ownership, concurrent payment/creation/upload retries, state conflicts, PDFs and demo recovery. The assistant adapter regression uses a fake HTTP handler and no key/network. Build sequentially; frontend generation is capped at two workers. See [actual evidence and limitations](docs/verification.md), rather than treating a successful build as proof of complete security/accessibility.

## Limitations

- This is an interview demo, not a production insurance system. Payments/providers are simulations. No real insurance advice, eligibility decision, reimbursement or coverage guarantee.
- Gemini live calls need a key and quota; unconfigured/provider-failure states are implemented. AI answers can be wrong; the purchased schedule and terms are authoritative.
- There is no production email confirmation, password reset, persistent chat history, malware scanner, background worker, operational retention policy or automated financial reconciliation.
- A database advisory lock serializes short mutations for correctness in this small demo; it intentionally limits write throughput. Pending issuance/documents reconcile through customer/operator requests.
- Evidence is bounded to 10 files × 10 MB per claim in private PostgreSQL storage. Content is loaded only for a specific authorized download; this is appropriate for the demo, not an unrestricted large-file service.
- HTTPS, durable Data Protection key management, managed operator roles, backups, monitoring, real provider contracts and further accessibility/security validation are needed before deployment for real customers.

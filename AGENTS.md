# Interview adaptation rules

This is a separate interview repository adapted from Insurance Group at 83e0231. Do not modify the original /Users/tiko/Documents/ChatGPT/Insurance Group repository or its database, secrets or services.

- Mandatory stack: React, TypeScript, HTML/CSS, Tailwind; C# ASP.NET Core Web API; PostgreSQL via Entity Framework Core with checked-in migrations; password registration/login with Identity.
- Retain the product design and EN/DE/RU translations. Read frontend/DESIGN.md before visual edits. Preserve guest purchase where supported; account linking requires verified credentials, never contact email alone.
- Backend owns every business/auth/private-document operation. Next.js is presentation and same-origin API forwarding only. Never retain a functional TypeScript/Supabase business fallback.
- Separate database/user, private storage, cookie name and ports from the original. No committed environment files, connection passwords or real customer data.
- Clear domain/service/HTTP/infrastructure boundaries and typed contracts. Validate input, enforce ownership, use transactions/constraints for duplicate operations, bounded uploads and recoverable errors.
- Use focused verification for complete flows, password/session behavior, CRUD, ownership and duplicate operations. No cosmetic tests or arbitrary coverage goals. Keep builds/test concurrency low and required services minimal.
- Review code/security before completion. Workers own assigned files; other contributors are active, so do not revert their work. Do not edit outside assigned boundaries without coordination.
- Honest README, source attribution and logical commits. Payments and policies remain explicit demonstrations. Optional chatbot is deferred until mandatory requirements pass.

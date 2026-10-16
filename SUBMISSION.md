# Interview submission

Repository: [InnovationEdge/insurance-group-interview](https://github.com/InnovationEdge/insurance-group-interview) (private). Submission branch: **codex/interview-platform**. The user confirmed assessor access on 16 October 2026. Use this branch's HEAD as the submitted version.

This is a travel-insurance demonstration adapted from an existing frontend, with a separate C#/ASP.NET Core backend, ASP.NET Core Identity, EF Core and PostgreSQL. It demonstrates the mandatory full-stack assignment; it is not live insurance. The optional server-side Gemini assistant is included. No credentials or API keys are supplied in the repository.

## Start and review

1. Follow [README setup](README.md#local-setup) to generate private configuration, start the isolated database, install dependencies, apply migrations and launch API/web. Requires .NET 10 SDK, Node.js 22+, pnpm 10 and Docker Compose.
2. Open `http://localhost:3001/en` and register a fictional account with an 8–128-character password. No uppercase, digit or symbol combination is mandatory; longer unique phrases are preferable. Registration is password-only, without email OTP. Travel is the purchasable demo; other products are marked previews.
3. Demonstrate quote/comparison → travelers → simulated payment → policy → private PDF → claim/evidence → submission. Create/read/edit/delete a separate disposable **draft** to show CRUD. A separately provisioned operator can request information; the customer can resubmit and view activity history.
4. Use the optional public assistant only after privately configuring a supported Gemini key/model. The full chat page supports independently consented, owner-checked policy facts. An unconfigured installation truthfully shows unavailable.

## Supporting material

- [Mandatory requirement mapping](docs/requirements.md)
- [Architecture, data model and technical decisions](docs/architecture.md)
- [Actual verification and limitations](docs/verification.md)
- [Georgian presentation and code walkthrough](docs/interview-presentation.md)
- [Completion checkpoint](docs/superpowers/plans/2026-10-16-interview-completion.md)
- [Assistant system prompt](docs/assistant-system-prompt.md)
- [Existing frontend source attribution](UPSTREAM.md)

The remaining handoff task is the presenter's own rehearsal and code explanation. Live insurer/payment activation, eight preview-product purchase flows, native applications and public production hosting are outside the supplied assignment. Accessibility/environment/provider limitations are explicitly recorded in verification; a passing build is not a production-readiness claim.

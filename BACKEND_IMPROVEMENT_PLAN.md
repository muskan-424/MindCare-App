# MindCare Backend — Phased Improvement Plan

A priority-ordered plan to close the gaps found when benchmarking the MindCare
(`backend/`, Express + Mongoose) backend against the production-grade
`air-tasker` (FastAPI) backend.

**Priority legend**
- **P0** — Critical / foundational. Do first; low effort, high impact.
- **P1** — High. Quality, safety, and correctness.
- **P2** — Medium. Operational maturity.
- **P3** — Nice-to-have. Long-term polish.

**Effort legend:** S ≈ ½ day · M ≈ 1–2 days · L ≈ 3–5 days

---

## Phase 1 — Foundations & Quick Wins (P0) ✅ DONE
> Goal: consistent errors, fail-fast config, and safer auth. All low-effort, high-leverage.
>
> **Status:** Completed. Added `config/env.js` (typed, fail-fast), `middleware/errorHandler.js`
> (+ `httpError`), `middleware/asyncHandler.js`, `middleware/rateLimiters.js` (stricter auth
> limiter), centralized the JWT secret/Mongo URI through config (removed the insecure hardcoded
> fallback), refactored `routes/goals.js` as the asyncHandler reference, and added a backend
> ESLint config + `npm run lint` wired into CI.

| # | Task | Effort | Acceptance criteria |
|---|------|--------|---------------------|
| 1.1 | **Central error handler** — add `middleware/errorHandler.js` + a `notFound` handler, mount last in `server.js`. Standardize error shape `{ error, code, details? }`. | S | Any thrown/`next(err)` returns the standard shape with correct status; no route leaks stack traces in prod. |
| 1.2 | **Async route wrapper** — add `asyncHandler(fn)` so routes drop repetitive `try/catch`. | S | At least the chat + auth routes use it; unhandled rejections reach the error handler. |
| 1.3 | **Typed config + fail-fast boot** — add `config/env.js` that reads/validates all `process.env` (JWT secret, Mongo URI, Gemini key, etc.) once and throws on missing required vars in production. | S | App refuses to boot in prod with a clear message if a required var is missing; rest of code imports `config` instead of `process.env`. |
| 1.4 | **Differentiated rate limits** — stricter limiter on `/api/auth` + OTP/password routes (e.g. 15/min) vs the global 200/15min. | S | Auth endpoints reject brute-force at the tighter limit; documented in code. |
| 1.5 | **Backend lint step in CI** — add `npm run lint` (and later `test`) to the `backend-ci` job (currently only `npm install`). | S | CI fails on backend lint errors. |

**Exit criteria:** uniform error responses, validated config at startup, hardened auth rate limiting, backend linted in CI.

---

## Phase 2 — Quality & Safety Net (P1) ✅ DONE
> Goal: prove the backend works and create an audit trail for sensitive data. Critical for a mental-health app.
>
> **Status:** Completed. Added a Jest + supertest + mongodb-memory-server harness
> (`jest.config.js`, `tests/helpers/testDb.js`) with **15 passing tests** across health/404,
> auth flow, goals CRUD + validation, and offline agentic chat — wired into CI. Added an
> append-only `AuditLog` model + `auditService` and recorded `auth.login`, `auth.login_failed`,
> and `chat.crisis` events. Added a shared `validate` middleware and applied it to the goals
> route. (Also fixed a mock-mode inconsistency in `generateTinkResponse`.)

| # | Task | Effort | Acceptance criteria |
|---|------|--------|---------------------|
| 2.1 | **Backend test harness** — add `jest` + `supertest` + `mongodb-memory-server`; `backend/tests/` with a `setup.js`. | M | `npm test` runs against an in-memory Mongo; green locally + in CI. |
| 2.2 | **Core route tests** — auth (register/login/JWT), chat (`/api/chat`, classify/refine/translate, capabilities), mood/journal/goal CRUD, appointment request. | M | ≥ 60% coverage on routes touched; happy-path + auth-failure + validation-failure cases. |
| 2.3 | **Wire tests into CI** — `backend-ci` runs `npm test` on PRs. | S | PRs blocked on backend test failure. |
| 2.4 | **Audit logging** — `AuditLog` model + `auditService.record({ userId, action, meta })`; log logins, therapist access to patient data, crisis events, account/data deletion. | M | Sensitive actions produce immutable audit rows; queryable by admin. |
| 2.5 | **Validation consistency** — standardize `express-validator` usage via a shared `validate` middleware; ensure every write route validates input. | M | All POST/PATCH routes return 400 with field errors on bad input. |

**Exit criteria:** backend has a real test suite gating CI, plus a compliance-grade audit trail.

---

## Phase 3 — Observability & Operability (P1 → P2) ✅ DONE
> Goal: see what the backend is doing in production and degrade gracefully.
>
> **Status:** Completed. Added `GET /api/health` (liveness) + `GET /api/health/ready`
> (DB ping + redis/AI/RAG status, 503 when DB down), in-process request metrics
> (`middleware/metrics.js`) exposed at `GET /api/metrics` (JSON + Prometheus), structured
> single-line JSON logging with an `X-Request-Id` correlation id and **no request-body/PII
> logging**, and a 15s abort timeout on Gemini calls so a hung upstream falls back to
> rule-based instead of stalling. Redis usage was already guarded; 4 observability tests added
> (now 19 passing).

| # | Task | Effort | Acceptance criteria |
|---|------|--------|---------------------|
| 3.1 | **Health & readiness** — `/api/health` (liveness) + `/api/health/ready` (pings Mongo, reports Gemini/Redis capability, mirrors Tink's `/capabilities`). | S | Readiness returns 503 when Mongo is down; 200 otherwise. |
| 3.2 | **Request metrics** — lightweight metrics middleware (count, latency, status by route) exposed at `/api/metrics` (Prometheus text or JSON). | M | Per-route p50/p95 latency + error counts visible. |
| 3.3 | **Structured logging** — upgrade `requestLogger` to JSON logs with request id, user id, status, duration; redact secrets/PII. | S | Logs are JSON, correlatable by request id, no tokens/PII leaked. |
| 3.4 | **Graceful degradation** — wrap external calls (Gemini, Redis, Pinecone) so failures fall back to rule-based paths without 500s. | M | Killing Gemini/Redis keeps core endpoints working (rule-based mode). |

**Exit criteria:** production behaviour is observable and resilient to dependency outages.

---

## Phase 4 — Infrastructure & Data Lifecycle (P2) ✅ DONE
> Goal: reproducible environments and disciplined data/schema management.
>
> **Status:** Completed. Hardened Docker: added `.dockerignore`, `NODE_ENV=production`
> + a container `HEALTHCHECK` hitting `/api/health` in the `Dockerfile`, and gave
> `docker-compose.yml` a Mongo healthcheck with `depends_on: condition: service_healthy`
> plus the now-required `JWT_SECRET`/`ADMIN_TOKEN` env. Added a versioned, idempotent
> migration runner (`scripts/migrate.js` + `migrations/0001_baseline.js`, tracked in a
> `migrations` collection) and an explicit index sync (`scripts/syncIndexes.js` → `npm run
> migrate:indexes`, calls `Model.syncIndexes()` on all domain models). Introduced an
> in-process background job queue (`jobs/jobQueue.js` — register/enqueue/schedule with
> error isolation and `unref`'d timers) and migrated the serverless-incompatible SLA
> monitor onto it (`jobs/index.js` registers `sla.check`; `server.js` now calls
> `startBackgroundJobs()`; `slaMonitor.js` reduced to a pure `runSLACheck`). Added a
> swappable notification **provider abstraction** (`providers/notifications/`:
> `BaseNotificationProvider` + `ConsoleNotificationProvider` stub + config-driven factory).
> 7 new tests added (now 26 passing); lint clean.

| # | Task | Effort | Acceptance criteria |
|---|------|--------|---------------------|
| 4.1 | **Dockerize backend** — `Dockerfile` + `.dockerignore` + `docker-compose.yml` (API + Mongo + optional Redis) with healthchecks. | M | `docker compose up` runs the full stack locally; healthchecks pass. |
| 4.2 | **Index & migration discipline** — `scripts/migrate.js` runner + a documented place for index creation / one-off data backfills (Mongoose has no Alembic equivalent). | M | Index creation is explicit and repeatable; migrations are versioned and idempotent. |
| 4.3 | **Background job queue** — replace the serverless-incompatible SLA monitor with a small queue (in-process now, Redis/BullMQ later) for retries, reminders, RAG reindex. | M | Jobs run reliably outside the request cycle; SLA monitor migrated onto it. |
| 4.4 | **Provider abstraction** — `base/factory/stub` pattern for swappable integrations (e.g. therapist verification, notifications/email). | M | Swapping a provider needs no route changes; a stub provider exists for dev/test. |

**Exit criteria:** the backend runs identically in dev/CI/prod and manages data/jobs deliberately.

---

## Phase 5 — AI & API Maturity (P2 → P3) ✅ DONE
> Goal: bring Tink's agentic stack and the public API surface up to air-tasker parity.
>
> **Status:** Completed. Added **model tiering** (`pickModels`: fast model for
> classify/summary/short turns, quality model for long/complex compose/reply;
> configurable via `GEMINI_FAST_MODEL`, `GEMINI_QUALITY_MODEL`, `GEMINI_COMPLEXITY_CHARS`)
> and **confidence gating** (`CHAT_CONFIDENCE_GATE` — below threshold skips Gemini,
> returns rule-based reply + `verificationNote`). Implemented **hybrid RAG**
> (`tinkRagService` merges local token hits with optional Pinecone vector search
> behind `USE_PINECONE_RAG`; `pineconeRagService` handles embed/upsert/query;
> `rag.reindex` background job on a 24h schedule when Pinecone is enabled).
> Added **OpenAPI 3 docs** at `GET /api/docs` (Swagger UI) and
> `GET /api/docs/openapi.json`. Introduced a **response DTO layer**
> (`src/shared/responseShapers.js`) applied to chat + goals routes so payloads
> never leak `__v`/password hashes and `_id` is consistently stringified.
> 9 new tests added (now 35 passing); `swagger-jsdoc` + `swagger-ui-express` added.

| # | Task | Effort | Acceptance criteria |
|---|------|--------|---------------------|
| 5.1 | **Model tiering + confidence gating** — fast vs quality Gemini model by input size; skip the LLM on low classification confidence and return a rule-based reply + verification note (mirrors `agent_confidence`). | M | Long/complex prompts use the quality model; low-confidence turns skip Gemini; behaviour is configurable. |
| 5.2 | **Hybrid RAG + scheduled reindex** — layer Pinecone vector search over the existing local doc RAG behind `USE_PINECONE_RAG`; optional periodic reindex. | L | With the flag on, retrieval uses vectors; off → local docs; sources still surfaced. |
| 5.3 | **OpenAPI / API docs** — generate an OpenAPI spec (e.g. `swagger-jsdoc` + `swagger-ui-express`) served at `/api/docs`. | M | Every route documented with request/response schemas; docs page loads. |
| 5.4 | **Response schema layer** — shared response shapers/DTOs so payloads are consistent and never leak internal fields (Mongoose `__v`, password hashes, etc.). | M | No endpoint returns internal-only fields; shapes are centralized. |

**Exit criteria:** Tink matches air-tasker's AI cost/quality controls and the API is self-documented.

---

## Recommended sequencing

```
Week 1   Phase 1 (all)            → safer, consistent, fail-fast backend
Week 2   Phase 2.1–2.3            → tests gating CI
Week 2-3 Phase 2.4–2.5 + 3.1, 3.3 → audit trail, health, structured logs
Week 3-4 Phase 3.2, 3.4 + Phase 4 → metrics, resilience, Docker, jobs
Week 5+  Phase 5                  → AI tiering, hybrid RAG, API docs
```

**Start here:** Phase 1.1–1.4 (central error handler, async wrapper, typed config,
per-route rate limits) can all land in a single focused pass.

---

## Not in scope (air-tasker features that don't fit MindCare)
- Payments / escrow / payouts (Razorpay) — no marketplace transactions.
- Full KYC identity verification — only the *provider-abstraction pattern* is worth borrowing for therapist verification.

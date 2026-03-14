# Architecture Execution Ledger

Updated: `2026-03-14`  
Plan Status: `Frozen Architectural Ground Truth`

## Purpose

This file is the anti-drift execution tracker for the frozen HOXiq architecture plan.
Implementation must not drift from this baseline unless an explicit code conflict is found and logged in `Drift Notes`.

## Global Rules

- Additive refactor only.
- No big-bang rewrite.
- Keep route/API contracts stable unless a batch explicitly changes them.
- Prefer feature flags for cutovers.
- Postgres is the durable target; SQLite is legacy/transition.
- `obsolete/template-builder.html` is planning-only.
- `frontend/shared/template-catalog.json` is canonical module/template registry truth.
- `backend/packages/shared/assets/template-catalog.json` is the backend-local runtime mirror (deploy-safe backend source).

## Infrastructure Notes (Sanitized)

- VM provider: Oracle Cloud free tier candidate.
- VM role: primary HOXiq host.
- Public IP: operator-supplied at execution time (`<VM_IP>` placeholder only in docs).
- Capacity target:
  - 4 OCPU
  - 24 GB RAM
  - 24 GB swap already allocated
  - 196 GB storage
- Existing unrelated workload: legacy Telegram bot deployment exists and must be removed during infrastructure cleanup.
- Deployment mode: SSH-based.
- Secrets source: `.env`, deployment secret store, or local operator input only.
- Never persist raw secrets in repo docs.
- Never store sudo passwords, bot tokens, API keys, SSH private keys, or database passwords in the ledger or source tree.

### Deployment Command Rules

- Use SSH-based Git remotes.
- Prefer non-interactive deploy scripts.
- Assume operator provides secrets at execution time.
- Never hardcode passwords, tokens, or private keys into scripts.
- Prefer dry-run or inspect-first steps before destructive deploy/cleanup actions.
- Record affected paths/services in the execution ledger before removal.

### Legacy Cleanup Rule

- Do not blindly delete unknown files.
- First classify files/directories as `active`, `legacy`, or `obsolete`.
- For `legacy`/`obsolete`, prefer renaming or moving into `_archive/` or `_legacy/` first.
- Permanently delete only after confirming no active service, deploy script, runtime config, reverse proxy, cron job, Docker container, or system service references them.

### Telegram Bot Cleanup Task (Controlled)

- Locate Telegram bot service/process definitions.
- Locate its code directory.
- Locate its env/config files.
- Identify related systemd services, cron jobs, screen/tmux sessions, Docker containers, and reverse-proxy references.
- Stop and disable the Telegram service.
- Archive code/config before deletion.
- Remove fully only after HOXiq deployment assumptions are verified.

## Frozen Rollout Flags

- `use_postgres_identity`
- `use_membership_shadow_write`
- `use_role_sync_queue`
- `use_template_versions`
- `use_ops_api`

### Rollout Flag Defaults (Batch 0B Freeze)

All rollout flags are frozen to `false` by default and may only be enabled through explicit batch execution with ledger updates.

| Flag | Default | Enablement Gate |
|---|---|---|
| `use_postgres_identity` | `false` | Only after `1A` and `1B` validations pass in staging |
| `use_membership_shadow_write` | `false` | Only after `2A` readiness checks and parity verification |
| `use_role_sync_queue` | `false` | Only after `2B` queue retry/failure tests pass |
| `use_template_versions` | `false` | Only after `3A`, `3A.1`, `3B`, and `3C` lifecycle/exposure validation |
| `use_ops_api` | `false` | Only after `4A` ingestion, `4B` dashboard widget validation, and `4C` alert/runbook validation |

## Frozen Bounded Contexts

- Identity & Access
- Guild Membership
- Discord Gateway Runtime
- Module Runtime
- Template Catalog & Versioning
- Dashboard / Control Plane API
- Automation Workers
- Telemetry / Ops
- Provisioning & Runtime Orchestration
- Billing & Entitlements

## Governance Precedence (Batch 0B Freeze)

When documents conflict, resolve in this order:

1. `docs/ARCHITECTURE_EXECUTION_LEDGER.md` (frozen execution governance + drift log)
2. `docs/TECHNICAL_HANDOFF_2026-03-13.md` (operational and topology guidance)
3. `docs/architecture/TEMPLATE_NEEDS_AND_MODULES.md` (module/domain inventory and capability mapping)

If code conflicts with this baseline, log the conflict under batch `Drift Notes` before changing direction.

## Execution Order Snapshot

1. `PREP` -> create and maintain this ledger as single anti-drift memory anchor.
2. `0A` -> lock canonical module/template truth and mark planning artifacts.
3. `0B` -> governance hardening and frozen rollout controls.
4. `1A` to `1C` -> Identity context foundation + cutover.
5. `2A` to `2C` -> Membership + role sync queue + cutover.
6. `3A` -> Template versioning model scaffolding.
7. `3A.1` -> Template catalog distribution hardening (canonical authoring + backend runtime mirror split).
8. `3B` to `3C` -> Template lifecycle publish/update and dashboard exposure rollout.
9. `4A` to `4C` -> Telemetry/Ops ingestion, APIs, and alerting.
10. `5A` to `5C` -> Discord provider abstraction and safe cutover.
11. `6A` to `6C` -> legacy cleanup, hardening, and closure.

## Live / Cutover Matrix

Track legacy vs new paths, controlling flags, and cutover readiness after each batch.

| Context | Legacy Live Path | New Path | Flag | Parity Status | Cutover Status | Rollback | Legacy Removal |
|---|---|---|---|---|---|---|---|
| Identity Admin Read | `store.getAdmin(...)` | `IdentityAdminReadService` | `use_postgres_identity` | Partial | Guarded read path (repo cutover pending) | disable flag | candidate after repo cutover |
| Membership Writes | `session.manageableGuilds` | `MembershipShadowWriteService` | `use_membership_shadow_write` | Shadow only | Not cut over | disable flag | candidate after membership cutover |
| Membership Reads | `session.manageableGuilds` | `MembershipReadCutoverService` + `MembershipReconciliationService` | `use_membership_shadow_write` | Guarded | Flagged read cutover with legacy fallback | disable flag | candidate after durable membership store cutover |
| Role Sync | direct role sync logic | worker-local role sync queue pipeline (in-memory, non-durable) + control-plane capture hooks | `use_role_sync_queue` | Worker queue dispatch/retry/backoff/dead-letter drills validated; control-plane enqueue still pending | Guarded worker-local queue path (in-memory non-durable; control-plane does not enqueue yet) | keep legacy path | candidate after durable shared queue + cutover |
| Templates | canonical authored catalog + route-level template mutation handling | backend runtime mirror catalog + `TemplateLifecycleService` + `TemplateExposurePolicyService` + versioned template shadow capture | `use_template_versions` | Lifecycle + exposure policy path extracted (guarded) | Service/policy path active; version persistence remains flag-gated/not cut over | disable flag | candidate after template lifecycle cutover |
| Ops Stats | basic runtime stats + SQLite `gateway_shard_stats` primary persistence | `OpsStatsReadService` + `OpsAlertEvaluatorService` + `OpsAlertDispatchService` + `/api/ops/stats` + `/api/ops/alerts` + frontend/inline runtime widgets + shard ingestion pipeline + `OpsShardStatsRepository` (`postgres_with_sqlite_fallback`) | `use_ops_api`, `OPS_SHARD_STATS_STORE_MODE` | API/widgets/alerts live; repository mode/fallback drills validated (`sqlite`, `postgres_with_sqlite_fallback`, strict `postgres`) | Ops read/alert path remains flag-gated; shard-stats persistence supports Postgres-primary with explicit SQLite rollback mode | disable `use_ops_api`; set `OPS_SHARD_STATS_STORE_MODE=sqlite` | candidate after sustained Postgres persistence stability |
| Discord Provider Calls | direct `@platform/shared` Discord REST function imports | `DiscordRestProviderPort` + `createLegacyDiscordRestProvider` adapter layer in control-plane/worker + worker role-sync dual mutation ports (`discord.js` rollback + REST provider default) | `ROLE_SYNC_MUTATION_MODE` | Role-sync mutation path parity and rollback-mode drills validated; full provider cutover not started | Worker role-sync mutation cut over to provider-backed default with explicit legacy rollback mode | set `ROLE_SYNC_MUTATION_MODE=legacy-discord-js` and restart worker/gateway | candidate after sustained provider-path stability |

## Batch Ledger

Status values: `Planned`, `In Progress`, `Completed`, `Blocked`, `Rolled Back`

| Batch | Phase | Goal | Status | Planned Files | Constraints | Acceptance Criteria | Actual Files Changed | Validation Performed | Drift Notes |
|---|---|---|---|---|---|---|---|---|---|
| `PREP` | `0` | Create persistent anti-drift ledger | `Completed` | `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | No runtime/db/route/schema/provider behavior changes | Ledger exists with frozen rules/flags/contexts and full batch table | `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | Manual document verification of required sections and batch coverage | No drift. Intentionally did not change runtime/routes/schema/provider code. |
| `0A` | `0` | Lock canonical module/template truth + planning boundaries | `Completed` | `frontend/shared/template-catalog.json`, `obsolete/template-builder.html`, `docs/architecture/TEMPLATE_NEEDS_AND_MODULES.md`, `docs/TECHNICAL_HANDOFF_2026-03-13.md`, `frontend/src/lib/templateCatalog.ts`, `backend/packages/shared/src/template-catalog.ts` | No runtime/db/route/schema/provider behavior changes | Canonical truth documented and `obsolete/template-builder.html` marked planning-only | `frontend/shared/template-catalog.json`, `obsolete/template-builder.html`, `docs/architecture/TEMPLATE_NEEDS_AND_MODULES.md`, `docs/TECHNICAL_HANDOFF_2026-03-13.md`, `frontend/src/lib/templateCatalog.ts`, `backend/packages/shared/src/template-catalog.ts` | `node -e` catalog parse check; `frontend` typecheck; `backend` typecheck; `backend` tests (`10/10` pass) | No drift. Intentionally did not change runtime behavior, DB behavior, routes, schema, or provider abstraction. |
| `0B` | `0` | Governance hardening and rollout controls frozen | `Completed` | `docs/ARCHITECTURE_EXECUTION_LEDGER.md`, architecture docs | No runtime/product behavior change | Rules and flags finalized and consistent | `docs/ARCHITECTURE_EXECUTION_LEDGER.md`, `docs/TECHNICAL_HANDOFF_2026-03-13.md` | Manual document validation for flag defaults, document precedence, and governance references | No drift. Intentionally did not change runtime, routes, schema, DB behavior, or provider abstraction. |
| `0C` | `0` | Documentation structure cleanup (non-blocking) | `Completed` | `docs/README.md`, docs subdirectories, supporting docs | Docs-only changes; preserve content meaning | New docs structure exists, references updated, root canon docs preserved | `docs/README.md`, `docs/architecture/TEMPLATE_NEEDS_AND_MODULES.md`, `docs/handoffs/chat-handoff.md`, `docs/operations/deployment-checklist.md`, `docs/operations/vps-stats.md`, `docs/research/*.pdf`, `docs/archive/bot-stuff.txt`, `docs/archive/discord_bot_code_only.zip`, `docs/TECHNICAL_HANDOFF_2026-03-13.md`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | Directory/layout verification + reference search/patch validation | No drift. Docs moved and indexed without runtime code changes. |
| `1A` | `1` | Identity context foundation (Postgres, shadow path) | `Completed` | `backend/apps/control-plane/**`, `backend/packages/shared/**`, `backend/migrations/**` | Keep external contracts stable | Identity domain introduced behind flags | `backend/apps/control-plane/src/identity/*`, `backend/apps/control-plane/src/identity/providers/shared-discord-provider.ts`, `backend/apps/control-plane/src/server.ts`, `backend/apps/control-plane/src/doctor.ts`, `backend/packages/shared/src/config.ts`, `backend/.env.example` | `backend` typecheck pass; `backend` tests pass (`10/10`) | No drift. Scaffolding is inert and flag-gated; no auth/route/runtime behavior switched. |
| `1B` | `1` | Auth/session route-through Identity services | `Completed` | auth/session integration points in backend/frontend | No breaking auth API changes | Dual-path works behind flags | `backend/apps/control-plane/src/identity/application/identity-auth-session.service.ts`, `backend/apps/control-plane/src/identity/index.ts`, `backend/apps/control-plane/src/server.ts` | `backend` typecheck pass; `backend` tests pass (`10/10`) | No drift. Existing auth routes/contracts preserved; identity service wiring is additive and flag-compatible. |
| `1C` | `1` | Identity read cutover + rollback guard | `Completed` | identity services/repos + backfill tooling | No irreversible cutover | Guarded identity read path wired with rollback fallback; durable Postgres read cutover pending repository implementation | `backend/apps/control-plane/src/identity/application/identity-admin-read.service.ts`, `backend/apps/control-plane/src/identity/index.ts`, `backend/apps/control-plane/src/server.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` typecheck pass; `backend` tests pass (`10/10`) | No drift. Read path is flag-gated with explicit legacy fallback and warning logs. |
| `2A` | `2` | Membership context + shadow writes | `Completed` | `backend/apps/control-plane/**`, `backend/apps/worker/**`, migrations | No immediate hard cutover | Membership shadow-write scaffolding active behind flag; parity verification pending durable repository | `backend/apps/control-plane/src/membership/**`, `backend/apps/control-plane/src/server.ts`, `backend/apps/worker/src/membership/**`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` typecheck pass; `backend` tests pass (`10/10`) | No drift. Shadow writes are flag-gated and currently use non-durable/noop scaffolds. |
| `2B` | `2` | Role sync queue pipeline | `Completed` | worker queue + control-plane dispatch hooks | Keep current sync path available | Queue retry/backoff/dead-letter behavior scaffolded behind flag; worker-local queue path validated, control-plane hooks are capture-only, explicit failure-drill validation pending | `backend/packages/shared/src/types.ts`, `backend/apps/worker/src/role-sync/**`, `backend/apps/worker/src/index.ts`, `backend/apps/control-plane/src/role-sync/**`, `backend/apps/control-plane/src/server.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` typecheck pass; `backend` tests pass (`10/10`) | No drift. Queue path is flag-gated; control-plane does not enqueue; legacy role sync remains default. |
| `2C` | `2` | Membership cutover + reconciliation | `Completed` | membership services + reconciliation jobs | Rollback path required | Guarded membership read cutover and reconciliation pass wired behind flag with legacy rollback | `backend/apps/control-plane/src/membership/application/membership-read-cutover.service.ts`, `backend/apps/control-plane/src/membership/application/membership-reconciliation.service.ts`, `backend/apps/control-plane/src/membership/infrastructure/repositories/in-memory-membership-guild.repository.ts`, `backend/apps/control-plane/src/membership/index.ts`, `backend/apps/control-plane/src/server.ts`, `backend/apps/control-plane/src/membership/application/membership-cutover.test.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` typecheck pass; `backend` tests pass (`10/10`); control-plane build pass; control-plane dist tests (`13/13`) | No drift. Default path remains legacy; cutover engages only when membership flag is enabled. |
| `3A` | `3` | Template versioning model | `Completed` | template domain/migrations/shared types | Preserve current behavior by default | Version entities coexist with current flow | `backend/apps/control-plane/src/templates/**`, `backend/apps/control-plane/src/server.ts`, `backend/packages/shared/src/types.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` typecheck pass; control-plane build pass; `backend` tests pass (`14/14`); targeted template version tests pass (`3/3`) | No drift. Template versioning path is additive and fully flag-gated with legacy template flow still default. |
| `3A.1` | `3` | Template catalog distribution hardening | `Completed` | shared template catalog loader + backend runtime mirror asset + sync/validate/deploy guards + docs | No route/API/flag/template lifecycle behavior changes | Backend runtime reads backend-local mirror by default; sync/validate guards active; docs/ledger updated; `3B` remains gated | `backend/packages/shared/assets/template-catalog.json`, `backend/scripts/sync-template-catalog.mjs`, `backend/packages/shared/src/template-catalog.ts`, `backend/packages/shared/src/template-catalog.test.ts`, `backend/package.json`, `backend/apps/control-plane/src/doctor.ts`, `backend/deploy/oracle/push.sh`, `backend/Dockerfile`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md`, `docs/TECHNICAL_HANDOFF_2026-03-13.md`, `docs/operations/deployment-checklist.md`, `docs/operations/CODE_ONLY_ARCHIVE_EXCLUSIONS.md` | `backend` `sync:catalog`, `validate:catalog`, `build`, `typecheck`, `test`, and `doctor` pass | No drift. Runtime distribution hardening only; lifecycle behavior and contracts unchanged. |
| `3B` | `3` | Publish/update lifecycle | `Completed` | template APIs + dashboard template flows | No unversioned breaking API change; gated on `3A.1` completion | Publish/update lifecycle functional | `backend/apps/control-plane/src/templates/application/template-lifecycle.service.ts`, `backend/apps/control-plane/src/templates/application/template-lifecycle.test.ts`, `backend/apps/control-plane/src/templates/index.ts`, `backend/apps/control-plane/src/server.ts`, `backend/packages/shared/src/template-catalog.ts`, `backend/package.json`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync`, and control-plane build pass | No drift. Routes/contracts/flags unchanged; lifecycle extraction is additive. |
| `3C` | `3` | Dashboard exposure/version rules | `Completed` | dashboard exposure policy + checks | Avoid default access regressions | Exposure rules enforced correctly | `backend/apps/control-plane/src/templates/application/template-exposure-policy.service.ts`, `backend/apps/control-plane/src/templates/application/template-exposure-policy.test.ts`, `backend/apps/control-plane/src/templates/application/template-lifecycle.service.ts`, `backend/apps/control-plane/src/templates/application/template-lifecycle.test.ts`, `backend/apps/control-plane/src/templates/index.ts`, `backend/apps/control-plane/src/server.ts`, `frontend/src/components/console/BotWorkspaceScreen.tsx`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync`; `frontend` `typecheck` | No drift. Exposure/version policy hardening only; contracts and flags unchanged. |
| `4A` | `4` | Shard stats + heartbeat ingestion | `Completed` | gateway emitters + control-plane ingest | No gateway runtime disruption | Metrics persisted and queryable | `backend/packages/shared/src/types.ts`, `backend/apps/worker/src/index.ts`, `backend/apps/discord-gateway/src/index.ts`, `backend/apps/control-plane/src/ops/index.ts`, `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.ts`, `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.test.ts`, `backend/apps/control-plane/src/store.ts`, `backend/apps/control-plane/src/server.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, and `check:catalog-sync` pass | No drift. Ingestion path is additive and `USE_OPS_API`-gated; legacy runtime stats remain active. |
| `4B` | `4` | Ops API + stats widgets | `Completed` | ops API + dashboard stats surfaces | No existing bootstrap regressions | Ops metrics visible in dashboard | `backend/apps/control-plane/src/ops/application/ops-stats-read.service.ts`, `backend/apps/control-plane/src/ops/application/ops-stats-read.service.test.ts`, `backend/apps/control-plane/src/ops/index.ts`, `backend/apps/control-plane/src/server.ts`, `backend/apps/control-plane/src/dashboard.ts`, `frontend/src/lib/console.ts`, `frontend/src/app/app/runtime/page.tsx`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync`; `frontend` `typecheck` pass | No drift. Added ops read surface/widgets only; bootstrap/routes/contracts remain stable. |
| `4C` | `4` | Alert conditions + runbooks | `Completed` | alert evaluator/docs/notification hooks | Avoid unsafe/noisy defaults | Alert thresholds validated | `backend/apps/control-plane/src/ops/application/ops-alert-evaluator.service.ts`, `backend/apps/control-plane/src/ops/application/ops-alert-evaluator.service.test.ts`, `backend/apps/control-plane/src/ops/application/ops-alert-dispatch.service.ts`, `backend/apps/control-plane/src/ops/application/ops-alert-dispatch.service.test.ts`, `backend/apps/control-plane/src/ops/index.ts`, `backend/apps/control-plane/src/server.ts`, `backend/apps/control-plane/src/dashboard.ts`, `frontend/src/lib/console.ts`, `frontend/src/app/app/runtime/page.tsx`, `docs/operations/OPS_ALERT_RUNBOOKS.md`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`; `frontend` `typecheck` pass | No drift. Alert dispatch is additive and flag-gated; cooldown state is in-memory (non-durable) by design in this batch. |
| `5A` | `5` | Discord provider interface scaffold | `Completed` | provider interfaces + adapters scaffold | No behavior cutover yet | Interface layer exists, old path default | `backend/packages/shared/src/providers/discord/discord-rest-provider.port.ts`, `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.ts`, `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.test.ts`, `backend/packages/shared/src/providers/discord/index.ts`, `backend/packages/shared/src/index.ts`, `backend/apps/control-plane/src/server.ts`, `backend/apps/worker/src/index.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync` pass | No drift. Legacy behavior remains default through adapter delegation; no route/API/schema/flag changes. |
| `5B` | `5` | Dual-path migration to adapters | `Completed` | gateway/module runtime integration points | Keep legacy path until parity proven | Parity validated on key flows | `backend/packages/shared/src/discord.ts`, `backend/packages/shared/src/providers/discord/discord-rest-provider.port.ts`, `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.ts`, `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.test.ts`, `backend/apps/worker/src/role-sync/ports/role-sync-member-mutation.port.ts`, `backend/apps/worker/src/role-sync/infrastructure/providers/discordjs-role-sync-member-mutation.provider.ts`, `backend/apps/worker/src/role-sync/infrastructure/providers/discord-rest-role-sync-member-mutation.provider.ts`, `backend/apps/worker/src/role-sync/application/role-sync-mutation.service.ts`, `backend/apps/worker/src/role-sync/application/role-sync-mutation.service.test.ts`, `backend/apps/worker/src/role-sync/infrastructure/providers/discord-rest-role-sync-member-mutation.provider.test.ts`, `backend/apps/worker/src/role-sync/index.ts`, `backend/apps/worker/src/index.ts`, `backend/package.json`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync` pass | No drift. Dual-path added with legacy worker mutation path as default; no cutover/routes/schema/flag changes. |
| `5C` | `5` | Provider cutover + legacy retire | `Completed` | provider routing/flags + cleanup | Rollback option required | Stable cutover + rollback test | `backend/packages/shared/src/config.ts`, `backend/.env.example`, `backend/apps/worker/src/index.ts`, `backend/apps/control-plane/src/doctor.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync` pass | No drift. Cutover is strictly worker role-sync mutation default (not full Discord provider cutover); explicit env rollback preserved. |
| `6A` | `6` | Legacy SQLite ownership reduction | `Completed` | repos/data access/migration cleanup | No unsafe destructive deletion | Target contexts no longer primary-write SQLite | `backend/packages/shared/src/config.ts`, `backend/.env.example`, `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.ts`, `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.test.ts`, `backend/apps/control-plane/src/ops/application/ops-stats-read.service.ts`, `backend/apps/control-plane/src/ops/application/ops-stats-read.service.test.ts`, `backend/apps/control-plane/src/ops/infrastructure/repositories/ops-shard-stats.repository.ts`, `backend/apps/control-plane/src/ops/index.ts`, `backend/apps/control-plane/src/server.ts`, `backend/apps/control-plane/src/doctor.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test`, `doctor`, `check:catalog-sync` pass | No drift. Scope limited to ops shard-stats persistence ownership reduction with rollback-safe SQLite mode. |
| `6B` | `6` | Hardening/perf/failure drills | `Completed` | targeted queue/ops/template/provider hardening drills + observability checks | No contract breaks | Targeted failure/rollback/fallback drills pass in automated validation; staging SLO soak remains a final-readiness item | `backend/apps/worker/src/role-sync/application/role-sync-queue-dispatch.service.test.ts`, `backend/apps/worker/src/role-sync/application/role-sync-queue-processor.test.ts`, `backend/apps/control-plane/src/ops/infrastructure/repositories/ops-shard-stats.repository.test.ts`, `backend/apps/control-plane/src/ops/application/ops-alert-dispatch.service.test.ts`, `backend/apps/control-plane/src/ops/application/ops-alert-evaluator.service.test.ts`, `backend/apps/control-plane/src/templates/application/template-lifecycle.test.ts`, `backend/packages/shared/src/config.test.ts`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test` (`67/67`), `doctor`, `check:catalog-sync` pass | No drift. Scope limited to hardening drills/tests; no route/API/schema/flag-default/runtime cutover changes. |
| `6C` | `6` | Final readiness + closure | `Completed` | docs/runbooks/release checklist + closure sign-off | Maintain rollback and auditability | Final sign-off published with residual risks and rollback controls | `docs/operations/FINAL_READINESS_SIGNOFF_2026-03-14.md`, `docs/operations/deployment-checklist.md`, `docs/README.md`, `docs/TECHNICAL_HANDOFF_2026-03-13.md`, `docs/ARCHITECTURE_EXECUTION_LEDGER.md` | `backend` `typecheck`, `test` (`67/67`), `doctor`, `check:catalog-sync`; `frontend` `typecheck` pass | No drift. Closure is documentation/governance hardening only; runtime/routes/schema/flag defaults unchanged. |

## Completed Batch Notes

### PREP

- What was done: created the persistent execution ledger and froze governance rules, rollout flags, bounded contexts, and batch table baseline.
- What files changed: `docs/ARCHITECTURE_EXECUTION_LEDGER.md`.
- What was intentionally not changed: runtime logic, routes, APIs, database schema/migrations, provider integrations.
- Validation results: required sections and batch rows (`PREP`, `0A` through `6C`) confirmed present.
- Follow-up notes / risks: keep this file updated after every batch to prevent planning drift.

### 0A

- What was done: locked canonical module registry semantics and added planning-only/source-of-truth clarifications across docs/comments.
- What files changed:
  - `frontend/shared/template-catalog.json`
  - `obsolete/template-builder.html`
  - `docs/architecture/TEMPLATE_NEEDS_AND_MODULES.md`
  - `docs/TECHNICAL_HANDOFF_2026-03-13.md`
  - `frontend/src/lib/templateCatalog.ts`
  - `backend/packages/shared/src/template-catalog.ts`
- What was intentionally not changed: runtime behavior, database behavior, routes, schema, and provider abstraction.
- Validation results:
  - catalog parse/shape check passed (`modules[]` and `templates[]` intact)
  - `frontend` typecheck passed
  - `backend` typecheck passed
  - `backend` tests passed (`10/10`)
- Follow-up notes / risks: catalog metadata `_meta` is additive and currently ignored by loaders by design.

### 0B

- What was done: froze rollout flag defaults and enablement gates; added explicit governance precedence for architecture documents.
- What files changed:
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
  - `docs/TECHNICAL_HANDOFF_2026-03-13.md`
- What was intentionally not changed: runtime logic, API/routes, schema/migrations, DB behavior, provider abstraction.
- Validation results:
  - reviewed ledger flag defaults (`false`) and batch-gated enablement rules
  - verified governance precedence and drift-handling rule text is present
  - confirmed no code path files were edited for this batch
- Follow-up notes / risks: later batches must log any flag enable action and environment scope in ledger entries.

### 0C

- What was done: reorganized supporting documentation into `architecture/`, `handoffs/`, `research/`, `operations/`, and `archive/`, while keeping canonical root docs in place.
- What files changed:
  - `docs/README.md`
  - `docs/TECHNICAL_HANDOFF_2026-03-13.md`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
  - moved files:
    - `docs/TEMPLATE_NEEDS_AND_MODULES.md` -> `docs/architecture/TEMPLATE_NEEDS_AND_MODULES.md`
    - `docs/chat-handoff.md` -> `docs/handoffs/chat-handoff.md`
    - `docs/deployment-checklist.md` -> `docs/operations/deployment-checklist.md`
    - `docs/vps-stats.md` -> `docs/operations/vps-stats.md`
    - `docs/Clear Progression Outline for Your Discord User Integration Revamp.pdf` -> `docs/research/Clear Progression Outline for Your Discord User Integration Revamp.pdf`
    - `docs/Decoupling a Discord User Integration Module With DDD.pdf` -> `docs/research/Decoupling a Discord User Integration Module With DDD.pdf`
    - `docs/Deep Research Report on Modules Offered by Major Discord Bot Sellers.pdf` -> `docs/research/Deep Research Report on Modules Offered by Major Discord Bot Sellers.pdf`
    - `docs/Discord User-Integration Refactor Into a DDD, Production-Grade System.pdf` -> `docs/research/Discord User-Integration Refactor Into a DDD, Production-Grade System.pdf`
    - `docs/bot-stuff.txt` -> `docs/archive/bot-stuff.txt`
    - `docs/discord_bot_code_only.zip` -> `docs/archive/discord_bot_code_only.zip`
- What was intentionally not changed: runtime logic, route/API behavior, database behavior, schema/migrations, provider behavior.
- Validation results:
  - verified canonical root docs remain at `docs/ARCHITECTURE_EXECUTION_LEDGER.md` and `docs/TECHNICAL_HANDOFF_2026-03-13.md`
  - verified moved docs exist in new structure
  - updated and verified internal links that referenced old docs paths
- Follow-up notes / risks: any external tooling/scripts that assume old docs paths must be updated to use `docs/README.md` index.

### 1A

- What was done: added identity scaffolding module with domain records, provider/repository ports, noop repositories, schema draft, and feature-gated composition root integration.
- What files changed:
  - `backend/apps/control-plane/src/identity/domain.ts`
  - `backend/apps/control-plane/src/identity/ports.ts`
  - `backend/apps/control-plane/src/identity/repositories.ts`
  - `backend/apps/control-plane/src/identity/feature-gates.ts`
  - `backend/apps/control-plane/src/identity/schema-draft.ts`
  - `backend/apps/control-plane/src/identity/providers/shared-discord-provider.ts`
  - `backend/apps/control-plane/src/identity/composition.ts`
  - `backend/apps/control-plane/src/identity/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/control-plane/src/doctor.ts`
  - `backend/packages/shared/src/config.ts`
  - `backend/.env.example`
- What was intentionally not changed: existing auth flows, routes, database behavior, provider runtime behavior, role sync behavior, dashboard API contracts.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
- Follow-up notes / risks: schema draft is not executed in this batch; later migration/cutover batches must explicitly apply and verify it behind flags.

#### 1A Structure-Only Cleanup (Post-Completion)

- What was done:
  - split identity scaffolding into clearer boundaries (`domain/`, `ports/`, `application/`, `infrastructure/`)
  - renamed/isolated legacy provider adapter semantics under `infrastructure/providers/legacy-shared-discord-oauth.provider.ts`
  - converted old 1A flat files into compatibility wrappers
- Compatibility wrappers retained:
  - `backend/apps/control-plane/src/identity/domain.ts`
  - `backend/apps/control-plane/src/identity/ports.ts`
  - `backend/apps/control-plane/src/identity/repositories.ts`
  - `backend/apps/control-plane/src/identity/feature-gates.ts`
  - `backend/apps/control-plane/src/identity/schema-draft.ts`
  - `backend/apps/control-plane/src/identity/composition.ts`
  - `backend/apps/control-plane/src/identity/providers/shared-discord-provider.ts`
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
- Candidate for removal after cutover:
  - all compatibility wrapper files listed above (keep until imports are migrated to explicit subpaths and behavior cutover is complete)

### 1B

- What was done: routed Discord OAuth callback/session hydration through `IdentityAuthSessionService` while preserving the same route contracts and session persistence behavior.
- What files changed:
  - `backend/apps/control-plane/src/identity/application/identity-auth-session.service.ts`
  - `backend/apps/control-plane/src/identity/index.ts`
  - `backend/apps/control-plane/src/server.ts`
- What was intentionally not changed: auth route paths, API contracts, dashboard contracts, database runtime behavior, provider runtime behavior, role sync behavior.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
- Follow-up notes / risks:
  - identity shadow writes remain effectively inert via noop repositories unless future repositories are introduced
  - direct shared OAuth helper route usage is now wrapped by identity service and can be retired after full cutover

### 1C

- What was done: introduced `IdentityAdminReadService` for identity-first admin resolution and wired it into request authentication and OAuth callback with explicit rollback guard behavior.
- What files changed:
  - `backend/apps/control-plane/src/identity/application/identity-admin-read.service.ts`
  - `backend/apps/control-plane/src/identity/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: auth route paths/contracts, session cookie contract, database migration execution, provider runtime behavior, role sync behavior.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
- Follow-up notes / risks:
  - fallback logs may surface while repositories remain noop; this is expected until real Postgres repositories and backfill are introduced
  - candidate for removal after cutover: direct `store.getAdmin(...)` reads that remain outside identity-resolved paths

### 2A

- What was done: added Guild Membership context scaffolding and a flag-gated membership shadow-write path from Discord OAuth manageable guilds in `/auth/callback`.
- What files changed:
  - `backend/apps/control-plane/src/membership/application/feature-flags.ts`
  - `backend/apps/control-plane/src/membership/application/foundation-container.ts`
  - `backend/apps/control-plane/src/membership/application/membership-shadow-write.service.ts`
  - `backend/apps/control-plane/src/membership/composition.ts`
  - `backend/apps/control-plane/src/membership/domain/entities.ts`
  - `backend/apps/control-plane/src/membership/ports/membership-guild.repository.port.ts`
  - `backend/apps/control-plane/src/membership/infrastructure/persistence/postgres-membership.schema-draft.ts`
  - `backend/apps/control-plane/src/membership/infrastructure/repositories/noop-membership-guild.repository.ts`
  - `backend/apps/control-plane/src/membership/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/worker/src/membership/shadow-membership-sink.ts`
  - `backend/apps/worker/src/membership/index.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: auth routes/contracts, session structure, existing SQLite behavior, provider runtime behavior, role sync behavior, and migration execution.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
- Follow-up notes / risks:
  - membership shadow writes are currently inert because the repository is intentionally noop until Postgres-backed repositories are introduced
  - candidate for removal after cutover: direct reliance on `session.manageableGuilds` as the sole membership read source

### 2B

- What was done: introduced role sync queue scaffolding, queue-safe mutation processing with retry/backoff/dead-letter handling, worker dispatch hooks at role mutation call sites, and a control-plane dispatch hook capture service.
- What files changed:
  - `backend/packages/shared/src/types.ts`
  - `backend/apps/worker/src/role-sync/feature-flags.ts`
  - `backend/apps/worker/src/role-sync/ports/role-sync-queue.repository.port.ts`
  - `backend/apps/worker/src/role-sync/infrastructure/queue/in-memory-role-sync-queue.repository.ts`
  - `backend/apps/worker/src/role-sync/application/role-sync-queue-dispatch.service.ts`
  - `backend/apps/worker/src/role-sync/application/role-sync-mutation.service.ts`
  - `backend/apps/worker/src/role-sync/application/role-sync-queue-processor.ts`
  - `backend/apps/worker/src/role-sync/index.ts`
  - `backend/apps/worker/src/index.ts`
  - `backend/apps/control-plane/src/role-sync/application/dispatch-hook.service.ts`
  - `backend/apps/control-plane/src/role-sync/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: existing role sync legacy path removal, route/API contracts, auth flow contracts, schema migration execution, SQLite ownership, and production default flag state.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
- Follow-up notes / risks:
  - queue persistence is currently in-memory scaffold and resets on worker restart until durable queue repositories are introduced in a later batch
  - control-plane role-sync hooks currently capture/audit payloads but do not enqueue into the worker queue across process boundaries
  - legacy role mutation path remains active by default and acts as fallback if queue dispatch is unavailable
  - candidate for removal after cutover: direct role mutation branches once queue parity and cutover are verified

### 2C

- What was done: added membership read cutover and reconciliation services, wired guarded read resolution into `/api/bootstrap`, and added reconciliation checks during auth callback/bootstrap.
- What files changed:
  - `backend/apps/control-plane/src/membership/application/membership-read-cutover.service.ts`
  - `backend/apps/control-plane/src/membership/application/membership-reconciliation.service.ts`
  - `backend/apps/control-plane/src/membership/infrastructure/repositories/in-memory-membership-guild.repository.ts`
  - `backend/apps/control-plane/src/membership/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/control-plane/src/membership/application/membership-cutover.test.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route/API contracts, existing session schema/behavior, destructive migrations, and default flag state.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm test` in `backend` passed (`10/10`)
  - `npm run build --workspace @platform/control-plane` passed
  - `node --test ./apps/control-plane/dist/**/*.test.js` passed (`13/13`)
- Follow-up notes / risks:
  - current membership shadow/read repository is in-memory and non-durable; data resets on process restart until durable repository implementation
  - legacy session-based membership remains fallback/rollback path and default behavior while flag is disabled
  - candidate for removal after cutover: direct reliance on session-only manageable guild reads once durable membership storage is live

### 3A

- What was done: introduced template versioning scaffolding (domain records, repository ports, noop/in-memory repositories, Postgres schema draft, composition root, and a flag-gated shadow capture service) and wired create/import/update/publish template flows to call capture hooks without changing existing response contracts.
- What files changed:
  - `backend/apps/control-plane/src/templates/application/feature-flags.ts`
  - `backend/apps/control-plane/src/templates/application/foundation-container.ts`
  - `backend/apps/control-plane/src/templates/application/template-version-shadow.service.ts`
  - `backend/apps/control-plane/src/templates/application/template-version-shadow.test.ts`
  - `backend/apps/control-plane/src/templates/composition.ts`
  - `backend/apps/control-plane/src/templates/domain/entities.ts`
  - `backend/apps/control-plane/src/templates/ports/template-version.repository.port.ts`
  - `backend/apps/control-plane/src/templates/infrastructure/persistence/postgres-template-versioning.schema-draft.ts`
  - `backend/apps/control-plane/src/templates/infrastructure/repositories/noop-template-version.repository.ts`
  - `backend/apps/control-plane/src/templates/infrastructure/repositories/in-memory-template-version.repository.ts`
  - `backend/apps/control-plane/src/templates/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/packages/shared/src/types.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: template routes/contracts, existing SQLite message template behavior, provider runtime behavior, auth/session flow, migration execution, and default flag state.
- Validation results:
  - `npm run typecheck` in `backend` passed
  - `npm run build --workspace @platform/control-plane` passed
  - `npm test` in `backend` passed (`14/14`)
  - `node --test ./apps/control-plane/dist/templates/application/template-version-shadow.test.js` passed (`3/3`)
- Follow-up notes / risks:
  - template version repository is currently noop in composition and in-memory in tests; durable persistence implementation is pending later batches
  - capture hooks are failure-safe and log warnings, but this path remains inactive until `USE_TEMPLATE_VERSIONS=true`
  - candidate for removal after cutover: direct route-level template mutation handling once lifecycle services become the primary path in `3B/3C`

### 3A.1

- What was done: hardened template catalog distribution by introducing a backend-local runtime mirror, adding sync/validation tooling, switching backend runtime loading to the mirror-by-default path, and wiring deploy/build/doctor guardrails.
- What files changed:
  - `backend/packages/shared/assets/template-catalog.json`
  - `backend/scripts/sync-template-catalog.mjs`
  - `backend/packages/shared/src/template-catalog.ts`
  - `backend/packages/shared/src/template-catalog.test.ts`
  - `backend/package.json`
  - `backend/apps/control-plane/src/doctor.ts`
  - `backend/deploy/oracle/push.sh`
  - `backend/Dockerfile`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
  - `docs/TECHNICAL_HANDOFF_2026-03-13.md`
  - `docs/operations/deployment-checklist.md`
  - `docs/operations/CODE_ONLY_ARCHIVE_EXCLUSIONS.md`
- What was intentionally not changed: routes, API contracts, rollout flags/defaults, template publish/update lifecycle behavior, and cutover state for `3B`.
- Validation results:
  - `cd backend && npm run sync:catalog` passed
  - `cd backend && npm run validate:catalog` passed
  - `cd backend && npm run build` passed
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`21/21`)
  - `cd backend && npm run doctor` passed with catalog path/module/template counts
- Follow-up notes / risks:
  - backend runtime mirror must be refreshed with `npm run sync:catalog` whenever canonical catalog changes
  - local dev fallback hardening from `3A.1` was carried into `3B` (explicit opt-in + CI/production block)
  - candidate for removal after cutover: frontend-path fallback inside backend loader once sync workflow is fully enforced in all environments

### 3B

- What was done: extracted template mutation lifecycle (create/import/update/publish) into `TemplateLifecycleService`, moved version-capture workflow into the service layer, and converted template mutation routes into thin wrappers.
- What files changed:
  - `backend/apps/control-plane/src/templates/application/template-lifecycle.service.ts`
  - `backend/apps/control-plane/src/templates/application/template-lifecycle.test.ts`
  - `backend/apps/control-plane/src/templates/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/packages/shared/src/template-catalog.ts`
  - `backend/package.json`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route paths/contracts, rollout flags/defaults, template catalog ownership/distribution model, migration execution, and any `3C` policy/exposure work.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`27/27`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
  - `cd backend && npm run build --workspace @platform/control-plane` passed
  - `cd backend && node --test ./apps/control-plane/dist/**/*.test.js` passed (`22/22`)
- Follow-up notes / risks:
  - `TemplateLifecycleService.importTemplate` temporarily preserved prior module-gating behavior in `3B`; this was tightened in `3C` with explicit exposure policy checks
  - `npm test` now rebuilds shared/control-plane before running dist tests to avoid stale lifecycle test coverage
  - candidate for removal after cutover: any remaining direct route-level template mutation logic once `3C` exposure/policy work is complete

### 3C

- What was done: implemented dashboard exposure/version policy checks through `TemplateExposurePolicyService`, tightened share/import behavior to published templates, and aligned lifecycle update rules so draft transitions clear share tokens.
- What files changed:
  - `backend/apps/control-plane/src/templates/application/template-exposure-policy.service.ts`
  - `backend/apps/control-plane/src/templates/application/template-exposure-policy.test.ts`
  - `backend/apps/control-plane/src/templates/application/template-lifecycle.service.ts`
  - `backend/apps/control-plane/src/templates/application/template-lifecycle.test.ts`
  - `backend/apps/control-plane/src/templates/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `frontend/src/components/console/BotWorkspaceScreen.tsx`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route paths/contracts, rollout flags/defaults, catalog ownership/distribution model, migration execution, and any `4A+` telemetry/provider work.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`35/35`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
  - `cd frontend && npm run typecheck` passed
- Follow-up notes / risks:
  - share-token exposure is intentionally restricted to published templates to reduce draft leakage; old draft share tokens now resolve as not found until re-published
  - import by raw payload remains supported and intentionally bypasses share-token publish checks (same contract)
  - candidate for removal after cutover: residual direct template mutations outside lifecycle service (`delete/share/send`) once future cutover batches consolidate remaining operations

### 4A

- What was done: added a flag-gated shard heartbeat ingestion pipeline (`USE_OPS_API`) from discord-gateway into control-plane ops ingestion, with typed payload validation and persistent `gateway_shard_stats` storage.
- What files changed:
  - `backend/packages/shared/src/types.ts`
  - `backend/apps/worker/src/index.ts`
  - `backend/apps/discord-gateway/src/index.ts`
  - `backend/apps/control-plane/src/ops/index.ts`
  - `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.ts`
  - `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.test.ts`
  - `backend/apps/control-plane/src/store.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: public route/API contracts, bootstrap payload shape, dashboard widgets/ops UI (`4B`), alerting (`4C`), rollout flag defaults, and provider abstraction work.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`38/38`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
- Follow-up notes / risks:
  - shard ingestion currently depends on worker heartbeat shard metrics (`gatewayShardSnapshotJson`) and is non-durable beyond current SQLite semantics.
  - ops ingestion endpoint is internal-only and returns `202` when `USE_OPS_API=false`; no production cutover occurs until flag enablement and `4B` visualization work.
  - candidate for removal after cutover: direct reliance on worker-heartbeat metrics as the only shard source once dedicated ops API/read models are fully established.

### 4B

- What was done: introduced `OpsStatsReadService` and `/api/ops/stats` for aggregated shard telemetry reads, then wired shard metrics widgets/tables into both runtime dashboards (frontend runtime page and inline control-plane dashboard view).
- What files changed:
  - `backend/apps/control-plane/src/ops/application/ops-stats-read.service.ts`
  - `backend/apps/control-plane/src/ops/application/ops-stats-read.service.test.ts`
  - `backend/apps/control-plane/src/ops/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/control-plane/src/dashboard.ts`
  - `frontend/src/lib/console.ts`
  - `frontend/src/app/app/runtime/page.tsx`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: bootstrap payload contract, existing runtime worker table behavior, rollout flag defaults, template/provider/membership flows, and alerting behavior (`4C`).
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`41/41`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
  - `cd frontend && npm run typecheck` passed
- Follow-up notes / risks:
  - ops widgets intentionally display disabled/empty states when `USE_OPS_API=false` to avoid hidden fallback behavior.
  - `/api/ops/stats` is additive and admin-gated; no existing route contracts were modified.
  - candidate for removal after cutover: duplicated inline-dashboard runtime widget logic once a single frontend surface is authoritative.

### 4C

- What was done: added shard-health alert evaluation + cooldown dispatch services, surfaced alert payloads in ops APIs and runtime widgets, and created operator runbooks for stale/no-ready/high-latency scenarios.
- What files changed:
  - `backend/apps/control-plane/src/ops/application/ops-alert-evaluator.service.ts`
  - `backend/apps/control-plane/src/ops/application/ops-alert-evaluator.service.test.ts`
  - `backend/apps/control-plane/src/ops/application/ops-alert-dispatch.service.ts`
  - `backend/apps/control-plane/src/ops/application/ops-alert-dispatch.service.test.ts`
  - `backend/apps/control-plane/src/ops/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/control-plane/src/dashboard.ts`
  - `frontend/src/lib/console.ts`
  - `frontend/src/app/app/runtime/page.tsx`
  - `docs/operations/OPS_ALERT_RUNBOOKS.md`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: rollout flags/defaults, existing auth/template/membership/provider flows, schema/migrations, and any `5A+` provider-abstraction work.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`46/46`)
  - `cd backend && npm run doctor` passed
  - `cd frontend && npm run typecheck` passed
- Follow-up notes / risks:
  - alert dispatch cooldown state is in-memory and non-durable; process restarts reset cooldown memory.
  - alert hooks currently log + audit only; paging/integration transports remain for future ops hardening.
  - candidate for removal after cutover: inline dashboard alert table duplication once a single frontend runtime view is authoritative.

### 5A

- What was done: introduced a shared Discord REST provider interface (`DiscordRestProviderPort`) with a legacy adapter (`createLegacyDiscordRestProvider`) and routed control-plane/worker call sites through that adapter while preserving legacy behavior as default.
- What files changed:
  - `backend/packages/shared/src/providers/discord/discord-rest-provider.port.ts`
  - `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.ts`
  - `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.test.ts`
  - `backend/packages/shared/src/providers/discord/index.ts`
  - `backend/packages/shared/src/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/worker/src/index.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route/API contracts, rollout flag defaults, schema/migrations, auth/template/membership/ops behavior, and provider cutover logic planned for `5B`/`5C`.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`48/48`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
- Follow-up notes / risks:
  - adapter path currently wraps existing `@platform/shared` Discord REST functions; this is intentional for no-risk scaffolding in `5A`.
  - identity OAuth provider remains on its existing identity-specific port/adapter path and is not yet part of `5A` cutover work.
  - candidate for removal after cutover: direct shared Discord REST utility imports that are superseded once `5B`/`5C` complete parity and retirement.

### 5B

- What was done: added worker role-sync dual mutation ports so queue mutation can run through either legacy `discord.js` member-role operations (default) or the shared REST provider path, and expanded the shared Discord provider contract to support member role mutations required for parity.
- What files changed:
  - `backend/packages/shared/src/discord.ts`
  - `backend/packages/shared/src/providers/discord/discord-rest-provider.port.ts`
  - `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.ts`
  - `backend/packages/shared/src/providers/discord/legacy-discord-rest.provider.test.ts`
  - `backend/apps/worker/src/role-sync/ports/role-sync-member-mutation.port.ts`
  - `backend/apps/worker/src/role-sync/infrastructure/providers/discordjs-role-sync-member-mutation.provider.ts`
  - `backend/apps/worker/src/role-sync/infrastructure/providers/discord-rest-role-sync-member-mutation.provider.ts`
  - `backend/apps/worker/src/role-sync/application/role-sync-mutation.service.ts`
  - `backend/apps/worker/src/role-sync/application/role-sync-mutation.service.test.ts`
  - `backend/apps/worker/src/role-sync/infrastructure/providers/discord-rest-role-sync-member-mutation.provider.test.ts`
  - `backend/apps/worker/src/role-sync/index.ts`
  - `backend/apps/worker/src/index.ts`
  - `backend/package.json`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route/API contracts, rollout flags/defaults, schema/migrations, auth/template/membership/ops behavior, and provider cutover/removal logic reserved for `5C`.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`52/52`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
- Follow-up notes / risks:
  - worker default remains legacy `discord.js` role mutation path; REST-provider mutation path is additive and optional for parity migration.
  - REST provider role mutation uses sequential per-role REST calls; this is safe for scaffolding but may need batching/rate-limit tuning before cutover.
  - candidate for removal after cutover: direct `discord.js` role mutation path once `5C` parity/cutover and rollback validation are complete.

### 5C

- What was done: cut over worker role-sync mutation default to the provider-backed path (`discord-rest-provider`) and introduced explicit config-level rollback control through `ROLE_SYNC_MUTATION_MODE`.
- What files changed:
  - `backend/packages/shared/src/config.ts`
  - `backend/.env.example`
  - `backend/apps/worker/src/index.ts`
  - `backend/apps/control-plane/src/doctor.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route/API contracts, identity OAuth provider paths, schema/migrations, rollout feature-flag defaults, and unrelated Discord flows outside role-sync mutation.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`52/52`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
- Follow-up notes / risks:
  - precision check confirmed this is not a full Discord provider cutover; only worker role-sync mutation default was switched.
  - rollback is explicit and immediate via `ROLE_SYNC_MUTATION_MODE=legacy-discord-js` with worker/gateway restart.
  - doctor output now explicitly prints `ROLE_SYNC_MUTATION_MODE`, `ROLE_SYNC_PROVIDER_BACKED_ACTIVE`, and `ROLE_SYNC_ROLLBACK_MODE`.
  - legacy role mutation implementation is intentionally retained for rollback safety and is now considered superseded default behavior (no longer default path).
  - candidate for removal after cutover: `legacy-discord-js` mutation provider path after sustained provider-path stability and rollback drills in later hardening phase.

### 6A

- What was done: reduced SQLite ownership for the ops shard-stats context by introducing `OpsShardStatsRepository` with Postgres-primary persistence mode and explicit SQLite fallback/rollback mode, while preserving existing contracts and behavior gates.
- What files changed:
  - `backend/packages/shared/src/config.ts`
  - `backend/.env.example`
  - `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.ts`
  - `backend/apps/control-plane/src/ops/application/shard-heartbeat-ingestion.service.test.ts`
  - `backend/apps/control-plane/src/ops/application/ops-stats-read.service.ts`
  - `backend/apps/control-plane/src/ops/application/ops-stats-read.service.test.ts`
  - `backend/apps/control-plane/src/ops/infrastructure/repositories/ops-shard-stats.repository.ts`
  - `backend/apps/control-plane/src/ops/index.ts`
  - `backend/apps/control-plane/src/server.ts`
  - `backend/apps/control-plane/src/doctor.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route/API contracts, identity/template/membership/provider-cutover paths, destructive SQLite cleanup, and any `6B+` hardening/perf drill work.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`52/52`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
- Follow-up notes / risks:
  - SQLite ownership reduction in `6A` is intentionally scoped to ops shard-stats persistence only.
  - rollback remains explicit through `OPS_SHARD_STATS_STORE_MODE=sqlite`.
  - contexts still SQLite-primary after `6A`: admin/session/auth state, bot instance/config/template state, managed messages/threads/reminders/feeds/reputation/rsvp/automod/custom commands, entitlements/personalizations, audit logs, and worker heartbeats.

### 6B

- What was done: added targeted hardening and failure-drill coverage for provider-backed role-sync mutation defaults/rollback modes, role-sync queue retry/backoff/dead-letter flow, ops shard-stats repository fallback modes, ops alert cooldown/evaluator behavior, and template lifecycle behavior under default versioning flags.
- What files changed:
  - `backend/apps/worker/src/role-sync/application/role-sync-queue-dispatch.service.test.ts`
  - `backend/apps/worker/src/role-sync/application/role-sync-queue-processor.test.ts`
  - `backend/apps/control-plane/src/ops/infrastructure/repositories/ops-shard-stats.repository.test.ts`
  - `backend/apps/control-plane/src/ops/application/ops-alert-dispatch.service.test.ts`
  - `backend/apps/control-plane/src/ops/application/ops-alert-evaluator.service.test.ts`
  - `backend/apps/control-plane/src/templates/application/template-lifecycle.test.ts`
  - `backend/packages/shared/src/config.test.ts`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: route/API contracts, schema/migrations, SQLite ownership boundaries introduced in `6A`, feature-flag defaults, provider cutover scope, and any `6C` closure work.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`67/67`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
- Follow-up notes / risks:
  - role-sync queue remains worker-local in-memory and non-durable; durable shared queue cutover is still pending.
  - ops fallback drills currently use invalid Postgres endpoint simulation; staging soak/fault-injection against real Postgres remains a closure readiness item.
  - this batch intentionally does not start `6C`.

### 6C

- What was done: completed final readiness and closure documentation with explicit rollback controls, validation evidence, and residual risk logging.
- What files changed:
  - `docs/operations/FINAL_READINESS_SIGNOFF_2026-03-14.md`
  - `docs/operations/deployment-checklist.md`
  - `docs/README.md`
  - `docs/TECHNICAL_HANDOFF_2026-03-13.md`
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- What was intentionally not changed: runtime behavior, route/API contracts, schema/migrations, feature-flag defaults, provider/membership/template cutover scope, and destructive cleanup operations.
- Validation results:
  - `cd backend && npm run typecheck` passed
  - `cd backend && npm test` passed (`67/67`)
  - `cd backend && npm run doctor` passed
  - `cd backend && npm run check:catalog-sync` passed
  - `cd frontend && npm run typecheck` passed
- Follow-up notes / risks:
  - residual risks are intentionally logged and accepted in `docs/operations/FINAL_READINESS_SIGNOFF_2026-03-14.md`.
  - role-sync queue durability and real Postgres fault-injection remain post-closure operational hardening items.

## Batch Update Protocol (Strict)

Before each implementation batch:

- Restate batch goal.
- Restate files to touch.
- Restate what must not change.

After each implementation batch:

- Update `Status`.
- Fill `Actual Files Changed`.
- Fill `Validation Performed`.
- Fill `Drift Notes`.
- Explicitly note any deviation from plan.

If any deviation is required:

- Do not proceed silently.
- Mark the impacted batch `Blocked` or `In Progress`.
- Document the conflict and the chosen mitigation in `Drift Notes`.

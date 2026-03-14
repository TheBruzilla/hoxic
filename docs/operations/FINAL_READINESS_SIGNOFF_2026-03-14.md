# HOXiq Final Readiness Sign-off (Batch 6C)

Date: `2026-03-14` (IST)

## Scope

This document closes Batch `6C` for the frozen architecture plan.

- No route/API contract changes.
- No schema/migration changes.
- No feature-flag default changes.
- No destructive cleanup.
- No silent architecture drift from the ledger.

## Final Validation Snapshot

Validation run from current workspace:

- `cd backend && npm run typecheck` -> pass
- `cd backend && npm test` -> pass (`67/67`)
- `cd backend && npm run doctor` -> pass
- `cd backend && npm run check:catalog-sync` -> pass
- `cd frontend && npm run typecheck` -> pass

## Rollback and Degraded-Mode Controls

| Surface | Primary Mode | Rollback Mode | Action |
|---|---|---|---|
| Worker role-sync mutation | `ROLE_SYNC_MUTATION_MODE=discord-rest-provider` | `ROLE_SYNC_MUTATION_MODE=legacy-discord-js` | set env + restart worker/gateway |
| Ops shard-stats persistence | `OPS_SHARD_STATS_STORE_MODE=postgres_with_sqlite_fallback` | `OPS_SHARD_STATS_STORE_MODE=sqlite` | set env + restart control-plane |
| Ops API/stat widgets | `USE_OPS_API=true` (when enabled intentionally) | `USE_OPS_API=false` | disable flag + restart control-plane |
| Membership read/shadow paths | `USE_MEMBERSHIP_SHADOW_WRITE=true` (when enabled intentionally) | `USE_MEMBERSHIP_SHADOW_WRITE=false` | disable flag + restart control-plane |
| Identity read guard | `USE_POSTGRES_IDENTITY=true` (when enabled intentionally) | `USE_POSTGRES_IDENTITY=false` | disable flag + restart control-plane |
| Template version shadow capture | `USE_TEMPLATE_VERSIONS=true` (when enabled intentionally) | `USE_TEMPLATE_VERSIONS=false` | disable flag + restart control-plane |

Doctor verification signals:

- `ROLE_SYNC_MUTATION_MODE`
- `ROLE_SYNC_PROVIDER_BACKED_ACTIVE`
- `ROLE_SYNC_ROLLBACK_MODE`
- `OPS_SHARD_STATS_STORE_MODE`
- `OPS_SHARD_STATS_SQLITE_ROLLBACK_MODE`

## Operational References

- Deployment checklist: `docs/operations/deployment-checklist.md`
- Ops alerts runbooks: `docs/operations/OPS_ALERT_RUNBOOKS.md`
- Archive exclusions: `docs/operations/CODE_ONLY_ARCHIVE_EXCLUSIONS.md`
- Architecture ledger: `docs/ARCHITECTURE_EXECUTION_LEDGER.md`

## Residual Risks (Logged, Not Ignored)

1. Role-sync queue durability
- Current queue is worker-local in-memory and non-durable.
- Impact: queued jobs can be lost on worker restart.
- Mitigation path: durable shared queue cutover in future work before removing legacy path.

2. Postgres fallback drills realism
- Current fallback drills use invalid-endpoint simulation.
- Impact: does not fully replace staging fault injection against a real Postgres failure mode.
- Mitigation path: run controlled staging fault drills before high-risk production changes.

3. Partial cutovers remain intentionally guarded
- Identity/membership/template versioning remain flag-gated; not all durable-cutover milestones are complete.
- Impact: architecture is stable but still mixed-mode by design.
- Mitigation path: enable flags only through explicit gated rollout windows with rollback prepared.

## Closure Decision

- Staging readiness: **GO** (controlled rollout)
- Production readiness: **CONDITIONAL GO**

Production remains conditional on:

1. Explicit environment verification of rollback knobs per environment.
2. A controlled staging fault drill for Postgres degradation behavior.
3. Confirmation that non-durable queue behavior is operationally acceptable for current load profile.


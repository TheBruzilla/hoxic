# HOXIQ Technical Handoff (Deep State)

Updated: `2026-03-14` (IST)  
Audience: senior engineer taking immediate ownership

## 1) Fast Start (first 20 minutes)

1. Open workspace:
   ```bash
   cd /home/praneon/Desktop/discord_bot
   ```
2. Start frontend locally (port `3001` expected by current local env):
   ```bash
   cd frontend
   npm install
   npm run dev -- --port 3001
   ```
3. Start backend locally (recommended with compose, not raw `npm start`):
   ```bash
   cd /home/praneon/Desktop/discord_bot/backend
   npm install
   cp -n .env.example .env
   # If Discord OAuth secrets are not set locally yet:
   # set CONTROL_PLANE_DEV_BYPASS_AUTH=true in .env for local-only bootstrapping.
   ./deploy/oracle/deploy.sh
   ```
4. Verify local health:
   ```bash
   curl -s http://127.0.0.1:3457/health || curl -s http://127.0.0.1:3456/health
   ```
5. Open:
   - `http://127.0.0.1:3001/app`
   - `obsolete/template-builder.html` from root via static server:
     ```bash
     cd /home/praneon/Desktop/discord_bot
     python3 -m http.server 8091
     # then open http://127.0.0.1:8091/obsolete/template-builder.html
     ```

## 2) Repository and Git Reality (critical)

- Workspace root: `/home/praneon/Desktop/discord_bot`
- Root remote: `git@github.com:TheBruzilla/hoxic.git`
- Active branch: `master`
- Current HEAD: `19566b5` (`Stabilize template flow and shared catalog`)

Important: root git tracks mainly `frontend/`, `frontend/shared/template-catalog.json`, `obsolete/template-builder.html`, and selected docs.  
Current root git **does not track** the entire `backend/` directory history as first-class tracked files in this checkout.

### Current local dirty state (at handoff write time)

- Modified tracked files:
  - `frontend/src/lib/console.ts`
  - `frontend/src/lib/templateCatalog.ts`
  - `frontend/shared/template-catalog.json`
  - `obsolete/template-builder.html`
- Untracked paths include:
  - `backend/`
  - `.backend-runtime/`
  - `docs/handoffs/chat-handoff.md`
  - `docs/operations/deployment-checklist.md`
  - `docs/operations/vps-stats.md`

Implication: before any release/hardening, align repo strategy (single monorepo vs split repos) to avoid silent drift.

## 3) System Topology

### Frontend

- Stack: Next.js 15, React 19, TypeScript
- Path: `/home/praneon/Desktop/discord_bot/frontend`
- Vercel project: `hoxic`
- Branch mapping:
  - `master` -> staging (`https://staging.hoxiq.com`)
  - `main` -> production (`https://app.hoxiq.com`)

### Backend runtime

- Path: `/home/praneon/Desktop/discord_bot/backend`
- Stack: Node workspaces + Fastify control-plane + worker + Discord gateway
- Deployed on Oracle VPS via Docker Compose
- Public API domains:
  - staging: `https://api-staging.hoxiq.com`
  - production: `https://api.hoxiq.com`

### Runtime service model (`backend/compose.yaml`)

- `control-plane` (API + orchestration)
- `discord-gateway`
- `caddy` (TLS reverse proxy on `443`)
- `postgres`
- `pgbouncer`
- `guild-runtime-template` (build profile)

## 4) Infra Access (SSH/VPS)

### VPS

- Provider: Oracle Cloud (Always Free profile was used)
- Public IP: `68.233.104.247`
- SSH user: `ubuntu`
- App path on server: `/opt/hoxiq/backend`

### SSH key locations on this machine

- `/home/praneon/Desktop/discord_bot/stuff/ssh-keys/vps/ssh-key-2026-03-09.key`
- `/home/praneon/Desktop/discord_bot/stuff/ssh-keys/vps/ssh-key-2026-03-09.key.pub`

### SSH command

```bash
chmod 600 /home/praneon/Desktop/discord_bot/stuff/ssh-keys/vps/ssh-key-2026-03-09.key
ssh -i /home/praneon/Desktop/discord_bot/stuff/ssh-keys/vps/ssh-key-2026-03-09.key ubuntu@68.233.104.247
```

### Push backend from local machine to VPS

```bash
cd /home/praneon/Desktop/discord_bot/backend
RSYNC_RSH="ssh -i /home/praneon/Desktop/discord_bot/stuff/ssh-keys/vps/ssh-key-2026-03-09.key" \
  ./deploy/oracle/push.sh ubuntu@68.233.104.247 /opt/hoxiq/backend
```

Then on VPS:

```bash
cd /opt/hoxiq/backend
./deploy/oracle/deploy.sh
```

## 5) DNS and Edge Routing

Configured hostnames:

- `staging.hoxiq.com` -> Vercel staging
- `app.hoxiq.com` -> Vercel production
- `api-staging.hoxiq.com` -> VPS `68.233.104.247`
- `api.hoxiq.com` -> VPS `68.233.104.247`

Proxy mode:

- Caddy only exposes `443` for HOXIQ API traffic.
- `control-plane` binds internally to loopback (`127.0.0.1:3456` default bind mapping).
- Existing non-HOXIQ app on port `80` was intentionally left untouched.

## 6) Environment Matrix

### Frontend (`frontend/.env.local` current local)

```env
DASHBOARD_BACKEND_ORIGIN=http://127.0.0.1:3457
DASHBOARD_PUBLIC_API_URL=http://127.0.0.1:3457
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
```

### Backend required vars (from `backend/.env.example`)

Required baseline:

- `CONTROL_PLANE_BASE_URL`
- `DASHBOARD_PUBLIC_URL`
- `CONTROL_PLANE_BIND`
- `DATABASE_PATH`
- `ASSET_STORAGE_DIR`
- `TRANSCRIPT_STORAGE_DIR`
- `LOG_STORAGE_DIR`
- `PLATFORM_ENCRYPTION_KEY`
- `BOT_DASHBOARD_DOMAIN`

Required for OAuth (unless `CONTROL_PLANE_DEV_BYPASS_AUTH=true`):

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_OAUTH_REDIRECT_URI`

## 7) Discord OAuth and Bot Onboarding

### Redirect URIs that must exist in Discord Developer Portal

- `https://staging.hoxiq.com/auth/callback`
- `https://app.hoxiq.com/auth/callback`
- `http://127.0.0.1:3001/auth/callback` (local)

### Login scopes

- `identify`
- `guilds`

### Bot install scopes

- `bot`
- `applications.commands`

### Known failure mode

- `{"message":"OAuth token exchange failed with 401"}`

Common causes in this stack:

- `DISCORD_CLIENT_SECRET` mismatch on backend host
- callback URI mismatch between Discord portal and backend env
- stale/expired authorization code

## 8) Operational Commands (VPS)

From `/opt/hoxiq/backend`:

```bash
docker compose ps
docker compose logs -f control-plane
docker compose logs -f caddy
docker compose logs -f discord-gateway
docker compose restart control-plane
docker compose restart discord-gateway
```

Health checks:

```bash
curl -s https://api-staging.hoxiq.com/health
curl -s https://api.hoxiq.com/health
```

## 9) Resource Snapshot (last known)

From `docs/operations/vps-stats.md`:

- RAM: `23 GiB` total, `22 GiB` available
- Swap: `24 GiB` total, `0 B` used
- Root filesystem: `187 GiB` size, `156 GiB` available (`18%` used)

## 10) Template Source-of-Truth State

Template catalog source split (Batch `3A.1` hardening):

- Canonical authoring source:
  - `frontend/shared/template-catalog.json`
- Backend runtime mirror (deploy-safe source for backend-only builds/deploys):
  - `backend/packages/shared/assets/template-catalog.json`
- Consumed by:
  - `frontend/src/lib/templateCatalog.ts` (canonical source)
  - `backend/packages/shared/src/template-catalog.ts` (runtime mirror by default)

Catalog sync/validation commands (run from `backend/`):

```bash
npm run sync:catalog
npm run validate:catalog
npm run check:catalog-sync
```

Catalog schema currently expected by runtime code:

- top-level `modules[]`
- top-level `templates[]`
- each template has `moduleIds[]`

Local admin helper:

- `obsolete/template-builder.html` (under `obsolete/`)
- current version is intentionally simplified for template -> function array mapping clarity
- exports `template-ground-truth.json` shape:
  ```json
  {
    "Music Community": ["musicVoice", "soundboard"]
  }
  ```

Important nuance: exported ground-truth JSON is a simplified planning artifact and is not a drop-in replacement for `frontend/shared/template-catalog.json` without conversion.

Batch `0A` freeze clarification:

- `frontend/shared/template-catalog.json` is the canonical authored registry.
- `backend/packages/shared/assets/template-catalog.json` is the backend runtime mirror consumed by backend runtime/deploy checks.
- `obsolete/template-builder.html` remains planning-only tooling.
- Canonical execution/governance tracking lives in `docs/ARCHITECTURE_EXECUTION_LEDGER.md`.

Batch `0B` governance clarification:

- Rollout flags default to `false` and are enabled only through batch-gated execution.
- Document precedence and drift handling are defined in `docs/ARCHITECTURE_EXECUTION_LEDGER.md`.
- No runtime/API/schema behavior is changed by governance-only batches.

## 11) Known Breakpoints / Gotchas

1. If backend `npm run start` fails with `ECONNREFUSED 127.0.0.1:55432`, local env points to a Postgres endpoint that is not running. Use compose stack or fix `POSTGRES_URL`.
2. Port collisions are common (example: `python3 -m http.server 8080` failed due address in use). Pick another port (`8091`) or free existing listener.
3. Server list returning `0 visible servers` usually points to OAuth/session mismatch, bypass auth mode, or wrong OAuth app credentials.
4. Root repo state is mixed tracked/untracked; do not assume full backend changes are in git history.

## 12) Security and Credential Hygiene (urgent)

- Discord client secret and bot token were exposed in prior chat context. Treat as compromised and rotate immediately.
- Keep all secrets out of git-tracked files (`.env`, key files, tokens).
- Restrict key file permissions:
  ```bash
  chmod 600 stuff/ssh-keys/vps/ssh-key-2026-03-09.key
  ```
- Confirm Discord OAuth redirect URIs exactly match env values for each environment.

## 13) First-Hour Ownership Checklist

1. Confirm SSH access to VPS with existing key.
2. Confirm `.env` validity on VPS and redeploy once (`./deploy/oracle/deploy.sh`).
3. Verify staging API and dashboard health endpoints.
4. Verify Discord OAuth login end-to-end on staging.
5. Decide and document git strategy for backend tracking.
6. Before template lifecycle work (`3B+`), run `cd backend && npm run sync:catalog && npm run validate:catalog` and confirm backend mirror parity.

## 14) Closure Snapshot (Batch 6C)

- Batch `6C` closes final readiness and documentation governance with no runtime/API/schema changes.
- Final readiness sign-off document:
  - `docs/operations/FINAL_READINESS_SIGNOFF_2026-03-14.md`
- Canonical anti-drift authority remains:
  - `docs/ARCHITECTURE_EXECUTION_LEDGER.md`
- Batch `6C` status and residual risks must be read from the ledger + sign-off doc together.

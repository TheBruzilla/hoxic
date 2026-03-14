# HOXiq Deployment Checklist

## Target Topology
- Local source workspace:
  - `/home/praneon/Desktop/discord_bot`
- `master` = staging
- `main` = production
- `frontend` deploys to Vercel
- `backend` deploys to an always-on VM
- Staging hosts:
  - `https://staging.hoxiq.com`
  - `https://api-staging.hoxiq.com`
- Production hosts:
  - `https://app.hoxiq.com`
  - `https://api.hoxiq.com`

## Source Layout
- [ ] Keep the root directory as the local source workspace only.
- [ ] Deploy `frontend` to Vercel.
- [ ] Deploy `backend` to the VPS.
- [ ] Do not treat the root directory as the production deploy unit.
- [ ] Keep template catalog ownership split:
  - canonical authoring: `frontend/shared/template-catalog.json`
  - backend runtime mirror: `backend/packages/shared/assets/template-catalog.json`

## GitHub
- [ ] Create a dedicated GitHub repo for `frontend` only.
- [ ] Push the contents of `frontend` to that repo.
- [ ] Create `master` and `main` in that GitHub repo.
- [ ] Set `master` as staging and `main` as production.
- [ ] Protect both branches.

Example flow for the `frontend` directory only:

```bash
cd /home/praneon/Desktop/discord_bot/frontend
git init
git add .
git commit -m "Initial frontend baseline"
git branch -M main
git remote add origin git@github.com:YOUR_USER/hoxiq-dashboard.git
git push -u origin main
git checkout -b master
git push -u origin master
```

Optional:
- create a second GitHub repo for `backend` later if you want backup/history there too
- but it is not required for the first VPS deployment

## Vercel
- [ ] Create one Vercel project from the `frontend` GitHub repo.
- [ ] Set Production Branch to `main`.
- [ ] Add `staging.hoxiq.com` and map it to branch `master`.
- [ ] Add `app.hoxiq.com` and map it to production.

### Vercel env: staging
```env
DASHBOARD_BACKEND_ORIGIN=https://api-staging.hoxiq.com
DASHBOARD_PUBLIC_API_URL=https://api-staging.hoxiq.com
NEXT_PUBLIC_SITE_URL=https://staging.hoxiq.com
```

### Vercel env: production
```env
DASHBOARD_BACKEND_ORIGIN=https://api.hoxiq.com
DASHBOARD_PUBLIC_API_URL=https://api.hoxiq.com
NEXT_PUBLIC_SITE_URL=https://app.hoxiq.com
```

## Hostinger DNS
- [ ] Point `staging` to Vercel with the CNAME Vercel gives you.
- [ ] Point `app` to Vercel with the CNAME Vercel gives you.
- [ ] Point `api-staging` to the staging VM public IP.
- [ ] Point `api` to the production VM public IP.
- [ ] Keep TTL low at first, such as `300`.

## Oracle / VM
- [ ] Create one staging Ubuntu VM.
- [ ] Open `22` and `443`.
- [ ] Attach a stable public IP.
- [ ] Install Docker with `deploy/oracle/bootstrap-ubuntu.sh`.
- [ ] Copy only `backend` onto the VM.
- [ ] Work from `backend` on the VM.
- [ ] If the VM already runs another web app on `80`, keep HOXiq on `127.0.0.1:3456` and let Caddy serve only `443`.

### Backend env: staging
```env
CONTROL_PLANE_BASE_URL=https://api-staging.hoxiq.com
CONTROL_PLANE_BIND=127.0.0.1:3456
DASHBOARD_PUBLIC_URL=https://staging.hoxiq.com
DISCORD_OAUTH_REDIRECT_URI=https://staging.hoxiq.com/auth/callback
BOT_DASHBOARD_DOMAIN=api-staging.hoxiq.com
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
PLATFORM_ENCRYPTION_KEY=...
OWNER_DISCORD_ID=...
ACME_EMAIL=you@example.com
```

### Optional premium env: staging
```env
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PREMIUM_PRICE_ID=...
STRIPE_SUCCESS_URL=https://staging.hoxiq.com/app
STRIPE_CANCEL_URL=https://staging.hoxiq.com/app
```

### Backend env: production
```env
CONTROL_PLANE_BASE_URL=https://api.hoxiq.com
CONTROL_PLANE_BIND=127.0.0.1:3456
DASHBOARD_PUBLIC_URL=https://app.hoxiq.com
DISCORD_OAUTH_REDIRECT_URI=https://app.hoxiq.com/auth/callback
BOT_DASHBOARD_DOMAIN=api.hoxiq.com
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
PLATFORM_ENCRYPTION_KEY=...
OWNER_DISCORD_ID=...
ACME_EMAIL=you@example.com
```

### VM deploy commands
```bash
cd /opt/hoxiq/backend
cp .env.example .env
sudo bash deploy/oracle/bootstrap-ubuntu.sh
npm run validate:catalog
./deploy/oracle/deploy.sh
```

### Push backend from this Ubuntu machine
```bash
cd /home/praneon/Desktop/discord_bot/backend
npm run sync:catalog
npm run validate:catalog
./deploy/oracle/push.sh ubuntu@YOUR_VM_PUBLIC_IP /opt/hoxiq/backend
ssh ubuntu@YOUR_VM_PUBLIC_IP
cd /opt/hoxiq/backend
npm run validate:catalog
./deploy/oracle/deploy.sh
```

## Reverse Proxy
- [ ] Use the built-in `caddy` service in `backend/compose.yaml` for HTTPS on `443`.
- [ ] Point `api-staging.hoxiq.com` to the staging VM public IP.
- [ ] Point `api.hoxiq.com` to the production VM public IP.
- [ ] Keep the backend app itself bound to `127.0.0.1:3456`.

## Discord Developer Portal
- [ ] Create a separate staging Discord application if possible.
- [ ] Add OAuth redirect URIs:
  - `https://staging.hoxiq.com/auth/callback`
  - `https://app.hoxiq.com/auth/callback`
- [ ] Enable `Guild Install`.
- [ ] Set guild scopes to:
  - `bot`
  - `applications.commands`
- [ ] Enable these bot intents:
  - `Server Members Intent`
  - `Message Content Intent`
- [ ] Use HOXiq to store the bot token after deploy. Do not commit bot tokens into the repo.

## Post-Deploy Staging Checks
- [ ] Open `https://staging.hoxiq.com`.
- [ ] Sign in with Discord.
- [ ] Open server setup.
- [ ] Validate the bot token in HOXiq.
- [ ] Click `Invite bot`.
- [ ] Confirm the bot comes online.
- [ ] Confirm slash commands register in the test guild.
- [ ] Confirm one Full Suite flow works.
- [ ] Confirm one Focused slot flow works.

## Promotion
- [ ] Merge tested work into `master`.
- [ ] Let Vercel deploy `master` to staging.
- [ ] Redeploy the staging VM from the updated local `backend` source.
- [ ] Test OAuth, bot login, templates, commands, and premium.
- [ ] Merge `master` into `main`.
- [ ] Let Vercel deploy `main` to production.
- [ ] Redeploy the production VM from the updated local `backend` source or its own repo if you create one later.

## Final Closure Gates (Batch 6C)
- [ ] Re-run backend readiness checks:
  - `cd backend && npm run typecheck`
  - `cd backend && npm test`
  - `cd backend && npm run doctor`
  - `cd backend && npm run check:catalog-sync`
- [ ] Re-run frontend sanity check:
  - `cd frontend && npm run typecheck`
- [ ] Confirm rollback controls are documented and operator-known:
  - `ROLE_SYNC_MUTATION_MODE=legacy-discord-js`
  - `OPS_SHARD_STATS_STORE_MODE=sqlite`
- [ ] Confirm alert runbook links are current:
  - `docs/operations/OPS_ALERT_RUNBOOKS.md`
- [ ] Confirm final residual risk register is reviewed:
  - `docs/operations/FINAL_READINESS_SIGNOFF_2026-03-14.md`

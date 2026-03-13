# HOXiq UI TODO / FIX

Updated: `2026-03-13`

Purpose:
- Track frontend abnormalities and cleanup targets while the UI is being refined.
- Keep quick wins separate from larger structural refactors.

## Done In This Pass

### 1. Shared descriptions now render
- Fixed `SectionHeader` so `description` is actually visible.
- Fixed `EmptyState` so `description` is actually visible.
- Impacted primitive:
  - `dashboard/src/components/console/ConsolePrimitives.tsx`
- Why it mattered:
  - Many loading, empty, and error states were passing descriptions that never appeared, which made screens feel unfinished and reduced guidance.

### 2. `/app/bots` no longer falls into a blank screen
- Added an explicit empty state when `returnTo` is missing.
- Impacted screen:
  - `dashboard/src/app/app/bots/BotsPageClient.tsx`
- Why it mattered:
  - Visiting `/app/bots` directly returned `null`, which looked like a broken page instead of a guided workflow.

### 3. Mobile server picker panel tightened
- Reworked the `/app` server-directory mobile breakpoints so the hero reads left-aligned and the server cards use less horizontal space for artwork.
- Impacted styles:
  - `dashboard/src/components/console/console.module.scss`
- Why it mattered:
  - On narrow screens the centered hero and oversized media blocks made the panel feel cramped and caused server cards to look squeezed.

### 4. Server-directory `Go` action now lands on server overview
- Changed connected-server cards on `/app` to enter `/app/setup?guild=...` instead of jumping straight into the bot workspace module grid.
- Impacted screen:
  - `dashboard/src/app/app/page.tsx`
- Why it mattered:
  - The previous entry path skipped the server overview/provisioning page and felt like it was dropping users into the wrong screen.

## Open TODO / FIX

### 1. Centralize route metadata for the console shell
- Files:
  - `dashboard/src/components/console/ConsoleShell.tsx`
- Evidence:
  - Hard-coded route checks and labels are spread across multiple condition blocks.
  - Logout behavior is duplicated for desktop and mobile actions.
- Risk:
  - Every new route tweak can create inconsistent sidebar, back-link, and page-label behavior.
- Fix direction:
  - Move route metadata into one config map or helper so layout mode, label, and back-link rules live in one place.

### 2. Stop fetching bot workspace data in the shell just to build the top label
- Files:
  - `dashboard/src/components/console/ConsoleShell.tsx`
- Evidence:
  - The shell performs a bot workspace request just to compute `workspaceServerLabel`.
- Risk:
  - Extra network work during navigation and more chances for topbar flicker or stale labels.
- Fix direction:
  - Feed this data from bootstrap when possible, or cache it per bot workspace instead of refetching in the shell.

### 3. Break up the bot workspace mega-component
- Files:
  - `dashboard/src/components/console/BotWorkspaceScreen.tsx`
- Evidence:
  - The file is `5698` lines long and mixes layout, forms, mutations, module rendering, and operational views.
- Risk:
  - Hard to test, hard to reason about, easy to regress, and expensive to restyle consistently.
- Fix direction:
  - Split by module section and move repeated mutation/state logic into focused hooks.

### 4. Replace inline visual styling with shared tokens and reusable view helpers
- Files:
  - `dashboard/src/app/app/setup/SetupPageClient.tsx`
  - `dashboard/src/app/app/provision/ProvisionPageClient.tsx`
  - `dashboard/src/app/app/page.tsx`
  - `dashboard/src/app/app/plugins/PluginsPageClient.tsx`
  - `dashboard/src/app/app/bots/BotsPageClient.tsx`
- Evidence:
  - Repeated inline `backgroundImage` and one-off border color styles appear across multiple screens.
- Risk:
  - Visual drift, harder theme changes, and more brittle UI polish work.
- Fix direction:
  - Introduce shared avatar/hero utilities and theme-token classes for selected-card states.

### 5. Remove dead or empty layout fragments during UI cleanup
- Files:
  - `dashboard/src/app/app/setup/SetupPageClient.tsx`
- Evidence:
  - Empty wrapper nodes exist, such as the empty `inlineMeta` block in the provisioning card.
- Risk:
  - Low direct user impact, but it adds markup noise and makes future refactors slower.
- Fix direction:
  - Remove placeholder wrappers unless they carry real content or responsive behavior.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const requiredPaths = [
  "src/app/(public)/layout.tsx",
  "src/app/(public)/page.tsx",
  "src/app/(public)/docs/page.tsx",
  "src/app/(public)/pricing/page.tsx",
  "src/app/(public)/add-bot/page.tsx",
  "src/app/(public)/login/page.tsx",
  "src/app/(console)/app/layout.tsx",
  "src/app/(console)/app/servers/page.tsx",
  "src/app/(console)/app/servers/[serverId]/page.tsx",
  "src/app/(console)/app/servers/[serverId]/main/workspace/layout.tsx",
  "src/app/(console)/app/servers/[serverId]/focused/[slot]/workspace/layout.tsx",
  "src/app/(compat)/app/page.tsx",
  "src/app/(compat)/app/bots/page.tsx",
  "src/app/(compat)/app/setup/page.tsx",
  "src/app/(compat)/app/setup/focused/page.tsx",
  "src/app/(compat)/app/provision/page.tsx",
  "src/app/(compat)/app/plugins/page.tsx",
  "src/app/(compat)/app/[guildId]/modules/page.tsx",
  "src/features/contracts/frontend-rewrite-contract.ts",
  "src/features/contracts/dormant-states.ts",
  "src/features/placeholders/ModulePlaceholderSurface.tsx",
];

const missingPaths = requiredPaths.filter(relativePath => !existsSync(path.join(root, relativePath)));

if (missingPaths.length > 0) {
  console.error("Missing rewrite contract files:");
  for (const relativePath of missingPaths) {
    console.error(`- ${relativePath}`);
  }
  process.exit(1);
}

const catalogPath = path.join(root, "shared/template-catalog.json");
const catalogRaw = readFileSync(catalogPath, "utf8");
const catalog = JSON.parse(catalogRaw);
const moduleCount = Array.isArray(catalog.modules) ? catalog.modules.length : 0;
const templateCount = Array.isArray(catalog.templates) ? catalog.templates.length : 0;

if (moduleCount < 1 || templateCount < 1) {
  console.error("Canonical catalog is invalid for rewrite placeholders.");
  process.exit(1);
}

if (moduleCount !== 31 || templateCount !== 8) {
  console.error(
    `Unexpected canonical coverage. Expected modules=31/templates=8 but got modules=${moduleCount}/templates=${templateCount}.`,
  );
  process.exit(1);
}

const placeholderSurface = readFileSync(
  path.join(root, "src/features/placeholders/ModulePlaceholderSurface.tsx"),
  "utf8",
);
const requiredDormantStates = [
  "DORMANT_UNPROVISIONED",
  "DORMANT_NOT_IN_TEMPLATE",
  "DORMANT_NOT_IMPLEMENTED",
];
const missingDormantStates = requiredDormantStates.filter(state => !placeholderSurface.includes(state));
if (missingDormantStates.length > 0) {
  console.error("Missing dormant placeholder states in ModulePlaceholderSurface:");
  for (const state of missingDormantStates) {
    console.error(`- ${state}`);
  }
  process.exit(1);
}

console.log("Frontend rewrite contract validation passed.");

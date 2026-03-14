export type ShellOwner =
  | "PublicShell"
  | "ConsoleFlowShell"
  | "WorkspaceShellMain"
  | "WorkspaceShellFocused"
  | "CompatWrapper";

export const FRONTEND_BATCH_IDS = [
  "FR0",
  "FR1",
  "FR2",
  "FR3",
  "FR4",
  "FR5",
  "FR6",
  "FR7",
] as const;

export const NO_SIDEBAR_ROUTE_PATTERNS = [
  "/",
  "/docs",
  "/pricing",
  "/add-bot",
  "/login",
  "/app/servers",
  "/app/servers/:serverId",
  "/app/servers/:serverId/main/templates",
  "/app/servers/:serverId/focused",
] as const;

export const SIDEBAR_ALLOWED_ROUTE_PATTERNS = [
  "/app/servers/:serverId/main/workspace",
  "/app/servers/:serverId/main/workspace/modules/:moduleId",
  "/app/servers/:serverId/focused/:slot/workspace",
  "/app/servers/:serverId/focused/:slot/workspace/modules/:moduleId",
] as const;

export const COMPAT_ROUTE_PATHS = [
  "/app",
  "/app/bots",
  "/app/setup",
  "/app/setup/focused",
  "/app/provision",
  "/app/plugins",
  "/app/[guildId]/modules",
] as const;

export const FRONTEND_ROUTE_OWNERSHIP: Array<{ route: string; owner: ShellOwner }> = [
  { route: "/", owner: "PublicShell" },
  { route: "/docs", owner: "PublicShell" },
  { route: "/pricing", owner: "PublicShell" },
  { route: "/add-bot", owner: "PublicShell" },
  { route: "/login", owner: "PublicShell" },
  { route: "/app/servers", owner: "ConsoleFlowShell" },
  { route: "/app/servers/:serverId", owner: "ConsoleFlowShell" },
  { route: "/app/servers/:serverId/main/templates", owner: "ConsoleFlowShell" },
  { route: "/app/servers/:serverId/focused", owner: "ConsoleFlowShell" },
  { route: "/app/servers/:serverId/main/workspace", owner: "WorkspaceShellMain" },
  { route: "/app/servers/:serverId/focused/:slot/workspace", owner: "WorkspaceShellFocused" },
  { route: "/app", owner: "CompatWrapper" },
  { route: "/app/bots", owner: "CompatWrapper" },
  { route: "/app/setup", owner: "CompatWrapper" },
  { route: "/app/setup/focused", owner: "CompatWrapper" },
  { route: "/app/provision", owner: "CompatWrapper" },
  { route: "/app/plugins", owner: "CompatWrapper" },
  { route: "/app/[guildId]/modules", owner: "CompatWrapper" },
];

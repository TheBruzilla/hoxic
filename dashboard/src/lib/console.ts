import type { IconType } from "react-icons";
import {
  LuActivity,
  LuBell,
  LuBot,
  LuBoxes,
  LuBrainCircuit,
  LuChartColumn,
  LuCircleDollarSign,
  LuCircleHelp,
  LuCog,
  LuGift,
  LuHouse,
  LuMessageSquareText,
  LuRadio,
  LuShield,
  LuSparkles,
  LuTicket,
  LuUsers,
  LuWandSparkles,
} from "react-icons/lu";
import {
  getTemplateCatalogTemplate,
  moduleDisplayOrder as templateCatalogModuleDisplayOrder,
  moduleEntityLabels as templateCatalogModuleEntityLabels,
} from "@/lib/templateCatalog";

export type ModuleId =
  | "moderation"
  | "automod"
  | "autorole"
  | "roleCommands"
  | "reputation"
  | "logs"
  | "notifications"
  | "onboarding"
  | "verification"
  | "reactionRoles"
  | "tickets"
  | "modmail"
  | "ai"
  | "reminders"
  | "rss"
  | "webhooks"
  | "componentsV2"
  | "musicVoice"
  | "voiceRoles"
  | "serverStats"
  | "feeds"
  | "reddit"
  | "twitch"
  | "youtube"
  | "streaming"
  | "rsvp"
  | "soundboard"
  | "customCommands"
  | "premium"
  | "personalizer"
  | "utilities";

export const GUILD_TEMPLATE_KEY_FIELD = "__templateKey";

export interface ModuleToggle {
  enabled: boolean;
  settings: Record<string, unknown>;
}

export type AdminRole = "owner" | "admin";
export type BotStatus = "running" | "starting" | "stopped" | "error";
export type BotRole = "primary" | "secondary";
export type ProvisioningMode = "none" | "primary" | "secondary" | "invalid";
export type ProvisioningBlockedReason =
  | "remove_secondary_bots_first"
  | "full_suite_already_installed"
  | "invalid_existing_state"
  | null;

export interface AdminRecord {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  role: AdminRole;
  invitedBy: string | null;
  createdAt: number;
  lastLoginAt: number;
}

export interface TemplateDefinition {
  key: string;
  name: string;
  description?: string;
  modules?: string[];
  defaults?: Partial<Record<ModuleId, ModuleToggle>>;
}

export interface BotRecord {
  id: string;
  name: string;
  role: BotRole;
  templateKey: string;
  status: BotStatus;
  desiredState: "running" | "stopped";
  autoStart: boolean;
  botUserId: string | null;
  applicationId: string | null;
  featureOverrides: Record<string, unknown>;
  metadata: Record<string, unknown>;
  lastValidatedAt: number | null;
  lastError: string | null;
}

export interface WorkerHeartbeat {
  botInstanceId: string;
  status: BotStatus;
  pid: number;
  startedAt: number;
  heartbeatAt: number;
  guildCount: number;
  userCount: number;
  metrics: Record<string, number | string | boolean>;
  lastError?: string | null;
}

export interface BotGuildRecord {
  id: string;
  name: string;
  memberCount: number;
}

export interface GuildChannelRecord {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
}

export interface GuildRoleRecord {
  id: string;
  name: string;
  position: number;
  managed: boolean;
}

export interface GuildResourcesPayload {
  guildId: string;
  channels: GuildChannelRecord[];
  roles: GuildRoleRecord[];
}

export type FeedKind = "feed" | "rss" | "reddit" | "twitch" | "youtube" | "streaming";

export interface FeedRecord {
  id: string;
  botInstanceId: string;
  guildId: string;
  channelId: string;
  name: string;
  feedUrl: string;
  kind: FeedKind;
  lastSeenId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ReputationRecord {
  botInstanceId: string;
  guildId: string;
  userId: string;
  points: number;
  updatedAt: number;
}

export interface RsvpEventRecord {
  id: string;
  botInstanceId: string;
  guildId: string;
  channelId: string;
  messageId: string | null;
  title: string;
  description: string;
  status: "open" | "closed";
  allowMaybe: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface RsvpResponseRecord {
  eventId: string;
  userId: string;
  response: "yes" | "maybe" | "no";
  updatedAt: number;
}

export type AutomodTriggerType =
  | "keyword"
  | "regex"
  | "invite"
  | "mention-spam"
  | "caps"
  | "repeated-message"
  | "attachment"
  | "account-age";

export type AutomodActionType = "flag" | "delete" | "timeout" | "kick" | "ban";

export interface AutomodRuleRecord {
  id: string;
  botInstanceId: string;
  guildId: string;
  name: string;
  triggerType: AutomodTriggerType;
  config: Record<string, unknown>;
  action: AutomodActionType;
  actionDurationMinutes: number | null;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CustomCommandTriggerType = "command" | "startsWith" | "contains" | "exact" | "regex";

export interface CustomCommandRecord {
  id: string;
  botInstanceId: string;
  guildId: string;
  name: string;
  triggerType: CustomCommandTriggerType;
  trigger: string;
  caseSensitive: boolean;
  responseText: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AiConfigRecord {
  botInstanceId: string;
  providerType: "openai" | "anthropic" | "gemini" | "openai-compatible";
  endpoint: string | null;
  model: string;
  options: Record<string, unknown>;
}

export interface MessageTemplateRecord {
  id: string;
  botInstanceId: string | null;
  guildId: string | null;
  name: string;
  description: string;
  status: "draft" | "published";
  dispatchMode: "bot" | "webhook";
  channelId: string | null;
  payload: Record<string, unknown>;
  interactionSchema: Record<string, unknown>;
  tags: string[];
  shareToken: string | null;
  sourceTemplateId: string | null;
  createdBy: string;
  createdAt: number;
  publishedAt: number | null;
  lastSentAt: number | null;
  updatedAt: number;
}

export interface ManagedMessageRecord {
  id: string;
  templateId: string;
  botInstanceId: string;
  guildId: string;
  channelId: string;
  messageId: string;
  dispatchMode: "bot";
  interactionState: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface PremiumPlanRecord {
  id: string;
  name: string;
  description: string;
  stripePriceId: string | null;
  isActive: boolean;
  features: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface GuildEntitlementRecord {
  id: string;
  guildId: string;
  planId: string;
  subscriptionId: string | null;
  slotId: string | null;
  source: "stripe" | "manual" | "redeem-code";
  status: "active" | "cancelled" | "expired";
  startsAt: number;
  endsAt: number | null;
  features: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface GuildPersonalizationRecord {
  botInstanceId: string;
  guildId: string;
  nickname: string | null;
  avatarSource: string | null;
  bannerSource: string | null;
  updatedAt: number;
  lastAppliedAt: number | null;
}

export interface WebhookRecord {
  id: string;
  botInstanceId: string;
  name: string;
  secret: string;
  channelId: string;
  kind: "generic" | "sentry" | "github";
  isActive: boolean;
  createdAt: number;
}

export interface AuditRecord {
  id: string;
  botInstanceId: string | null;
  actorUserId: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown>;
  createdAt: number;
}

export interface RuntimeSnapshot {
  host: {
    hostname: string;
    platform: string;
    arch: string;
    cpuCount: number;
    uptimeSeconds: number;
    loadAverage: number[];
    totalMemoryBytes: number;
    freeMemoryBytes: number;
    usedMemoryBytes: number;
  };
  controlPlane: {
    pid: number;
    uptimeMs: number;
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    externalBytes: number;
  };
  fleet: {
    botCount: number;
    runningCount: number;
    totalGuilds: number;
    totalUsers: number;
    totalBotRssBytes: number;
    totalBotCpuPercent: number;
    heaviestByMemoryBotId: string | null;
    heaviestByCpuBotId: string | null;
  };
}

export interface ManageableGuildRecord {
  id: string;
  name: string;
  iconUrl: string | null;
  isOwner: boolean;
  permissions: string;
  memberCount: number;
  botIds: string[];
  connectedBotNames: string[];
  primaryBotId: string | null;
  provisioning: {
    mode: ProvisioningMode;
    blockedReason: ProvisioningBlockedReason;
    primaryBotId: string | null;
    secondaryBotIds: string[];
    remainingFocusedSlots: number;
  };
}

export interface BootstrapPayload {
  me: AdminRecord | null;
  manageableGuilds: ManageableGuildRecord[];
  templates: TemplateDefinition[];
  admins: AdminRecord[];
  bots: BotRecord[];
  heartbeats: WorkerHeartbeat[];
  aiConfigs: AiConfigRecord[];
  messageTemplates: MessageTemplateRecord[];
  webhooks: WebhookRecord[];
  auditLogs: AuditRecord[];
  runtime: RuntimeSnapshot;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function getFallbackProvisioningMode(primaryBotId: string | null, botIds: string[]) {
  if (primaryBotId) {
    return "primary" as ProvisioningMode;
  }

  if (botIds.length > 0) {
    return "secondary" as ProvisioningMode;
  }

  return "none" as ProvisioningMode;
}

function getFallbackBlockedReason(mode: ProvisioningMode): ProvisioningBlockedReason {
  if (mode === "primary") {
    return "full_suite_already_installed";
  }

  if (mode === "secondary") {
    return "remove_secondary_bots_first";
  }

  if (mode === "invalid") {
    return "invalid_existing_state";
  }

  return null;
}

export function normalizeBotRecord(bot: BotRecord): BotRecord {
  return {
    ...bot,
    role: bot.role || (bot.templateKey === "full-suite" ? "primary" : "secondary"),
    featureOverrides: isObjectRecord(bot.featureOverrides) ? bot.featureOverrides : {},
    metadata: isObjectRecord(bot.metadata) ? bot.metadata : {},
  };
}

export function normalizeManageableGuildRecord(
  guild: Partial<ManageableGuildRecord>,
  bots: BotRecord[],
): ManageableGuildRecord {
  const botIds = isStringArray(guild.botIds) ? [...new Set(guild.botIds)] : [];
  const primaryBotId = typeof guild.primaryBotId === "string" ? guild.primaryBotId : null;
  const connectedBotNames = isStringArray(guild.connectedBotNames)
    ? guild.connectedBotNames
    : botIds
        .map(id => bots.find(bot => bot.id === id)?.name || null)
        .filter((value): value is string => Boolean(value));
  const rawProvisioning = isObjectRecord(guild.provisioning) ? guild.provisioning : null;
  const fallbackMode = getFallbackProvisioningMode(primaryBotId, botIds);
  const secondaryBotIds = isStringArray(rawProvisioning?.secondaryBotIds)
    ? rawProvisioning.secondaryBotIds
    : primaryBotId
      ? botIds.filter(id => id !== primaryBotId)
      : botIds;
  const primaryProvisioningBotId =
    typeof rawProvisioning?.primaryBotId === "string" ? rawProvisioning.primaryBotId : primaryBotId;
  const mode =
    rawProvisioning?.mode === "primary" ||
    rawProvisioning?.mode === "secondary" ||
    rawProvisioning?.mode === "invalid" ||
    rawProvisioning?.mode === "none"
      ? rawProvisioning.mode
      : fallbackMode;
  const remainingFocusedSlots =
    typeof rawProvisioning?.remainingFocusedSlots === "number" && Number.isFinite(rawProvisioning.remainingFocusedSlots)
      ? rawProvisioning.remainingFocusedSlots
      : mode === "secondary"
        ? Math.max(0, 4 - secondaryBotIds.length)
        : mode === "none"
          ? 4
          : 0;

  return {
    id: typeof guild.id === "string" ? guild.id : "",
    name: typeof guild.name === "string" ? guild.name : "Unknown server",
    iconUrl: typeof guild.iconUrl === "string" ? guild.iconUrl : null,
    isOwner: Boolean(guild.isOwner),
    permissions: typeof guild.permissions === "string" ? guild.permissions : "0",
    memberCount: typeof guild.memberCount === "number" && Number.isFinite(guild.memberCount) ? guild.memberCount : 0,
    botIds,
    connectedBotNames,
    primaryBotId,
    provisioning: {
      mode,
      blockedReason:
        rawProvisioning?.blockedReason === "remove_secondary_bots_first" ||
        rawProvisioning?.blockedReason === "full_suite_already_installed" ||
        rawProvisioning?.blockedReason === "invalid_existing_state" ||
        rawProvisioning?.blockedReason === null
          ? rawProvisioning.blockedReason
          : getFallbackBlockedReason(mode),
      primaryBotId: primaryProvisioningBotId,
      secondaryBotIds,
      remainingFocusedSlots,
    },
  };
}

export interface BotWorkspacePayload {
  bot: BotRecord;
  ai: AiConfigRecord | null;
  guildConfigs: Array<{ botInstanceId: string; guildId: string; overrides: Record<string, unknown> }>;
  guilds: BotGuildRecord[];
  templates: MessageTemplateRecord[];
  managedMessages: ManagedMessageRecord[];
  webhooks: WebhookRecord[];
  feeds: FeedRecord[];
  reputations: ReputationRecord[];
  automodRules: AutomodRuleRecord[];
  rsvpEvents: RsvpEventRecord[];
  rsvpResponses: RsvpResponseRecord[];
  threads: Array<Record<string, unknown>>;
  auditLogs: AuditRecord[];
  premiumPlans: PremiumPlanRecord[];
  entitlements: GuildEntitlementRecord[];
  personalizations: GuildPersonalizationRecord[];
  heartbeat: WorkerHeartbeat | null;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined && init.body !== null;
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    credentials: "include",
    headers,
    ...init,
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(payload.message || response.statusText);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export function getHeartbeat(bootstrap: BootstrapPayload | null, botId: string) {
  return bootstrap?.heartbeats.find(item => item.botInstanceId === botId) || null;
}

export function getAiConfig(bootstrap: BootstrapPayload | null, botId: string) {
  return bootstrap?.aiConfigs.find(item => item.botInstanceId === botId) || null;
}

export function getBotRuntimeMetric(heartbeat: WorkerHeartbeat | null, key: string) {
  const value = heartbeat?.metrics?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatPercent(value: number) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function displayName(admin: AdminRecord | null) {
  if (!admin) return "Guest";
  return admin.globalName || admin.username;
}

export function statusTone(status: string) {
  if (status === "running" || status === "Live") return "running";
  if (status === "starting" || status === "Beta" || status === "Preview") return "starting";
  return "danger";
}

export interface ConsoleNavItem {
  id: string;
  label: string;
  href: string;
  icon: IconType;
  badge?: string;
  badgeTone?: "soft" | "beta" | "premium" | "new";
  exact?: boolean;
}

export type BotWorkspaceSection =
  | "overview"
  | "settings"
  | "audit"
  | "moderation"
  | "automod"
  | "autorole"
  | "role-commands"
  | "reputation"
  | "premium"
  | "personalizer"
  | "logs"
  | "notifications"
  | "onboarding"
  | "verification"
  | "reaction-roles"
  | "tickets"
  | "modmail"
  | "ai"
  | "reminders"
  | "rss"
  | "webhooks"
  | "templates"
  | "music-voice"
  | "voice-roles"
  | "server-stats"
  | "feeds"
  | "reddit"
  | "twitch"
  | "youtube"
  | "streaming"
  | "rsvp"
  | "soundboard"
  | "custom-commands"
  | "controls";

interface BotModuleNavDefinition {
  id: string;
  label: string;
  icon: IconType;
  section: BotWorkspaceSection;
}

export interface PluginGroup {
  key: string;
  label: string;
}

export interface PluginDefinition {
  id: string;
  title: string;
  category: string;
  status: "Live" | "Beta" | "Preview" | "Premium" | "New";
  description: string;
  href: string;
  icon: IconType;
  popular?: boolean;
}

export const pluginGroups: PluginGroup[] = [
  { key: "all", label: "All Plugins" },
  { key: "essentials", label: "Essentials" },
  { key: "server-management", label: "Server Management" },
  { key: "utilities", label: "Utilities" },
  { key: "social-alerts", label: "Social Alerts" },
  { key: "games-fun", label: "Games & Fun" },
];

export const pluginCatalog: PluginDefinition[] = [
  { id: "welcome-goodbye", title: "Welcome & Goodbye", category: "essentials", status: "Live", description: "Automate onboarding messages and first-touch member flows.", href: "/app/bots", icon: LuSparkles, popular: true },
  { id: "welcome-channel", title: "Welcome Channel", category: "essentials", status: "Live", description: "Route welcome content and essential server guidance into dedicated channels.", href: "/app/bots", icon: LuMessageSquareText, popular: true },
  { id: "reaction-roles", title: "Reaction Roles", category: "essentials", status: "Live", description: "Give members roles through reaction-driven onboarding and self-service panels.", href: "/app/bots", icon: LuWandSparkles, popular: true },
  { id: "moderator", title: "Moderator", category: "essentials", status: "Live", description: "Operate moderation, logs, and enforcement workflows from one bot workspace.", href: "/app/bots", icon: LuShield, popular: true },
  { id: "levels", title: "Levels", category: "essentials", status: "Preview", description: "Track progression, rank surfaces, and activity through one dashboard.", href: "/app/plugins?group=essentials", icon: LuChartColumn },
  { id: "achievements", title: "Achievements", category: "essentials", status: "Preview", description: "Layer milestone rewards and achievement moments on top of server workflows.", href: "/app/plugins?group=essentials", icon: LuSparkles },
  { id: "starboards", title: "Starboards", category: "essentials", status: "New", description: "Highlight high-signal community posts with a dedicated starboard flow.", href: "/app/plugins?group=essentials", icon: LuBell, popular: true },
  { id: "leaderboard", title: "Leaderboard", category: "games-fun", status: "Live", description: "Turn runtime and community activity into ranked views.", href: "/app/runtime", icon: LuChartColumn, popular: true },
  { id: "settings", title: "Settings", category: "utilities", status: "Live", description: "Keep platform-level settings in a dedicated operator page.", href: "/app/operators", icon: LuCog },
  { id: "emojis", title: "Emojis", category: "utilities", status: "Preview", description: "Manage emoji-aware workflows and richer Discord reactions.", href: "/app/plugins?group=utilities", icon: LuSparkles },
  { id: "automations", title: "Automations", category: "server-management", status: "Live", description: "Trigger scheduled and repeated server workflows.", href: "/app/bots", icon: LuCog, popular: true },
  { id: "custom-commands", title: "Custom Commands", category: "server-management", status: "Live", description: "Define repeatable bot commands and reusable responses.", href: "/app/bots", icon: LuBoxes, popular: true },
  { id: "invite-tracker", title: "Invite Tracker", category: "server-management", status: "Live", description: "Attribute joins and growth to invite-level sources.", href: "/app/runtime", icon: LuUsers, popular: true },
  { id: "ticketing", title: "Ticketing", category: "server-management", status: "Live", description: "Run intake forms, claims, transcripts, and support queues.", href: "/app/bots", icon: LuTicket, popular: true },
  { id: "polls", title: "Polls", category: "utilities", status: "Live", description: "Launch quick voting surfaces for community decisions.", href: "/app/plugins?group=utilities", icon: LuChartColumn },
  { id: "embed-messages", title: "Embed Messages", category: "utilities", status: "Live", description: "Create polished message layouts and Components V2 payloads.", href: "/app/bots", icon: LuMessageSquareText, popular: true },
  { id: "search-anything", title: "Search Anything", category: "utilities", status: "Preview", description: "Open searchable operator flows for messages and resources.", href: "/app/plugins?group=utilities", icon: LuBoxes },
  { id: "help", title: "Help", category: "utilities", status: "Live", description: "Centralize help content and reusable informational surfaces.", href: "/app/operators", icon: LuCircleHelp },
  { id: "reminders", title: "Reminders", category: "utilities", status: "Live", description: "Schedule reminders with runtime-backed persistence.", href: "/app/runtime", icon: LuBell, popular: true },
  { id: "statistics-channels", title: "Statistics Channels", category: "utilities", status: "Live", description: "Expose metric-driven channel surfaces from runtime data.", href: "/app/runtime", icon: LuChartColumn },
  { id: "temporary-channels", title: "Temporary Channels", category: "utilities", status: "Preview", description: "Manage disposable voice or text channel flows.", href: "/app/plugins?group=utilities", icon: LuBoxes },
  { id: "twitch-alerts", title: "Twitch Alerts", category: "social-alerts", status: "Live", description: "Send Twitch presence changes into Discord channels.", href: "/app/bots", icon: LuRadio, popular: true },
  { id: "tiktok-alerts", title: "TikTok Alerts", category: "social-alerts", status: "Preview", description: "Prepare short-form alert flows for TikTok content.", href: "/app/plugins?group=social-alerts", icon: LuRadio },
  { id: "x-alerts", title: "X Alerts", category: "social-alerts", status: "Preview", description: "Watch X accounts and relay updates through bots.", href: "/app/plugins?group=social-alerts", icon: LuRadio },
  { id: "bluesky-alerts", title: "Bluesky Alerts", category: "social-alerts", status: "Preview", description: "Route Bluesky activity through the same alert surface.", href: "/app/plugins?group=social-alerts", icon: LuRadio },
  { id: "youtube-alerts", title: "YouTube Alerts", category: "social-alerts", status: "Live", description: "Track YouTube uploads and stream signals.", href: "/app/bots", icon: LuRadio, popular: true },
  { id: "reddit-alerts", title: "Reddit Alerts", category: "social-alerts", status: "Live", description: "Mirror subreddit activity into Discord channels.", href: "/app/bots", icon: LuRadio },
  { id: "instagram-alerts", title: "Instagram Alerts", category: "social-alerts", status: "Preview", description: "Add Instagram tracking to the same alert stack.", href: "/app/plugins?group=social-alerts", icon: LuRadio },
  { id: "rss-feeds", title: "RSS Feeds", category: "social-alerts", status: "Live", description: "Feed external content into managed bots through RSS.", href: "/app/bots", icon: LuRadio, popular: true },
  { id: "kick-alerts", title: "Kick Alerts", category: "social-alerts", status: "Preview", description: "Extend streaming alerts to Kick.", href: "/app/plugins?group=social-alerts", icon: LuRadio },
  { id: "podcast-alerts", title: "Podcast Alerts", category: "social-alerts", status: "Preview", description: "Ingest podcast updates through the same notification plane.", href: "/app/plugins?group=social-alerts", icon: LuRadio },
  { id: "giveaways", title: "Giveaways", category: "games-fun", status: "Preview", description: "Run giveaway flows and reward drops.", href: "/app/plugins?group=games-fun", icon: LuGift },
  { id: "birthdays", title: "Birthdays", category: "games-fun", status: "Live", description: "Track member birthdays and automate celebratory posts.", href: "/app/bots", icon: LuGift },
  { id: "music-quiz", title: "Music Quiz", category: "games-fun", status: "Preview", description: "Stage lightweight music games through the bot runtime.", href: "/app/plugins?group=games-fun", icon: LuGift },
  { id: "economy", title: "Economy", category: "games-fun", status: "Preview", description: "Economy modules stay optional, but the dashboard can host them.", href: "/app/plugins?group=games-fun", icon: LuCircleDollarSign },
];

export const appNavSections: Array<{ label: string; items: ConsoleNavItem[] }> = [
  {
    label: "Core",
    items: [
      { id: "overview", label: "Servers", href: "/app", icon: LuHouse, exact: true },
      { id: "bots", label: "Main Bot", href: "/app/bots", icon: LuBot },
      { id: "plugins", label: "Plugin Library", href: "/app/plugins", icon: LuBoxes },
      { id: "runtime", label: "Runtime", href: "/app/runtime", icon: LuActivity },
      { id: "operators", label: "Operators", href: "/app/operators", icon: LuUsers },
    ],
  },
];

const botModuleNavDefinitions: Partial<Record<ModuleId, BotModuleNavDefinition>> = {
  moderation: {
    id: "bot-moderation",
    label: "Moderator",
    icon: LuShield,
    section: "moderation",
  },
  automod: {
    id: "bot-automod",
    label: "AutoMod",
    icon: LuShield,
    section: "automod",
  },
  autorole: {
    id: "bot-autorole",
    label: "Auto Role",
    icon: LuSparkles,
    section: "autorole",
  },
  roleCommands: {
    id: "bot-role-commands",
    label: "Role Commands",
    icon: LuUsers,
    section: "role-commands",
  },
  reputation: {
    id: "bot-reputation",
    label: "Reputation",
    icon: LuActivity,
    section: "reputation",
  },
  premium: {
    id: "bot-premium",
    label: "Premium",
    icon: LuCircleDollarSign,
    section: "premium",
  },
  personalizer: {
    id: "bot-personalizer",
    label: "Personalizer",
    icon: LuSparkles,
    section: "personalizer",
  },
  logs: {
    id: "bot-audit",
    label: "Audit Logs",
    icon: LuActivity,
    section: "logs",
  },
  notifications: {
    id: "bot-notifications",
    label: "Notifications",
    icon: LuBell,
    section: "notifications",
  },
  onboarding: {
    id: "bot-onboarding",
    label: "Welcome Flow",
    icon: LuSparkles,
    section: "onboarding",
  },
  verification: {
    id: "bot-verification",
    label: "Verification",
    icon: LuShield,
    section: "verification",
  },
  reactionRoles: {
    id: "bot-reaction-roles",
    label: "Reaction Roles",
    icon: LuWandSparkles,
    section: "reaction-roles",
  },
  tickets: {
    id: "bot-tickets",
    label: "Ticketing",
    icon: LuTicket,
    section: "tickets",
  },
  modmail: {
    id: "bot-modmail",
    label: "Modmail",
    icon: LuMessageSquareText,
    section: "modmail",
  },
  ai: {
    id: "bot-ai",
    label: "AI",
    icon: LuBrainCircuit,
    section: "ai",
  },
  reminders: {
    id: "bot-reminders",
    label: "Reminders",
    icon: LuBell,
    section: "reminders",
  },
  rss: {
    id: "bot-rss",
    label: "RSS",
    icon: LuRadio,
    section: "rss",
  },
  webhooks: {
    id: "bot-webhooks",
    label: "Webhooks",
    icon: LuRadio,
    section: "webhooks",
  },
  componentsV2: {
    id: "bot-templates",
    label: "Message Studio",
    icon: LuMessageSquareText,
    section: "templates",
  },
  musicVoice: {
    id: "bot-voice",
    label: "Music & Voice",
    icon: LuGift,
    section: "music-voice",
  },
  voiceRoles: {
    id: "bot-voice-roles",
    label: "Voice Roles",
    icon: LuUsers,
    section: "voice-roles",
  },
  serverStats: {
    id: "bot-stats",
    label: "Server Stats",
    icon: LuChartColumn,
    section: "server-stats",
  },
  feeds: {
    id: "bot-feeds",
    label: "Feeds & Alerts",
    icon: LuRadio,
    section: "feeds",
  },
  reddit: {
    id: "bot-reddit",
    label: "Reddit",
    icon: LuRadio,
    section: "reddit",
  },
  twitch: {
    id: "bot-twitch",
    label: "Twitch",
    icon: LuRadio,
    section: "twitch",
  },
  youtube: {
    id: "bot-youtube",
    label: "YouTube",
    icon: LuRadio,
    section: "youtube",
  },
  streaming: {
    id: "bot-streaming",
    label: "Streaming",
    icon: LuRadio,
    section: "streaming",
  },
  rsvp: {
    id: "bot-rsvp",
    label: "RSVP",
    icon: LuTicket,
    section: "rsvp",
  },
  soundboard: {
    id: "bot-soundboard",
    label: "Soundboard",
    icon: LuGift,
    section: "soundboard",
  },
  customCommands: {
    id: "bot-custom-commands",
    label: "Custom Commands",
    icon: LuBoxes,
    section: "custom-commands",
  },
  utilities: {
    id: "bot-controls",
    label: "Module Controls",
    icon: LuCog,
    section: "controls",
  },
};

const moduleEntityLabels = templateCatalogModuleEntityLabels as Record<ModuleId, string>;
const moduleDisplayOrder = templateCatalogModuleDisplayOrder as ModuleId[];

export function getTemplateDefinition(templates: TemplateDefinition[], templateKey: string) {
  return templates.find(template => template.key === templateKey) || null;
}

export function getGuildTemplateKey(overrides: Record<string, unknown> | null | undefined) {
  const value = overrides?.[GUILD_TEMPLATE_KEY_FIELD];
  return typeof value === "string" && value.length > 0 ? value : "";
}

export function buildGuildTemplateOverrides(
  template: TemplateDefinition,
  existingOverrides: Record<string, unknown> = {},
) {
  const templateCatalog = getTemplateCatalogTemplate(template.key);
  const nextOverrides: Record<string, unknown> = {
    [GUILD_TEMPLATE_KEY_FIELD]: template.key,
  };

  for (const moduleId of moduleDisplayOrder) {
    const templateToggle = template.defaults?.[moduleId];
    const existingToggle = existingOverrides[moduleId];
    const existingSettings =
      existingToggle && typeof existingToggle === "object" && "settings" in (existingToggle as Record<string, unknown>)
        ? (((existingToggle as { settings?: unknown }).settings as Record<string, unknown> | undefined) ?? {})
        : {};

    nextOverrides[moduleId] = {
      enabled: templateCatalog ? Boolean(templateCatalog.enabledModules[moduleId]) : Boolean(templateToggle?.enabled),
      settings: {
        ...(templateToggle?.settings ?? {}),
        ...existingSettings,
      },
    };
  }

  return nextOverrides;
}

export function getBotWorkspaceHref(botId: string, section: BotWorkspaceSection, guildId?: string) {
  const href = section === "overview" ? `/app/bots/${botId}` : `/app/bots/${botId}/${section}`;
  if (!guildId) {
    return href;
  }

  return `${href}?guild=${encodeURIComponent(guildId)}`;
}

export function getSharedBotInviteHref(applicationId: string, guildId?: string) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", applicationId);
  url.searchParams.set("scope", "bot applications.commands");
  url.searchParams.set("permissions", "8");

  if (guildId) {
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
  }

  return url.toString();
}

export function isBotWorkspaceSection(value: string): value is BotWorkspaceSection {
  return [
    "overview",
    "settings",
    "audit",
    "moderation",
    "automod",
    "autorole",
    "role-commands",
    "premium",
    "personalizer",
    "logs",
    "notifications",
    "onboarding",
    "verification",
    "reaction-roles",
    "tickets",
    "modmail",
    "ai",
    "reminders",
    "rss",
    "webhooks",
    "templates",
    "music-voice",
    "voice-roles",
    "server-stats",
    "feeds",
    "custom-commands",
    "controls",
  ].includes(value);
}

export function getEnabledModules(template: TemplateDefinition | null, overrides: Record<string, unknown> = {}) {
  const templateDefaults = template?.defaults || {};
  const templateCatalog = template ? getTemplateCatalogTemplate(template.key) : null;
  const merged = new Map<ModuleId, boolean>();

  for (const moduleId of moduleDisplayOrder) {
    const defaultToggle = templateDefaults[moduleId];
    const defaultEnabled = templateCatalog ? Boolean(templateCatalog.enabledModules[moduleId]) : Boolean(defaultToggle?.enabled);
    merged.set(moduleId, defaultEnabled);
  }

  for (const [moduleId, value] of Object.entries(overrides)) {
    if (!moduleDisplayOrder.includes(moduleId as ModuleId)) continue;
    if (value && typeof value === "object" && "enabled" in (value as Record<string, unknown>)) {
      merged.set(moduleId as ModuleId, Boolean((value as { enabled?: unknown }).enabled));
    }
  }

  return moduleDisplayOrder.filter(moduleId => merged.get(moduleId));
}

export function getEnabledModuleEntities(template: TemplateDefinition | null, overrides: Record<string, unknown> = {}) {
  return getEnabledModules(template, overrides).map(moduleId => ({
    id: moduleId,
    label: moduleEntityLabels[moduleId] ?? botModuleNavDefinitions[moduleId]?.label ?? moduleId,
  }));
}

export function getEnabledModuleLabels(template: TemplateDefinition | null, overrides: Record<string, unknown> = {}) {
  return getEnabledModuleEntities(template, overrides).map(module => module.label);
}

export function getSelectedBotNavSections(templates: TemplateDefinition[], bot: BotRecord | null, guildId?: string) {
  if (!bot) {
    return [];
  }

  const template = getTemplateDefinition(templates, bot.templateKey);
  const enabledModules = getEnabledModules(template, bot.featureOverrides);
  const moduleItems = enabledModules
    .map(moduleId => {
      const definition = botModuleNavDefinitions[moduleId];
      if (!definition) return null;
      return {
        id: definition.id,
        label: definition.label,
        href: getBotWorkspaceHref(bot.id, definition.section, guildId),
        icon: definition.icon,
        exact: true,
      };
    })
    .filter(Boolean) as ConsoleNavItem[];

  const sections: Array<{ label?: string; items: ConsoleNavItem[] }> = [
    {
      label: "Selected Bot",
      items: [
        { id: "bot-workspace", label: "Workspace", href: getBotWorkspaceHref(bot.id, "overview", guildId), icon: LuBot },
        { id: "bot-settings", label: "Settings", href: getBotWorkspaceHref(bot.id, "settings", guildId), icon: LuCog, exact: true },
        { id: "bot-audit-trail", label: "Audit", href: getBotWorkspaceHref(bot.id, "audit", guildId), icon: LuActivity, exact: true },
      ],
    },
  ];

  if (moduleItems.length > 0) {
    sections.push({
      label: bot.templateKey === "full-suite" ? "Functions" : "Enabled Modules",
      items: moduleItems,
    });
  }

  return sections;
}

export function getEnabledModuleCards(
  templates: TemplateDefinition[],
  bot: BotRecord | null,
  guildId?: string,
  guildOverrides?: Record<string, unknown>,
) {
  if (!bot) {
    return [];
  }

  const templateKey = getGuildTemplateKey(guildOverrides) || bot.templateKey;
  const template = getTemplateDefinition(templates, templateKey);
  const enabledModules = getEnabledModules(template, guildOverrides ?? bot.featureOverrides);

  return enabledModules
    .map(moduleId => {
      const definition = botModuleNavDefinitions[moduleId];
      if (!definition) return null;
      return {
        id: moduleId,
        label: definition.label,
        href: getBotWorkspaceHref(bot.id, definition.section, guildId),
        icon: definition.icon,
      };
    })
    .filter(Boolean) as Array<{ id: ModuleId; label: string; href: string; icon: IconType }>;
}

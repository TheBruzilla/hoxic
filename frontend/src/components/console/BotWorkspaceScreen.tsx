"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, EmptyState, SectionHeader, StickySaveBar } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { useDashboardFeedback } from "@/components/console/DashboardFeedback";
import {
  AutomodActionType,
  AutomodRuleRecord,
  AutomodTriggerType,
  BotGuildRecord,
  CustomCommandRecord,
  BotWorkspacePayload,
  BotWorkspaceSection,
  FeedRecord,
  GuildResourcesPayload,
  MessageTemplateRecord,
  ModuleId,
  TemplateDefinition,
  getBotWorkspaceHref,
  getEnabledModuleCards,
  getEnabledModules,
  getGuildTemplateKey,
  getTemplateDefinition,
  requestJson,
} from "@/lib/console";
import styles from "./console.module.scss";

type WorkspaceScreen = BotWorkspaceSection;

const sectionToModule: Partial<Record<WorkspaceScreen, ModuleId>> = {
  moderation: "moderation",
  automod: "automod",
  autorole: "autorole",
  "role-commands": "roleCommands",
  reputation: "reputation",
  premium: "premium",
  personalizer: "personalizer",
  logs: "logs",
  notifications: "notifications",
  onboarding: "onboarding",
  verification: "verification",
  "reaction-roles": "reactionRoles",
  tickets: "tickets",
  modmail: "modmail",
  ai: "ai",
  reminders: "reminders",
  rss: "rss",
  webhooks: "webhooks",
  templates: "componentsV2",
  "music-voice": "musicVoice",
  "voice-roles": "voiceRoles",
  "server-stats": "serverStats",
  feeds: "feeds",
  reddit: "reddit",
  twitch: "twitch",
  youtube: "youtube",
  streaming: "streaming",
  rsvp: "rsvp",
  soundboard: "soundboard",
  "custom-commands": "customCommands",
  controls: "utilities",
};

const moduleTitles: Record<ModuleId, { eyebrow: string; title: string; description: string }> = {
  moderation: {
    eyebrow: "Moderator",
    title: "Moderation controls",
    description: "Keep moderation scoped to this bot only. Actions and overrides here affect this bot workspace, not the global fleet.",
  },
  automod: {
    eyebrow: "AutoMod",
    title: "Rule-based protection",
    description: "Configure automated enforcement rules and trigger-based protections for this bot.",
  },
  autorole: {
    eyebrow: "Auto Role",
    title: "Join-time role grants",
    description: "Assign starter roles and delayed onboarding roles for this bot.",
  },
  roleCommands: {
    eyebrow: "Role Commands",
    title: "Self-assign role commands",
    description: "Let members toggle approved roles with a slash command instead of leaving it to generic custom commands.",
  },
  reputation: {
    eyebrow: "Reputation",
    title: "Guild reputation tracking",
    description: "Award, cap, and reset member reputation inside the selected guild without leaking scores across other workspaces.",
  },
  premium: {
    eyebrow: "Premium",
    title: "Billing and entitlements",
    description: "Manage premium access, redeem codes, and premium-gated studio capabilities for the selected guild.",
  },
  personalizer: {
    eyebrow: "Personalizer",
    title: "Guild bot profile",
    description: "Set the bot nickname, guild avatar, and guild banner for premium-enabled guilds.",
  },
  logs: {
    eyebrow: "Audit Logs",
    title: "Moderation log trail",
    description: "Review bot-specific enforcement and logging activity without mixing it into other workspaces.",
  },
  notifications: {
    eyebrow: "Notifications",
    title: "Member and server alerts",
    description: "Route join, leave, and boost notifications through this bot with guild-specific channel settings.",
  },
  onboarding: {
    eyebrow: "Welcome Flow",
    title: "Onboarding surfaces",
    description: "Manage welcome copy, onboarding templates, and first-touch member messaging for this bot only.",
  },
  verification: {
    eyebrow: "Verification",
    title: "Verification controls",
    description: "Gate access with manual verification panels, role grants, and account checks.",
  },
  reactionRoles: {
    eyebrow: "Reaction Roles",
    title: "Role assignment surfaces",
    description: "Keep reaction-role templates and related messaging bound to this selected bot.",
  },
  tickets: {
    eyebrow: "Ticketing",
    title: "Support intake",
    description: "Ticket panels, queue behavior, and support thread visibility stay scoped to this bot workspace.",
  },
  modmail: {
    eyebrow: "Modmail",
    title: "Private support inbox",
    description: "Review thread activity and modmail-facing controls for this selected bot only.",
  },
  ai: {
    eyebrow: "AI",
    title: "AI routing and persona",
    description: "Model choice, endpoint settings, and AI behavior here belong only to this bot runtime.",
  },
  reminders: {
    eyebrow: "Reminders",
    title: "Reminder runtime",
    description: "Reminder behavior is scoped to this bot's queue and delivery settings.",
  },
  rss: {
    eyebrow: "RSS",
    title: "RSS subscriptions",
    description: "Route RSS subscriptions and external feed polling through this bot workspace.",
  },
  webhooks: {
    eyebrow: "Webhooks",
    title: "Inbound endpoints",
    description: "Webhook routes created here feed only this bot and its configured channels.",
  },
  componentsV2: {
    eyebrow: "Message Studio",
    title: "Layouts, embeds, and components",
    description: "Build Discohook-near layouts with saved drafts, published versions, interaction routing, sharing, and managed sends.",
  },
  musicVoice: {
    eyebrow: "Music & Voice",
    title: "Voice module controls",
    description: "Keep music and voice behavior isolated to this bot template and its overrides.",
  },
  voiceRoles: {
    eyebrow: "Voice Roles",
    title: "Voice role automation",
    description: "Grant and remove a role automatically while members are connected to voice.",
  },
  serverStats: {
    eyebrow: "Server Stats",
    title: "Server metric surfaces",
    description: "Surface runtime-linked counters and statistics channels for this bot only.",
  },
  feeds: {
    eyebrow: "Feeds & Alerts",
    title: "Feed and alert delivery",
    description: "External feed delivery and social alert behavior stay scoped to this selected bot.",
  },
  reddit: {
    eyebrow: "Reddit",
    title: "Subreddit delivery",
    description: "Deliver subreddit activity into the selected guild with Reddit-specific feed subscriptions.",
  },
  twitch: {
    eyebrow: "Twitch",
    title: "Twitch delivery",
    description: "Track Twitch channel updates and route them through this bot workspace.",
  },
  youtube: {
    eyebrow: "YouTube",
    title: "YouTube delivery",
    description: "Track channel uploads and video feeds through the selected guild routing.",
  },
  streaming: {
    eyebrow: "Streaming",
    title: "Streaming alert delivery",
    description: "Use generic stream alert feeds and connector URLs through this selected bot.",
  },
  rsvp: {
    eyebrow: "RSVP",
    title: "Event RSVP panels",
    description: "Create RSVP panels, collect yes/no/maybe responses, and manage event lifecycle inside the selected guild.",
  },
  soundboard: {
    eyebrow: "Soundboard",
    title: "Clip library and playback",
    description: "Configure reusable voice clips for this guild and play them through the bot runtime.",
  },
  customCommands: {
    eyebrow: "Custom Commands",
    title: "Trigger-driven responses",
    description: "Bring YAGPDB-style custom commands into this selected bot without leaking configuration into other workspaces.",
  },
  utilities: {
    eyebrow: "Module Controls",
    title: "Template-specific overrides",
    description: "Adjust module overrides and bot-specific control data without touching the global fleet.",
  },
};

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function getModuleOverrideValue(
  featureOverrides: Record<string, unknown>,
  moduleId: ModuleId,
) {
  const override = featureOverrides?.[moduleId];
  return stringifyJson(override ?? {});
}

function getThreadTitle(thread: Record<string, unknown>, index: number) {
  const candidates = ["title", "subject", "channelName", "threadName", "id", "threadId"];
  for (const key of candidates) {
    const value = thread[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return `Thread ${index + 1}`;
}

function getThreadMeta(thread: Record<string, unknown>) {
  const parts: string[] = [];
  const channelId = thread.channelId;
  const guildId = thread.guildId;
  const status = thread.status;
  if (typeof channelId === "string" && channelId) parts.push(`channel ${channelId}`);
  if (typeof guildId === "string" && guildId) parts.push(`guild ${guildId}`);
  if (typeof status === "string" && status) parts.push(status);
  return parts.length ? parts.join(" · ") : "No extra thread metadata";
}

function parseNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatTemplateLabel(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getNameMark(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("") || "B";
}

function getAvailableGuilds(workspace: BotWorkspacePayload): BotGuildRecord[] {
  if (workspace.guilds.length) {
    return workspace.guilds;
  }

  return workspace.guildConfigs.map(configRecord => ({
    id: configRecord.guildId,
    name: `Guild ${configRecord.guildId.slice(-6)}`,
    memberCount: 0,
  }));
}

function getGuildModuleState(
  workspace: BotWorkspacePayload,
  templates: TemplateDefinition[],
  guildId: string,
  moduleId: ModuleId,
) {
  const guildConfig = workspace.guildConfigs.find(configRecord => configRecord.guildId === guildId);
  const guildTemplateKey = getGuildTemplateKey(guildConfig?.overrides);
  const template = getTemplateDefinition(templates, guildTemplateKey || workspace.bot.templateKey);
  const templateToggle = template?.defaults?.[moduleId];
  const guildToggle = (guildConfig?.overrides?.[moduleId] as { enabled?: boolean; settings?: Record<string, unknown> } | undefined) ?? null;

  return {
    enabled: guildToggle?.enabled ?? templateToggle?.enabled ?? false,
    settings: {
      ...(templateToggle?.settings ?? {}),
      ...(guildToggle?.settings ?? {}),
    } as Record<string, unknown>,
  };
}

function filterTextChannels(resources: GuildResourcesPayload | null) {
  return (resources?.channels ?? []).filter(channel => channel.type === 0 || channel.type === 5);
}

function filterCategoryChannels(resources: GuildResourcesPayload | null) {
  return (resources?.channels ?? []).filter(channel => channel.type === 4);
}

function filterAssignableRoles(resources: GuildResourcesPayload | null) {
  return (resources?.roles ?? []).filter(role => !role.managed);
}

function normalizeRoleIds(roleIds: string[]) {
  return [...new Set(roleIds.map(roleId => roleId.trim()).filter(Boolean))].slice(0, 5);
}

function parseTextList(value: string) {
  return [...new Set(value.split("\n").map(item => item.trim()).filter(Boolean))];
}

function parseInteger(value: string | number | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function parseJsonInput<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Invalid JSON format.", error);
    throw new Error("Invalid JSON format. Check commas, quotes, and brackets.");
  }
}

function buildAutomodSummary(rule: AutomodRuleRecord) {
  switch (rule.triggerType) {
    case "keyword":
      return `keywords: ${Array.isArray(rule.config.keywords) ? (rule.config.keywords as string[]).join(", ") || "none" : "none"}`;
    case "regex":
      return `pattern: ${typeof rule.config.pattern === "string" ? rule.config.pattern : "unset"}`;
    case "invite":
      return "blocks Discord invite links";
    case "mention-spam":
      return `max mentions: ${parseInteger(rule.config.maxMentions as string | number | undefined, 5)}`;
    case "caps":
      return `caps %: ${parseInteger(rule.config.percentage as string | number | undefined, 70)} · min letters: ${parseInteger(rule.config.minLength as string | number | undefined, 12)}`;
    case "repeated-message":
      return `repeat ${parseInteger(rule.config.repeatCount as string | number | undefined, 3)} times in ${parseInteger(rule.config.windowSeconds as string | number | undefined, 30)}s`;
    case "attachment":
      return Array.isArray(rule.config.extensions) && rule.config.extensions.length
        ? `extensions: ${(rule.config.extensions as string[]).join(", ")}`
        : "blocks all attachments";
    case "account-age":
      return `minimum account age: ${parseInteger(rule.config.minHours as string | number | undefined, 24)}h`;
    default:
      return "custom rule";
  }
}

function ModuleMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className={styles.callout}>{message}</div>;
}

function serializeDraftState(value: unknown) {
  return JSON.stringify(value);
}

function useToastForMessage(message: string | null, successTitle: string) {
  const { pushToast } = useDashboardFeedback();
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      lastMessageRef.current = null;
      return;
    }

    if (message === lastMessageRef.current || message.startsWith("Loading ")) {
      return;
    }

    lastMessageRef.current = message;
    const lower = message.toLowerCase();
    const isError = lower.includes("failed") || lower.includes("unable") || lower.includes("warning");

    pushToast({
      title: isError ? "Action needs attention" : successTitle,
      description: message,
      tone: isError ? "danger" : "success",
    });
  }, [message, pushToast, successTitle]);
}

function GuildSelector({
  guilds,
  selectedGuildId,
  onChange,
}: {
  guilds: BotGuildRecord[];
  selectedGuildId: string;
  onChange: (guildId: string) => void;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>Guild scope</label>
      <select className={styles.select} value={selectedGuildId} onChange={event => onChange(event.target.value)}>
        {guilds.map(guild => (
          <option key={guild.id} value={guild.id}>
            {guild.name} ({guild.memberCount} members)
          </option>
        ))}
      </select>
    </div>
  );
}

function useGuildModuleScope({
  botId,
  workspace,
  templates,
  moduleId,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  moduleId: ModuleId;
  onRefresh: () => Promise<void>;
}) {
  const guilds = getAvailableGuilds(workspace);
  const [selectedGuildId, setSelectedGuildId] = useState(guilds[0]?.id ?? "");
  const [resources, setResources] = useState<GuildResourcesPayload | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useToastForMessage(message, "Module updated");

  useEffect(() => {
    if (guilds.length === 0) {
      setSelectedGuildId("");
      return;
    }
    if (!selectedGuildId || !guilds.some(guild => guild.id === selectedGuildId)) {
      setSelectedGuildId(guilds[0]!.id);
    }
  }, [guilds, selectedGuildId]);

  useEffect(() => {
    if (!selectedGuildId) {
      setResources(null);
      return;
    }

    let cancelled = false;
    setResourcesLoading(true);
    void requestJson<GuildResourcesPayload>(`/api/bots/${botId}/guilds/${selectedGuildId}/resources`)
      .then(payload => {
        if (!cancelled) {
          setResources(payload);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setResources(null);
          setMessage(error instanceof Error ? error.message : "Failed to load guild resources.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResourcesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [botId, selectedGuildId]);

  const moduleState = useMemo(
    () =>
      selectedGuildId
        ? getGuildModuleState(workspace, templates, selectedGuildId, moduleId)
        : { enabled: false, settings: {} as Record<string, unknown> },
    [moduleId, selectedGuildId, templates, workspace],
  );

  async function saveModule(enabled: boolean, settings: Record<string, unknown>, successMessage: string) {
    if (!selectedGuildId) return;
    setBusy(true);
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/guilds/${selectedGuildId}/modules/${moduleId}`, {
        method: "PUT",
        body: JSON.stringify({
          enabled,
          settings,
        }),
      });
      await onRefresh();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save module settings.");
    } finally {
      setBusy(false);
    }
  }

  return {
    guilds,
    selectedGuildId,
    setSelectedGuildId,
    resources,
    resourcesLoading,
    message,
    setMessage,
    busy,
    moduleState,
    textChannels: filterTextChannels(resources),
    categoryChannels: filterCategoryChannels(resources),
    roles: filterAssignableRoles(resources),
    saveModule,
  };
}

interface SharedWorkspaceState {
  workspace: BotWorkspacePayload | null;
  loading: boolean;
  message: string | null;
  busyAction: string | null;
  settingsForm: {
    name: string;
    templateKey: string;
    autoStart: boolean;
    desiredState: "running" | "stopped";
  };
  setSettingsForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      templateKey: string;
      autoStart: boolean;
      desiredState: "running" | "stopped";
    }>
  >;
  tokenForm: string;
  setTokenForm: React.Dispatch<React.SetStateAction<string>>;
  overridesText: string;
  setOverridesText: React.Dispatch<React.SetStateAction<string>>;
  aiForm: {
    providerType: "openai" | "anthropic" | "gemini" | "openai-compatible";
    apiKey: string;
    endpoint: string;
    model: string;
    optionsText: string;
  };
  setAiForm: React.Dispatch<
    React.SetStateAction<{
      providerType: "openai" | "anthropic" | "gemini" | "openai-compatible";
      apiKey: string;
      endpoint: string;
      model: string;
      optionsText: string;
    }>
  >;
  templateForm: {
    name: string;
    description: string;
    channelId: string;
    payloadText: string;
  };
  setTemplateForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      channelId: string;
      payloadText: string;
    }>
  >;
  webhookForm: {
    name: string;
    kind: "generic" | "sentry" | "github";
    channelId: string;
  };
  setWebhookForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      kind: "generic" | "sentry" | "github";
      channelId: string;
    }>
  >;
  loadWorkspace: () => Promise<void>;
  saveSettings: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  replaceToken: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveOverrides: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveAi: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  createTemplate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  createWebhook: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  dispatchAction: (action: "start" | "stop" | "restart" | "validate") => Promise<void>;
  deleteBot: () => Promise<void>;
}

function useBotWorkspaceState(botId: string): SharedWorkspaceState {
  const router = useRouter();
  const { refresh } = useConsole();

  const [workspace, setWorkspace] = useState<BotWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  useToastForMessage(message, "Workspace updated");
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    templateKey: "",
    autoStart: true,
    desiredState: "running" as "running" | "stopped",
  });
  const [tokenForm, setTokenForm] = useState("");
  const [overridesText, setOverridesText] = useState("{}");
  const [aiForm, setAiForm] = useState({
    providerType: "openai" as "openai" | "anthropic" | "gemini" | "openai-compatible",
    apiKey: "",
    endpoint: "",
    model: "gpt-4o-mini",
    optionsText: "{}",
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    channelId: "",
    payloadText: `{\n  "content": "Hello from Hoxiq"\n}`,
  });
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    kind: "generic" as "generic" | "sentry" | "github",
    channelId: "",
  });

  const loadWorkspace = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const payload = await requestJson<BotWorkspacePayload>(`/api/bots/${botId}`);
      setWorkspace(payload);
      setSettingsForm({
        name: payload.bot.name,
        templateKey: payload.bot.templateKey,
        autoStart: payload.bot.autoStart,
        desiredState: payload.bot.desiredState,
      });
      setOverridesText(stringifyJson(payload.bot.featureOverrides));
      setAiForm({
        providerType: payload.ai?.providerType || "openai",
        apiKey: "",
        endpoint: payload.ai?.endpoint || "",
        model: payload.ai?.model || "gpt-4o-mini",
        optionsText: stringifyJson(payload.ai?.options),
      });
      setMessage(null);
    } catch (loadError) {
      setWorkspace(null);
      setMessage(loadError instanceof Error ? loadError.message : "Failed to load bot workspace.");
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("settings");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}`, {
        method: "PATCH",
        body: JSON.stringify(settingsForm),
      });
      await Promise.all([loadWorkspace(), refresh()]);
      setMessage("Bot settings updated.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Failed to update settings.");
    } finally {
      setBusyAction(null);
    }
  }

  async function replaceToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("token");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/token`, {
        method: "PUT",
        body: JSON.stringify({
          token: tokenForm.trim(),
          restart: true,
        }),
      });
      setTokenForm("");
      await Promise.all([loadWorkspace(), refresh()]);
      setMessage("Main bot token replaced.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Failed to replace main bot token.");
    } finally {
      setBusyAction(null);
    }
  }

  async function saveOverrides(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("overrides");
    setMessage(null);
    try {
      const parsed = parseJsonInput<Record<string, unknown>>(overridesText);
      await requestJson(`/api/bots/${botId}/overrides`, {
        method: "PUT",
        body: JSON.stringify({ featureOverrides: parsed }),
      });
      await Promise.all([loadWorkspace(), refresh()]);
      setMessage("Feature overrides updated.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Failed to update overrides.");
    } finally {
      setBusyAction(null);
    }
  }

  async function saveAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("ai");
    setMessage(null);
    try {
      const parsedOptions = parseJsonInput<Record<string, unknown>>(aiForm.optionsText);
      await requestJson(`/api/bots/${botId}/ai`, {
        method: "PUT",
        body: JSON.stringify({
          providerType: aiForm.providerType,
          apiKey: aiForm.apiKey.trim() || null,
          endpoint: aiForm.endpoint.trim() || null,
          model: aiForm.model.trim(),
          options: parsedOptions,
        }),
      });
      await Promise.all([loadWorkspace(), refresh()]);
      setAiForm(current => ({ ...current, apiKey: "" }));
      setMessage("AI configuration saved.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Failed to save AI settings.");
    } finally {
      setBusyAction(null);
    }
  }

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("template");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/templates`, {
        method: "POST",
        body: JSON.stringify({
          name: templateForm.name,
          description: templateForm.description,
          channelId: templateForm.channelId.trim() || null,
          payload: parseJsonInput<Record<string, unknown>>(templateForm.payloadText),
        }),
      });
      await Promise.all([loadWorkspace(), refresh()]);
      setTemplateForm({
        name: "",
        description: "",
        channelId: "",
        payloadText: `{\n  "content": "Hello from Hoxiq"\n}`,
      });
      setMessage("Message template created.");
    } catch (templateError) {
      setMessage(templateError instanceof Error ? templateError.message : "Failed to create template.");
    } finally {
      setBusyAction(null);
    }
  }

  async function createWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("webhook");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/webhooks`, {
        method: "POST",
        body: JSON.stringify(webhookForm),
      });
      await Promise.all([loadWorkspace(), refresh()]);
      setWebhookForm({ name: "", kind: "generic", channelId: "" });
      setMessage("Webhook endpoint created.");
    } catch (webhookError) {
      setMessage(webhookError instanceof Error ? webhookError.message : "Failed to create webhook.");
    } finally {
      setBusyAction(null);
    }
  }

  async function dispatchAction(action: "start" | "stop" | "restart" | "validate") {
    setBusyAction(action);
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/actions/${action}`, {
        method: "POST",
      });
      await Promise.all([loadWorkspace(), refresh()]);
      setMessage(`Bot ${action} request completed.`);
    } catch (actionError) {
      setMessage(actionError instanceof Error ? actionError.message : `Failed to ${action} bot.`);
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteBot() {
    const confirmed = window.confirm("Delete this bot from the control plane?");
    if (!confirmed) return;
    setBusyAction("delete");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}`, {
        method: "DELETE",
      });
      await refresh();
      router.push("/app/bots");
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Failed to delete bot.");
      setBusyAction(null);
    }
  }

  return {
    workspace,
    loading,
    message,
    busyAction,
    settingsForm,
    setSettingsForm,
    tokenForm,
    setTokenForm,
    overridesText,
    setOverridesText,
    aiForm,
    setAiForm,
    templateForm,
    setTemplateForm,
    webhookForm,
    setWebhookForm,
    loadWorkspace,
    saveSettings,
    replaceToken,
    saveOverrides,
    saveAi,
    createTemplate,
    createWebhook,
    dispatchAction,
    deleteBot,
  };
}

function MessageBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <section className={styles.pageSurface}>
      <div className={styles.callout}>{message}</div>
    </section>
  );
}

function WorkspaceHero({
  workspace,
  busyAction,
  onDispatch,
  onDelete,
}: {
  workspace: BotWorkspacePayload;
  busyAction: string | null;
  onDispatch: (action: "start" | "stop" | "restart" | "validate") => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const botAvatarUrl =
    typeof workspace.bot.metadata?.botAvatarUrl === "string" && workspace.bot.metadata.botAvatarUrl
      ? workspace.bot.metadata.botAvatarUrl
      : null;

  return (
    <section className={`${styles.hero} ${styles.workspaceHero}`}>
      <SectionHeader
        eyebrow="Bot Workspace"
        title={
          <span className={styles.workspaceHeroTitle}>
            <span
              className={styles.workspaceHeroBadge}
              style={botAvatarUrl ? { backgroundImage: `url(${botAvatarUrl})` } : undefined}
            >
              {botAvatarUrl ? null : getNameMark(workspace.bot.name)}
            </span>
            <span>{workspace.bot.name}</span>
          </span>
        }
        actions={
          <div className={styles.workspaceHeroActions}>
            <button type="button" className={styles.buttonSecondary} onClick={() => void onDispatch("validate")} disabled={busyAction !== null}>
              {busyAction === "validate" ? "Validating…" : "Validate token"}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={() => void onDispatch("restart")} disabled={busyAction !== null}>
              {busyAction === "restart" ? "Restarting…" : "Restart"}
            </button>
            <button type="button" className={styles.buttonDanger} onClick={() => void onDelete()} disabled={busyAction !== null}>
              {busyAction === "delete" ? "Deleting…" : "Delete bot"}
            </button>
          </div>
        }
      />
    </section>
  );
}

function SettingsSection({
  templates,
  busyAction,
  settingsForm,
  setSettingsForm,
  tokenForm,
  setTokenForm,
  overridesText,
  setOverridesText,
  onSaveSettings,
  onReplaceToken,
  onSaveOverrides,
  onDispatch,
}: {
  templates: Array<{ key: string; name: string }>;
  busyAction: string | null;
  settingsForm: {
    name: string;
    templateKey: string;
    autoStart: boolean;
    desiredState: "running" | "stopped";
  };
  setSettingsForm: SharedWorkspaceState["setSettingsForm"];
  tokenForm: string;
  setTokenForm: React.Dispatch<React.SetStateAction<string>>;
  overridesText: string;
  setOverridesText: React.Dispatch<React.SetStateAction<string>>;
  onSaveSettings: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onReplaceToken: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSaveOverrides: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDispatch: (action: "start" | "stop" | "restart" | "validate") => Promise<void>;
}) {
  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Bot Settings"
          title="Identity and runtime behavior"
          description="Naming, template choice, and runtime state stay here. Module-specific pages stay separate."
        />
        <form className={styles.formGrid} onSubmit={onSaveSettings}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Display name</label>
              <input
                className={styles.input}
                value={settingsForm.name}
                onChange={event => setSettingsForm(current => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Template</label>
              <select
                className={styles.select}
                value={settingsForm.templateKey}
                onChange={event => setSettingsForm(current => ({ ...current, templateKey: event.target.value }))}
              >
                {templates.map(template => (
                  <option key={template.key} value={template.key}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formTwo}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.autoStart}
                onChange={event => setSettingsForm(current => ({ ...current, autoStart: event.target.checked }))}
              />
              Auto-start on boot
            </label>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Desired state</label>
              <select
                className={styles.select}
                value={settingsForm.desiredState}
                onChange={event =>
                  setSettingsForm(current => ({
                    ...current,
                    desiredState: event.target.value as "running" | "stopped",
                  }))
                }
              >
                <option value="running">running</option>
                <option value="stopped">stopped</option>
              </select>
            </div>
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={busyAction !== null}>
              {busyAction === "settings" ? "Saving…" : "Save bot settings"}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={() => void onDispatch("start")} disabled={busyAction !== null}>
              {busyAction === "start" ? "Starting…" : "Start"}
            </button>
            <button type="button" className={styles.buttonDanger} onClick={() => void onDispatch("stop")} disabled={busyAction !== null}>
              {busyAction === "stop" ? "Stopping…" : "Stop"}
            </button>
          </div>
        </form>
        <form className={styles.formGrid} onSubmit={onReplaceToken}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Replace main bot token</label>
            <input
              className={styles.input}
              type="password"
              value={tokenForm}
              onChange={event => setTokenForm(event.target.value)}
              placeholder="Paste the new main bot token"
              spellCheck={false}
              autoComplete="off"
              required
            />
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={busyAction !== null}>
              {busyAction === "token" ? "Replacing…" : "Replace main token"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Overrides"
          title="Workspace-wide feature overrides"
          description="Keep the raw override payload here. Module pages show focused controls for only the selected function."
        />
        <form className={styles.formGrid} onSubmit={onSaveOverrides}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Overrides JSON</label>
            <textarea
              className={styles.textarea}
              value={overridesText}
              onChange={event => setOverridesText(event.target.value)}
            />
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={busyAction !== null}>
              {busyAction === "overrides" ? "Saving…" : "Save overrides"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function AuditSection({
  auditLogs,
  title,
  description,
}: {
  auditLogs: BotWorkspacePayload["auditLogs"];
  title: string;
  description: string;
}) {
  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Audit" title={title} description={description} />
      {auditLogs.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Actor</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 20).map(entry => (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.action}</strong>
                    <div className={styles.muted}>{JSON.stringify(entry.details)}</div>
                  </td>
                  <td>{entry.target || "n/a"}</td>
                  <td>{entry.actorUserId || "system"}</td>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No audit entries yet" description="Actions will appear here once this bot is actively managed through the workspace." />
      )}
    </section>
  );
}

function ModuleOverrideSection({
  title,
  description,
  buttonLabel,
  value,
  onChange,
  onSubmit,
  busy,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  busy: boolean;
}) {
  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Module Config" title={title} description={description} />
      <form className={styles.formGrid} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Module override JSON</label>
          <textarea className={styles.textarea} value={value} onChange={event => onChange(event.target.value)} />
        </div>
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={busy}>
            {busy ? "Saving…" : buttonLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function TemplatesSection({
  botId,
  title,
  description,
  workspace,
  onRefresh,
}: {
  botId: string;
  title: string;
  description: string;
  workspace: BotWorkspacePayload;
  onRefresh: () => Promise<void>;
}) {
  const guilds = getAvailableGuilds(workspace);
  const [selectedTemplateId, setSelectedTemplateId] = useState(workspace.templates[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importToken, setImportToken] = useState("");
  const emptyForm = useMemo(
    () => ({
      name: "",
      description: "",
      guildId: guilds[0]?.id ?? "",
      status: "draft" as "draft" | "published",
      dispatchMode: "bot" as "bot" | "webhook",
      channelId: "",
      tagsText: "",
      payloadText: `{\n  "content": "Hello from Hoxiq"\n}`,
      interactionText: "{}",
      sendChannelId: "",
      webhookUrl: "",
    }),
    [guilds],
  );
  const [form, setForm] = useState(emptyForm);

  const selectedTemplate = useMemo(
    () => workspace.templates.find(template => template.id === selectedTemplateId) || null,
    [selectedTemplateId, workspace.templates],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      guildId: selectedTemplate.guildId || guilds[0]?.id || "",
      status: selectedTemplate.status,
      dispatchMode: selectedTemplate.dispatchMode,
      channelId: selectedTemplate.channelId || "",
      tagsText: selectedTemplate.tags.join(", "),
      payloadText: stringifyJson(selectedTemplate.payload),
      interactionText: stringifyJson(selectedTemplate.interactionSchema),
      sendChannelId: selectedTemplate.channelId || "",
      webhookUrl: "",
    });
  }, [emptyForm, guilds, selectedTemplate]);

  const managedMessages = useMemo(
    () =>
      selectedTemplate
        ? workspace.managedMessages.filter(record => record.templateId === selectedTemplate.id)
        : [],
    [selectedTemplate, workspace.managedMessages],
  );

  const activeEntitlement = useMemo(
    () =>
      form.guildId
        ? workspace.entitlements.find(
            entitlement =>
              entitlement.guildId === form.guildId &&
              entitlement.status === "active" &&
              (!entitlement.endsAt || entitlement.endsAt > Date.now()),
          ) || null
        : null,
    [form.guildId, workspace.entitlements],
  );

  const payloadSummary = useMemo(() => {
    try {
      const payload = JSON.parse(form.payloadText) as Record<string, unknown>;
      return {
        content: typeof payload.content === "string" ? payload.content : "",
        embedCount: Array.isArray(payload.embeds) ? payload.embeds.length : 0,
        componentRows: Array.isArray(payload.components) ? payload.components.length : 0,
      };
    } catch {
      return null;
    }
  }, [form.payloadText]);

  async function upsertLayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save");
    setMessage(null);
    try {
      const body = {
        guildId: form.guildId || null,
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        dispatchMode: form.dispatchMode,
        channelId: form.channelId.trim() || null,
        tags: form.tagsText
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean),
        payload: parseJsonInput<Record<string, unknown>>(form.payloadText),
        interactionSchema: parseJsonInput<Record<string, unknown>>(form.interactionText),
      };

      const next = selectedTemplateId
        ? await requestJson<MessageTemplateRecord>(`/api/bots/${botId}/templates/${selectedTemplateId}`, {
            method: "PUT",
            body: JSON.stringify(body),
          })
        : await requestJson<MessageTemplateRecord>(`/api/bots/${botId}/templates`, {
            method: "POST",
            body: JSON.stringify(body),
          });

      await onRefresh();
      setSelectedTemplateId(next.id);
      setMessage(selectedTemplateId ? "Layout updated." : "Draft saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save layout.");
    } finally {
      setBusy(null);
    }
  }

  async function publishLayout() {
    if (!selectedTemplateId) return;
    setBusy("publish");
    setMessage(null);
    try {
      await requestJson(`/api/templates/${selectedTemplateId}/publish`, {
        method: "POST",
      });
      await onRefresh();
      setMessage("Layout published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to publish layout.");
    } finally {
      setBusy(null);
    }
  }

  async function shareLayout() {
    if (!selectedTemplateId || !selectedTemplate) return;
    if (selectedTemplate.status !== "published") {
      setMessage("Publish layout before creating a share link.");
      return;
    }
    setBusy("share");
    setMessage(null);
    try {
      const payload = await requestJson<{ shareUrl: string }>(`/api/templates/${selectedTemplateId}/share`, {
        method: "POST",
      });
      setMessage(`Share link ready: ${payload.shareUrl}`);
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create share link.");
    } finally {
      setBusy(null);
    }
  }

  async function sendLayout() {
    if (!selectedTemplateId) return;
    setBusy("send");
    setMessage(null);
    try {
      await requestJson(`/api/templates/${selectedTemplateId}/send`, {
        method: "POST",
        body: JSON.stringify({
          guildId: form.guildId || null,
          channelId: form.sendChannelId.trim() || null,
          dispatchMode: form.dispatchMode,
          webhookUrl: form.webhookUrl.trim() || null,
        }),
      });
      await onRefresh();
      setMessage("Layout sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send layout.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteLayout() {
    if (!selectedTemplateId) return;
    const confirmed = window.confirm("Delete this layout?");
    if (!confirmed) return;
    setBusy("delete");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/templates/${selectedTemplateId}`, {
        method: "DELETE",
      });
      setSelectedTemplateId("");
      await onRefresh();
      setMessage("Layout deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete layout.");
    } finally {
      setBusy(null);
    }
  }

  async function importLayout() {
    if (!importToken.trim()) return;
    setBusy("import");
    setMessage(null);
    try {
      const next = await requestJson<MessageTemplateRecord>(`/api/bots/${botId}/templates/import`, {
        method: "POST",
        body: JSON.stringify({
          shareToken: importToken.trim(),
        }),
      });
      await onRefresh();
      setSelectedTemplateId(next.id);
      setImportToken("");
      setMessage("Shared layout imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to import shared layout.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Message Studio" title={title} />
      <p className={styles.pageText}>{description}</p>
      <ModuleMessage message={message} />

      <div className={styles.formGrid}>
        <div className={styles.card}>
          <div className={styles.splitHeader}>
            <div>
              <h3 className={styles.cardTitle}>Saved layouts</h3>
              <p className={styles.cardText}>Drafts, published layouts, and imported shares stay scoped to this bot.</p>
            </div>
            <Badge label={`${workspace.templates.length} saved`} tone="soft" />
          </div>
          <div className={styles.list}>
            {workspace.templates.map(template => (
              <article
                key={template.id}
                className={`${styles.card} ${selectedTemplateId === template.id ? styles.cardSelected : ""}`.trim()}
              >
                <div className={styles.splitHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{template.name}</h3>
                    <p className={styles.cardText}>{template.description || "No description"}</p>
                  </div>
                  <Badge label={template.status} tone={template.status === "published" ? "premium" : "soft"} />
                </div>
                <div className={styles.cardText}>
                  {template.dispatchMode} · {template.channelId || "no default channel"} · {template.tags.join(", ") || "no tags"}
                </div>
                <div className={styles.cardActions}>
                  <button type="button" className={styles.buttonSecondary} onClick={() => setSelectedTemplateId(template.id)}>
                    Edit
                  </button>
                  {template.shareToken ? <Badge label="shared" tone="new" /> : null}
                </div>
              </article>
            ))}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Import shared layout</label>
            <div className={styles.inlineFields}>
              <input className={styles.input} value={importToken} onChange={event => setImportToken(event.target.value)} placeholder="Share token" />
              <button type="button" className={styles.buttonSecondary} onClick={importLayout} disabled={busy === "import"}>
                {busy === "import" ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.buttonSecondary} onClick={() => setSelectedTemplateId("")}>
              New layout
            </button>
          </div>
        </div>

        <form className={styles.card} onSubmit={upsertLayout}>
          <div className={styles.splitHeader}>
            <div>
              <h3 className={styles.cardTitle}>{selectedTemplate ? "Edit layout" : "New layout"}</h3>
              <p className={styles.cardText}>Raw payloads and interaction JSON stay editable for advanced layouts.</p>
            </div>
            {activeEntitlement ? <Badge label="premium active" tone="premium" /> : null}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Layout name</label>
            <input className={styles.input} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description</label>
            <input className={styles.input} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} />
          </div>
          <div className={styles.inlineFields}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Guild</label>
              <select className={styles.select} value={form.guildId} onChange={event => setForm(current => ({ ...current, guildId: event.target.value }))}>
                {guilds.map(guild => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Status</label>
              <select className={styles.select} value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as "draft" | "published" }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Dispatch</label>
              <select className={styles.select} value={form.dispatchMode} onChange={event => setForm(current => ({ ...current, dispatchMode: event.target.value as "bot" | "webhook" }))}>
                <option value="bot">Bot message</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>
          <div className={styles.inlineFields}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Default channel ID</label>
              <input className={styles.input} value={form.channelId} onChange={event => setForm(current => ({ ...current, channelId: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Tags</label>
              <input className={styles.input} value={form.tagsText} onChange={event => setForm(current => ({ ...current, tagsText: event.target.value }))} placeholder="welcome, hero, ticket" />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Payload JSON</label>
            <textarea className={styles.textarea} value={form.payloadText} onChange={event => setForm(current => ({ ...current, payloadText: event.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Interaction JSON</label>
            <textarea className={styles.textarea} value={form.interactionText} onChange={event => setForm(current => ({ ...current, interactionText: event.target.value }))} />
            <div className={styles.fieldHint}>Map button custom IDs to actions like reply-ephemeral, reply-channel, or update-current.</div>
          </div>
          <div className={styles.callout}>
            {payloadSummary ? (
              <>
                <strong>Preview</strong>
                <div className={styles.cardText}>
                  {payloadSummary.content || "No content"} · {payloadSummary.embedCount} embeds · {payloadSummary.componentRows} component rows
                </div>
              </>
            ) : (
              <span>Payload JSON is invalid.</span>
            )}
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={busy === "save"}>
              {busy === "save" ? "Saving…" : selectedTemplate ? "Update layout" : "Save draft"}
            </button>
            {selectedTemplate ? (
              <>
                <button type="button" className={styles.buttonSecondary} onClick={publishLayout} disabled={busy === "publish"}>
                  {busy === "publish" ? "Publishing…" : "Publish"}
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={shareLayout}
                  disabled={busy === "share" || selectedTemplate.status !== "published"}
                >
                  {selectedTemplate.status !== "published" ? "Publish first" : busy === "share" ? "Sharing…" : "Create share link"}
                </button>
                <button type="button" className={styles.buttonSecondary} onClick={deleteLayout} disabled={busy === "delete"}>
                  {busy === "delete" ? "Deleting…" : "Delete"}
                </button>
              </>
            ) : null}
          </div>
        </form>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.card}>
          <div className={styles.splitHeader}>
            <div>
              <h3 className={styles.cardTitle}>Send or test</h3>
              <p className={styles.cardText}>Dispatch a saved layout through the bot or directly through a Discord webhook.</p>
            </div>
            <Badge label={selectedTemplate ? selectedTemplate.dispatchMode : "choose layout"} tone="soft" />
          </div>
          <div className={styles.inlineFields}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Target channel</label>
              <input className={styles.input} value={form.sendChannelId} onChange={event => setForm(current => ({ ...current, sendChannelId: event.target.value }))} placeholder="1234567890" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Webhook URL</label>
              <input className={styles.input} value={form.webhookUrl} onChange={event => setForm(current => ({ ...current, webhookUrl: event.target.value }))} placeholder="https://discord.com/api/webhooks/..." />
            </div>
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.button} disabled={!selectedTemplate || busy === "send"} onClick={sendLayout}>
              {busy === "send" ? "Sending…" : "Send layout"}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.splitHeader}>
            <div>
              <h3 className={styles.cardTitle}>Managed message records</h3>
              <p className={styles.cardText}>Bot-dispatched messages are tracked here for later edits and interaction routing.</p>
            </div>
            <Badge label={`${managedMessages.length} tracked`} tone="soft" />
          </div>
          {managedMessages.length ? (
            <div className={styles.list}>
              {managedMessages.map(record => (
                <article key={record.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{record.messageId}</h3>
                  <p className={styles.cardText}>
                    {record.channelId} · {record.guildId}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No managed messages yet" description="Send a layout through bot dispatch to start tracking managed messages." />
          )}
        </div>
      </div>
    </section>
  );
}

function PremiumSection({
  botId,
  workspace,
  title,
  description,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  title: string;
  description: string;
  onRefresh: () => Promise<void>;
}) {
  const guilds = getAvailableGuilds(workspace);
  const [selectedGuildId, setSelectedGuildId] = useState(guilds[0]?.id ?? "");
  const [redeemCode, setRedeemCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedGuildId && guilds[0]?.id) {
      setSelectedGuildId(guilds[0].id);
    }
  }, [guilds, selectedGuildId]);

  const entitlement = useMemo(
    () =>
      workspace.entitlements.find(
        record =>
          record.guildId === selectedGuildId &&
          record.status === "active" &&
          (!record.endsAt || record.endsAt > Date.now()),
      ) || null,
    [selectedGuildId, workspace.entitlements],
  );
  const plan = workspace.premiumPlans.find(item => item.id === entitlement?.planId) || workspace.premiumPlans[0] || null;

  async function startCheckout() {
    if (!selectedGuildId || !plan) return;
    setBusy("checkout");
    setMessage(null);
    try {
      const payload = await requestJson<{ url?: string | null }>(`/api/premium/checkout-session`, {
        method: "POST",
        body: JSON.stringify({
          guildId: selectedGuildId,
          planId: plan.id,
        }),
      });
      if (payload.url) {
        window.open(payload.url, "_blank", "noopener,noreferrer");
      }
      setMessage(payload.url ? "Stripe checkout opened in a new tab." : "Checkout session created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to open premium checkout.");
    } finally {
      setBusy(null);
    }
  }

  async function redeem() {
    if (!selectedGuildId || !redeemCode.trim()) return;
    setBusy("redeem");
    setMessage(null);
    try {
      await requestJson(`/api/premium/redeem`, {
        method: "POST",
        body: JSON.stringify({
          guildId: selectedGuildId,
          code: redeemCode.trim(),
        }),
      });
      setRedeemCode("");
      await onRefresh();
      setMessage("Premium code redeemed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to redeem premium code.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Premium" title={title} />
      <p className={styles.pageText}>{description}</p>
      <ModuleMessage message={message} />
      <div className={styles.formGrid}>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Guild</label>
            <select className={styles.select} value={selectedGuildId} onChange={event => setSelectedGuildId(event.target.value)}>
              {guilds.map(guild => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.metricGrid}>
            <article className={styles.card}>
              <div className={styles.metricLabel}>Plan</div>
              <div className={styles.metricValue}>{plan?.name || "No plan"}</div>
            </article>
            <article className={styles.card}>
              <div className={styles.metricLabel}>Status</div>
              <div className={styles.metricValue}>{entitlement?.status || "Free"}</div>
            </article>
          </div>
          <div className={styles.cardText}>
            {entitlement?.endsAt ? `Renews or expires ${new Date(entitlement.endsAt).toLocaleString()}` : "No expiry on current entitlement."}
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.button} onClick={startCheckout} disabled={!plan || busy === "checkout"}>
              {busy === "checkout" ? "Opening…" : "Upgrade with Stripe"}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Redeem code</h3>
          <p className={styles.cardText}>Apply manual grants or launch codes to the selected guild.</p>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Code</label>
            <input className={styles.input} value={redeemCode} onChange={event => setRedeemCode(event.target.value)} />
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.buttonSecondary} onClick={redeem} disabled={busy === "redeem"}>
              {busy === "redeem" ? "Redeeming…" : "Redeem"}
            </button>
          </div>
          <div className={styles.callout}>
            Premium enables advanced Message Studio sharing, webhook dispatch, and guild-level bot personalization.
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalizerSection({
  botId,
  workspace,
  title,
  description,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  title: string;
  description: string;
  onRefresh: () => Promise<void>;
}) {
  const guilds = getAvailableGuilds(workspace);
  const [selectedGuildId, setSelectedGuildId] = useState(guilds[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const personalization = useMemo(
    () => workspace.personalizations.find(record => record.guildId === selectedGuildId) || null,
    [selectedGuildId, workspace.personalizations],
  );
  const entitlement = useMemo(
    () =>
      workspace.entitlements.find(
        record =>
          record.guildId === selectedGuildId &&
          record.status === "active" &&
          (!record.endsAt || record.endsAt > Date.now()),
      ) || null,
    [selectedGuildId, workspace.entitlements],
  );
  const [form, setForm] = useState({
    nickname: "",
    avatarSource: "",
    bannerSource: "",
  });

  useEffect(() => {
    if (!selectedGuildId && guilds[0]?.id) {
      setSelectedGuildId(guilds[0].id);
    }
  }, [guilds, selectedGuildId]);

  useEffect(() => {
    setForm({
      nickname: personalization?.nickname || "",
      avatarSource: personalization?.avatarSource || "",
      bannerSource: personalization?.bannerSource || "",
    });
  }, [personalization]);

  async function savePersonalization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save-personalizer");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/guilds/${selectedGuildId}/personalizer`, {
        method: "PUT",
        body: JSON.stringify({
          nickname: form.nickname,
          avatarSource: form.avatarSource,
          bannerSource: form.bannerSource,
        }),
      });
      await onRefresh();
      setMessage("Guild bot profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save guild bot profile.");
    } finally {
      setBusy(null);
    }
  }

  async function resetPersonalization() {
    setBusy("reset-personalizer");
    setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/guilds/${selectedGuildId}/personalizer`, {
        method: "DELETE",
      });
      await onRefresh();
      setMessage("Guild bot profile reset.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to reset guild bot profile.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Personalizer" title={title} />
      <p className={styles.pageText}>{description}</p>
      <ModuleMessage message={message} />
      <form className={styles.formGrid} onSubmit={savePersonalization}>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Guild</label>
            <select className={styles.select} value={selectedGuildId} onChange={event => setSelectedGuildId(event.target.value)}>
              {guilds.map(guild => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.callout}>
            {entitlement ? "Premium is active for this guild." : "Premium is required before the bot profile can be customized."}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Guild nickname</label>
            <input className={styles.input} value={form.nickname} onChange={event => setForm(current => ({ ...current, nickname: event.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Guild avatar image URL or data URI</label>
            <input className={styles.input} value={form.avatarSource} onChange={event => setForm(current => ({ ...current, avatarSource: event.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Guild banner image URL or data URI</label>
            <input className={styles.input} value={form.bannerSource} onChange={event => setForm(current => ({ ...current, bannerSource: event.target.value }))} />
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={!entitlement || busy === "save-personalizer"}>
              {busy === "save-personalizer" ? "Saving…" : "Save profile"}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={resetPersonalization} disabled={busy === "reset-personalizer"}>
              {busy === "reset-personalizer" ? "Resetting…" : "Reset"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function ThreadsSection({
  title,
  description,
  threads,
}: {
  title: string;
  description: string;
  threads: BotWorkspacePayload["threads"];
}) {
  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Threads" title={title} description={description} />
      {threads.length ? (
        <div className={styles.list}>
          {threads.map((thread, index) => (
            <article key={`${getThreadTitle(thread, index)}-${index}`} className={styles.card}>
              <div>
                <h3 className={styles.cardTitle}>{getThreadTitle(thread, index)}</h3>
                <p className={styles.cardText}>{getThreadMeta(thread)}</p>
              </div>
              <div className={styles.callout}>
                <span className={styles.mono}>{JSON.stringify(thread)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No active threads" description="Thread activity for this module will appear here when it exists." />
      )}
    </section>
  );
}

function WebhooksSection({
  title,
  description,
  busyAction,
  webhookForm,
  setWebhookForm,
  webhooks,
  onCreateWebhook,
}: {
  title: string;
  description: string;
  busyAction: string | null;
  webhookForm: SharedWorkspaceState["webhookForm"];
  setWebhookForm: SharedWorkspaceState["setWebhookForm"];
  webhooks: BotWorkspacePayload["webhooks"];
  onCreateWebhook: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Webhooks" title={title} description={description} />
      <form className={styles.formGrid} onSubmit={onCreateWebhook}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Name</label>
          <input
            className={styles.input}
            value={webhookForm.name}
            onChange={event => setWebhookForm(current => ({ ...current, name: event.target.value }))}
            required
          />
        </div>
        <div className={styles.formTwo}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Kind</label>
            <select
              className={styles.select}
              value={webhookForm.kind}
              onChange={event =>
                setWebhookForm(current => ({
                  ...current,
                  kind: event.target.value as typeof current.kind,
                }))
              }
            >
              <option value="generic">generic</option>
              <option value="sentry">sentry</option>
              <option value="github">github</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Channel ID</label>
            <input
              className={styles.input}
              value={webhookForm.channelId}
              onChange={event => setWebhookForm(current => ({ ...current, channelId: event.target.value }))}
              required
            />
          </div>
        </div>
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={busyAction !== null}>
            {busyAction === "webhook" ? "Creating…" : "Create webhook"}
          </button>
        </div>
      </form>

      {webhooks.length ? (
        <div className={styles.list}>
          {webhooks.map(webhook => (
            <article key={webhook.id} className={styles.card}>
              <div className={styles.splitHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{webhook.name}</h3>
                  <p className={styles.cardText}>
                    {webhook.kind} → {webhook.channelId}
                  </p>
                </div>
                <Badge label={webhook.isActive ? "active" : "inactive"} tone={webhook.isActive ? "new" : "soft"} />
              </div>
              <div className={styles.callout}>
                Secret: <span className={styles.mono}>{webhook.secret}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No webhooks yet" description="Create the first inbound endpoint for this bot workspace." />
      )}
    </section>
  );
}

function AiSection({
  busyAction,
  aiForm,
  setAiForm,
  onSaveAi,
}: {
  busyAction: string | null;
  aiForm: SharedWorkspaceState["aiForm"];
  setAiForm: SharedWorkspaceState["setAiForm"];
  onSaveAi: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <section className={styles.pageSurface}>
      <SectionHeader
        eyebrow="AI"
        title="Model routing and persona"
        description="This configuration belongs only to the selected bot runtime."
      />
      <form className={styles.formGrid} onSubmit={onSaveAi}>
        <div className={styles.formTwo}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Provider</label>
            <select
              className={styles.select}
              value={aiForm.providerType}
              onChange={event =>
                setAiForm(current => ({
                  ...current,
                  providerType: event.target.value as typeof current.providerType,
                }))
              }
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
              <option value="openai-compatible">OpenAI-compatible</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Model</label>
            <input
              className={styles.input}
              value={aiForm.model}
              onChange={event => setAiForm(current => ({ ...current, model: event.target.value }))}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Endpoint</label>
          <input
            className={styles.input}
            value={aiForm.endpoint}
            onChange={event => setAiForm(current => ({ ...current, endpoint: event.target.value }))}
            placeholder="Optional custom endpoint"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>API key</label>
          <input
            type="password"
            className={styles.input}
            value={aiForm.apiKey}
            onChange={event => setAiForm(current => ({ ...current, apiKey: event.target.value }))}
            placeholder="Paste only when creating or rotating the key"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Options JSON</label>
          <textarea
            className={styles.textarea}
            value={aiForm.optionsText}
            onChange={event => setAiForm(current => ({ ...current, optionsText: event.target.value }))}
          />
        </div>
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={busyAction !== null}>
            {busyAction === "ai" ? "Saving…" : "Save AI settings"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ModerationModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "moderation", onRefresh });
  const [form, setForm] = useState({
    enabled: scope.moduleState.enabled,
    warnDmUser: Boolean(scope.moduleState.settings.warnDmUser),
    defaultTimeoutMinutes: String(parseNumber(scope.moduleState.settings.defaultTimeoutMinutes, 30)),
  });

  useEffect(() => {
    setForm({
      enabled: scope.moduleState.enabled,
      warnDmUser: Boolean(scope.moduleState.settings.warnDmUser),
      defaultTimeoutMinutes: String(parseNumber(scope.moduleState.settings.defaultTimeoutMinutes, 30)),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  const moderationBaseline = useMemo(
    () => serializeDraftState({
      enabled: scope.moduleState.enabled,
      warnDmUser: Boolean(scope.moduleState.settings.warnDmUser),
      defaultTimeoutMinutes: String(parseNumber(scope.moduleState.settings.defaultTimeoutMinutes, 30)),
    }),
    [scope.moduleState.enabled, scope.moduleState.settings],
  );
  const moderationDirty = moderationBaseline !== serializeDraftState(form);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      form.enabled,
      {
        warnDmUser: form.warnDmUser,
        defaultTimeoutMinutes: parseNumber(form.defaultTimeoutMinutes, 30),
      },
      "Moderation settings saved.",
    );
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Moderation"
          title="Guild-scoped moderation settings"
          description="Control moderation behavior for the selected guild under this bot."
        />
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable moderation for this guild
            </label>
          </div>
          <div className={styles.formTwo}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.warnDmUser}
                onChange={event => setForm(current => ({ ...current, warnDmUser: event.target.checked }))}
              />
              DM users when warning them
            </label>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Default timeout minutes</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.defaultTimeoutMinutes}
                onChange={event => setForm(current => ({ ...current, defaultTimeoutMinutes: event.target.value }))}
              />
            </div>
          </div>
          {scope.resourcesLoading ? <ModuleMessage message="Loading guild channels and roles…" /> : null}
          <ModuleMessage message={scope.message} />
          <StickySaveBar
            dirty={moderationDirty}
            busy={scope.busy}
            saveLabel="Save moderation settings"
            onReset={() =>
              setForm({
                enabled: scope.moduleState.enabled,
                warnDmUser: Boolean(scope.moduleState.settings.warnDmUser),
                defaultTimeoutMinutes: String(parseNumber(scope.moduleState.settings.defaultTimeoutMinutes, 30)),
              })
            }
          />
        </form>
      </section>

      <AuditSection
        auditLogs={workspace.auditLogs.filter(entry => entry.action.startsWith("moderation."))}
        title="Recent moderation activity"
        description="Review moderation-triggered actions for this bot."
      />
    </>
  );
}

function LogsModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "logs", onRefresh });
  const [form, setForm] = useState({
    enabled: scope.moduleState.enabled,
    logChannelId: String(scope.moduleState.settings.logChannelId ?? ""),
    includeModeration: Boolean(scope.moduleState.settings.includeModeration ?? true),
    includeJoins: Boolean(scope.moduleState.settings.includeJoins ?? true),
    includeVoice: Boolean(scope.moduleState.settings.includeVoice ?? false),
  });

  useEffect(() => {
    setForm({
      enabled: scope.moduleState.enabled,
      logChannelId: String(scope.moduleState.settings.logChannelId ?? ""),
      includeModeration: Boolean(scope.moduleState.settings.includeModeration ?? true),
      includeJoins: Boolean(scope.moduleState.settings.includeJoins ?? true),
      includeVoice: Boolean(scope.moduleState.settings.includeVoice ?? false),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      form.enabled,
      {
        logChannelId: form.logChannelId || null,
        includeModeration: form.includeModeration,
        includeJoins: form.includeJoins,
        includeVoice: form.includeVoice,
      },
      "Logging settings saved.",
    );
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Audit Logs"
          title="Log delivery configuration"
          description="Route moderation, join, and voice logs for this bot into one guild-specific channel."
        />
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Log channel</label>
              <select
                className={styles.select}
                value={form.logChannelId}
                onChange={event => setForm(current => ({ ...current, logChannelId: event.target.value }))}
              >
                <option value="">Select a text channel</option>
                {scope.textChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formTwo}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable logging
            </label>
            <div className={styles.formGrid}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.includeModeration}
                  onChange={event => setForm(current => ({ ...current, includeModeration: event.target.checked }))}
                />
                Include moderation actions
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.includeJoins}
                  onChange={event => setForm(current => ({ ...current, includeJoins: event.target.checked }))}
                />
                Include joins and onboarding
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.includeVoice}
                  onChange={event => setForm(current => ({ ...current, includeVoice: event.target.checked }))}
                />
                Include voice events
              </label>
            </div>
          </div>
          {scope.resourcesLoading ? <ModuleMessage message="Loading guild channels…" /> : null}
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save log routing"}
            </button>
          </div>
        </form>
      </section>

      <AuditSection
        auditLogs={workspace.auditLogs.filter(entry => entry.action.includes("log") || entry.action.startsWith("member."))}
        title="Recent log activity"
        description="This table reflects recent activity relevant to log routing for this bot."
      />
    </>
  );
}

function AutomodModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "automod", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    notifyUser: Boolean(scope.moduleState.settings.notifyUser ?? false),
    ignoreAdmins: Boolean(scope.moduleState.settings.ignoreAdmins ?? true),
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleBusy, setRuleBusy] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    triggerType: "keyword" as AutomodTriggerType,
    action: "delete" as AutomodActionType,
    actionDurationMinutes: "10",
    enabled: true,
    keywordsText: "",
    regexPattern: "",
    mentionLimit: "5",
    capsPercent: "70",
    capsMinLength: "12",
    repeatCount: "3",
    repeatWindowSeconds: "30",
    attachmentExtensionsText: "",
    attachmentBlockAll: true,
    minAccountAgeHours: "24",
  });

  const rules = useMemo(
    () => workspace.automodRules.filter(rule => rule.guildId === scope.selectedGuildId),
    [scope.selectedGuildId, workspace.automodRules],
  );

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      notifyUser: Boolean(scope.moduleState.settings.notifyUser ?? false),
      ignoreAdmins: Boolean(scope.moduleState.settings.ignoreAdmins ?? true),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  const automodBaseline = useMemo(
    () => serializeDraftState({
      enabled: scope.moduleState.enabled,
      notifyUser: Boolean(scope.moduleState.settings.notifyUser ?? false),
      ignoreAdmins: Boolean(scope.moduleState.settings.ignoreAdmins ?? true),
    }),
    [scope.moduleState.enabled, scope.moduleState.settings],
  );
  const automodDirty = automodBaseline !== serializeDraftState(settingsForm);

  function resetRuleForm() {
    setEditingRuleId(null);
    setRuleForm({
      name: "",
      triggerType: "keyword",
      action: "delete",
      actionDurationMinutes: "10",
      enabled: true,
      keywordsText: "",
      regexPattern: "",
      mentionLimit: "5",
      capsPercent: "70",
      capsMinLength: "12",
      repeatCount: "3",
      repeatWindowSeconds: "30",
      attachmentExtensionsText: "",
      attachmentBlockAll: true,
      minAccountAgeHours: "24",
    });
  }

  function startEditing(rule: AutomodRuleRecord) {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      triggerType: rule.triggerType,
      action: rule.action,
      actionDurationMinutes: String(rule.actionDurationMinutes ?? 10),
      enabled: rule.enabled,
      keywordsText: Array.isArray(rule.config.keywords) ? (rule.config.keywords as string[]).join("\n") : "",
      regexPattern: typeof rule.config.pattern === "string" ? rule.config.pattern : "",
      mentionLimit: String(parseInteger(rule.config.maxMentions as string | number | undefined, 5)),
      capsPercent: String(parseInteger(rule.config.percentage as string | number | undefined, 70)),
      capsMinLength: String(parseInteger(rule.config.minLength as string | number | undefined, 12)),
      repeatCount: String(parseInteger(rule.config.repeatCount as string | number | undefined, 3)),
      repeatWindowSeconds: String(parseInteger(rule.config.windowSeconds as string | number | undefined, 30)),
      attachmentExtensionsText: Array.isArray(rule.config.extensions) ? (rule.config.extensions as string[]).join("\n") : "",
      attachmentBlockAll: !Array.isArray(rule.config.extensions) || (rule.config.extensions as string[]).length === 0,
      minAccountAgeHours: String(parseInteger(rule.config.minHours as string | number | undefined, 24)),
    });
  }

  function buildRuleConfig() {
    switch (ruleForm.triggerType) {
      case "keyword":
        return { keywords: parseTextList(ruleForm.keywordsText) };
      case "regex":
        return { pattern: ruleForm.regexPattern.trim() };
      case "invite":
        return {};
      case "mention-spam":
        return { maxMentions: parseInteger(ruleForm.mentionLimit, 5) };
      case "caps":
        return {
          percentage: parseInteger(ruleForm.capsPercent, 70),
          minLength: parseInteger(ruleForm.capsMinLength, 12),
        };
      case "repeated-message":
        return {
          repeatCount: parseInteger(ruleForm.repeatCount, 3),
          windowSeconds: parseInteger(ruleForm.repeatWindowSeconds, 30),
        };
      case "attachment":
        return ruleForm.attachmentBlockAll
          ? {}
          : { extensions: parseTextList(ruleForm.attachmentExtensionsText).map(value => value.replace(/^\./, "").toLowerCase()) };
      case "account-age":
        return { minHours: parseInteger(ruleForm.minAccountAgeHours, 24) };
      default:
        return {};
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        notifyUser: settingsForm.notifyUser,
        ignoreAdmins: settingsForm.ignoreAdmins,
      },
      "AutoMod settings saved.",
    );
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scope.selectedGuildId) return;
    setRuleBusy(true);
    scope.setMessage(null);
    try {
      const payload = {
        guildId: scope.selectedGuildId,
        name: ruleForm.name.trim(),
        triggerType: ruleForm.triggerType,
        config: buildRuleConfig(),
        action: ruleForm.action,
        actionDurationMinutes: ruleForm.action === "timeout" ? parseInteger(ruleForm.actionDurationMinutes, 10) : null,
        enabled: ruleForm.enabled,
      };
      if (editingRuleId) {
        await requestJson(`/api/bots/${botId}/automod-rules/${editingRuleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        scope.setMessage("AutoMod rule updated.");
      } else {
        await requestJson(`/api/bots/${botId}/automod-rules`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        scope.setMessage("AutoMod rule created.");
      }
      resetRuleForm();
      await onRefresh();
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to save AutoMod rule.");
    } finally {
      setRuleBusy(false);
    }
  }

  async function deleteRule(ruleId: string) {
    if (!window.confirm("Delete this AutoMod rule?")) return;
    setRuleBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/automod-rules/${ruleId}`, {
        method: "DELETE",
      });
      if (editingRuleId === ruleId) {
        resetRuleForm();
      }
      await onRefresh();
      scope.setMessage("AutoMod rule deleted.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to delete AutoMod rule.");
    } finally {
      setRuleBusy(false);
    }
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="AutoMod" title="Rule engine settings" description="Configure automatic moderation and enforcement defaults for the selected guild." />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.enabled}
                onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable AutoMod
            </label>
          </div>
          <div className={styles.formTwo}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.notifyUser}
                onChange={event => setSettingsForm(current => ({ ...current, notifyUser: event.target.checked }))}
              />
              DM users when action is taken
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.ignoreAdmins}
                onChange={event => setSettingsForm(current => ({ ...current, ignoreAdmins: event.target.checked }))}
              />
              Ignore admins and moderators
            </label>
          </div>
          <ModuleMessage message={scope.message} />
          <StickySaveBar
            dirty={automodDirty}
            busy={scope.busy}
            saveLabel="Save automod settings"
            onReset={() =>
              setSettingsForm({
                enabled: scope.moduleState.enabled,
                notifyUser: Boolean(scope.moduleState.settings.notifyUser ?? false),
                ignoreAdmins: Boolean(scope.moduleState.settings.ignoreAdmins ?? true),
              })
            }
          />
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Rules"
          title={editingRuleId ? "Edit AutoMod rule" : "Create AutoMod rule"}
          description="Build YAG-style trigger rules with delete, timeout, kick, ban, or flag actions."
        />
        <form className={styles.formGrid} onSubmit={saveRule}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Rule name</label>
              <input className={styles.input} value={ruleForm.name} onChange={event => setRuleForm(current => ({ ...current, name: event.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Trigger type</label>
              <select
                className={styles.select}
                value={ruleForm.triggerType}
                onChange={event => setRuleForm(current => ({ ...current, triggerType: event.target.value as AutomodTriggerType }))}
              >
                <option value="keyword">Keyword</option>
                <option value="regex">Regex</option>
                <option value="invite">Invite</option>
                <option value="mention-spam">Mention spam</option>
                <option value="caps">Caps</option>
                <option value="repeated-message">Repeated message</option>
                <option value="attachment">Attachment</option>
                <option value="account-age">Account age</option>
              </select>
            </div>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Action</label>
              <select
                className={styles.select}
                value={ruleForm.action}
                onChange={event => setRuleForm(current => ({ ...current, action: event.target.value as AutomodActionType }))}
              >
                <option value="flag">Flag only</option>
                <option value="delete">Delete message</option>
                <option value="timeout">Timeout</option>
                <option value="kick">Kick</option>
                <option value="ban">Ban</option>
              </select>
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={ruleForm.enabled} onChange={event => setRuleForm(current => ({ ...current, enabled: event.target.checked }))} />
              Enable this rule
            </label>
          </div>
          {ruleForm.action === "timeout" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Timeout minutes</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={ruleForm.actionDurationMinutes}
                onChange={event => setRuleForm(current => ({ ...current, actionDurationMinutes: event.target.value }))}
              />
            </div>
          ) : null}
          {ruleForm.triggerType === "keyword" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Keywords</label>
              <textarea
                className={styles.textarea}
                rows={5}
                value={ruleForm.keywordsText}
                onChange={event => setRuleForm(current => ({ ...current, keywordsText: event.target.value }))}
                placeholder={"one trigger per line"}
                required
              />
            </div>
          ) : null}
          {ruleForm.triggerType === "regex" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Regex pattern</label>
              <input
                className={styles.input}
                value={ruleForm.regexPattern}
                onChange={event => setRuleForm(current => ({ ...current, regexPattern: event.target.value }))}
                placeholder={"bad(word|phrase)"}
                required
              />
            </div>
          ) : null}
          {ruleForm.triggerType === "mention-spam" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Max mentions in one message</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={ruleForm.mentionLimit}
                onChange={event => setRuleForm(current => ({ ...current, mentionLimit: event.target.value }))}
              />
            </div>
          ) : null}
          {ruleForm.triggerType === "caps" ? (
            <div className={styles.formTwo}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Caps percentage threshold</label>
                <input className={styles.input} type="number" min={1} max={100} value={ruleForm.capsPercent} onChange={event => setRuleForm(current => ({ ...current, capsPercent: event.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Minimum letters</label>
                <input className={styles.input} type="number" min={1} value={ruleForm.capsMinLength} onChange={event => setRuleForm(current => ({ ...current, capsMinLength: event.target.value }))} />
              </div>
            </div>
          ) : null}
          {ruleForm.triggerType === "repeated-message" ? (
            <div className={styles.formTwo}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Repeat count</label>
                <input className={styles.input} type="number" min={2} value={ruleForm.repeatCount} onChange={event => setRuleForm(current => ({ ...current, repeatCount: event.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Window seconds</label>
                <input className={styles.input} type="number" min={5} value={ruleForm.repeatWindowSeconds} onChange={event => setRuleForm(current => ({ ...current, repeatWindowSeconds: event.target.value }))} />
              </div>
            </div>
          ) : null}
          {ruleForm.triggerType === "attachment" ? (
            <>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={ruleForm.attachmentBlockAll}
                  onChange={event => setRuleForm(current => ({ ...current, attachmentBlockAll: event.target.checked }))}
                />
                Block all attachments
              </label>
              {!ruleForm.attachmentBlockAll ? (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Blocked extensions</label>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={ruleForm.attachmentExtensionsText}
                    onChange={event => setRuleForm(current => ({ ...current, attachmentExtensionsText: event.target.value }))}
                    placeholder={"exe\nzip\nscr"}
                  />
                </div>
              ) : null}
            </>
          ) : null}
          {ruleForm.triggerType === "account-age" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Minimum account age in hours</label>
              <input className={styles.input} type="number" min={1} value={ruleForm.minAccountAgeHours} onChange={event => setRuleForm(current => ({ ...current, minAccountAgeHours: event.target.value }))} />
            </div>
          ) : null}
          <div className={styles.cardActions}>
            <button type="submit" className={styles.buttonSecondary} disabled={ruleBusy}>
              {ruleBusy ? "Saving…" : editingRuleId ? "Update rule" : "Create rule"}
            </button>
            {editingRuleId ? (
              <button type="button" className={styles.buttonGhost} onClick={resetRuleForm} disabled={ruleBusy}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Guild Rules" title="Active AutoMod rules" description="These rules are evaluated only inside the selected guild and bot workspace." />
        {rules.length ? (
          <div className={styles.list}>
            {rules.map(rule => (
              <article key={rule.id} className={styles.card}>
                <div>
                  <h3 className={styles.cardTitle}>{rule.name}</h3>
                  <p className={styles.cardText}>
                    {rule.triggerType} · {buildAutomodSummary(rule)}
                    <br />
                    Action: {rule.action}
                    {rule.actionDurationMinutes ? ` (${rule.actionDurationMinutes}m)` : ""}
                  </p>
                </div>
                <div className={styles.cardActions}>
                  <Badge label={rule.enabled ? "enabled" : "disabled"} tone={rule.enabled ? "soft" : "beta"} />
                  <button type="button" className={styles.buttonGhost} onClick={() => startEditing(rule)} disabled={ruleBusy}>
                    Edit
                  </button>
                  <button type="button" className={styles.buttonDangerGhost} onClick={() => void deleteRule(rule.id)} disabled={ruleBusy}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No automod rules yet" description="Create the first automatic moderation rule for this guild." />
        )}
      </section>
    </>
  );
}

function AutoroleModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "autorole", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    joinRoleIds: normalizeRoleIds(Array.isArray(scope.moduleState.settings.joinRoleIds) ? (scope.moduleState.settings.joinRoleIds as string[]) : []),
    delayMinutes: String(parseInteger(scope.moduleState.settings.delayMinutes as string | number | undefined, 0)),
    requireVerification: Boolean(scope.moduleState.settings.requireVerification ?? false),
    minAccountAgeHours: String(parseInteger(scope.moduleState.settings.minAccountAgeHours as string | number | undefined, 0)),
  });

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      joinRoleIds: normalizeRoleIds(Array.isArray(scope.moduleState.settings.joinRoleIds) ? (scope.moduleState.settings.joinRoleIds as string[]) : []),
      delayMinutes: String(parseInteger(scope.moduleState.settings.delayMinutes as string | number | undefined, 0)),
      requireVerification: Boolean(scope.moduleState.settings.requireVerification ?? false),
      minAccountAgeHours: String(parseInteger(scope.moduleState.settings.minAccountAgeHours as string | number | undefined, 0)),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        joinRoleIds: settingsForm.joinRoleIds,
        delayMinutes: parseInteger(settingsForm.delayMinutes, 0),
        requireVerification: settingsForm.requireVerification,
        minAccountAgeHours: parseInteger(settingsForm.minAccountAgeHours, 0),
      },
      "Auto role settings saved.",
    );
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Auto Role" title="Join-time role assignment" description="Grant starter roles immediately or after verification for the selected guild." />
      <form className={styles.formGrid} onSubmit={saveSettings}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
            Enable auto role
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Starter roles</label>
          <select
            className={styles.select}
            multiple
            value={settingsForm.joinRoleIds}
            onChange={event =>
              setSettingsForm(current => ({
                ...current,
                joinRoleIds: normalizeRoleIds(Array.from(event.currentTarget.selectedOptions).map(option => option.value)),
              }))
            }
          >
            {scope.roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formTwo}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Delay minutes</label>
            <input className={styles.input} type="number" min={0} value={settingsForm.delayMinutes} onChange={event => setSettingsForm(current => ({ ...current, delayMinutes: event.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Minimum account age in hours</label>
            <input className={styles.input} type="number" min={0} value={settingsForm.minAccountAgeHours} onChange={event => setSettingsForm(current => ({ ...current, minAccountAgeHours: event.target.value }))} />
          </div>
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settingsForm.requireVerification}
            onChange={event => setSettingsForm(current => ({ ...current, requireVerification: event.target.checked }))}
          />
          Wait until the user verifies before granting roles
        </label>
        <ModuleMessage message={scope.message} />
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={scope.busy}>
            {scope.busy ? "Saving…" : "Save auto role settings"}
          </button>
        </div>
      </form>
    </section>
  );
}

function RoleCommandsModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "roleCommands", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    allowedRoleIds: normalizeRoleIds(Array.isArray(scope.moduleState.settings.allowedRoleIds) ? (scope.moduleState.settings.allowedRoleIds as string[]) : []),
    allowRemove: Boolean(scope.moduleState.settings.allowRemove ?? true),
  });

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      allowedRoleIds: normalizeRoleIds(Array.isArray(scope.moduleState.settings.allowedRoleIds) ? (scope.moduleState.settings.allowedRoleIds as string[]) : []),
      allowRemove: Boolean(scope.moduleState.settings.allowRemove ?? true),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        allowedRoleIds: settingsForm.allowedRoleIds,
        allowRemove: settingsForm.allowRemove,
      },
      "Role command settings saved.",
    );
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Role Commands" title="Self-assignable role list" description="Members can use /selfrole with the roles approved here for the selected guild." />
      <form className={styles.formGrid} onSubmit={saveSettings}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
            Enable role commands
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Allowed roles</label>
          <select
            className={styles.select}
            multiple
            value={settingsForm.allowedRoleIds}
            onChange={event =>
              setSettingsForm(current => ({
                ...current,
                allowedRoleIds: normalizeRoleIds(Array.from(event.currentTarget.selectedOptions).map(option => option.value)),
              }))
            }
          >
            {scope.roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={settingsForm.allowRemove} onChange={event => setSettingsForm(current => ({ ...current, allowRemove: event.target.checked }))} />
          Let members remove approved roles with the same command
        </label>
        <ModuleMessage message={scope.message} />
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={scope.busy}>
            {scope.busy ? "Saving…" : "Save role command settings"}
          </button>
        </div>
      </form>
    </section>
  );
}

function NotificationsModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "notifications", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    channelId: String(scope.moduleState.settings.channelId ?? ""),
    announceJoins: Boolean(scope.moduleState.settings.announceJoins ?? true),
    announceLeaves: Boolean(scope.moduleState.settings.announceLeaves ?? true),
    announceBoosts: Boolean(scope.moduleState.settings.announceBoosts ?? false),
  });

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      channelId: String(scope.moduleState.settings.channelId ?? ""),
      announceJoins: Boolean(scope.moduleState.settings.announceJoins ?? true),
      announceLeaves: Boolean(scope.moduleState.settings.announceLeaves ?? true),
      announceBoosts: Boolean(scope.moduleState.settings.announceBoosts ?? false),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        channelId: settingsForm.channelId || null,
        announceJoins: settingsForm.announceJoins,
        announceLeaves: settingsForm.announceLeaves,
        announceBoosts: settingsForm.announceBoosts,
      },
      "Notification settings saved.",
    );
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Notifications" title="Guild alert routing" description="Choose where member lifecycle and boost alerts should be posted for the selected guild." />
      <form className={styles.formGrid} onSubmit={saveSettings}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
            Enable notifications
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Alert channel</label>
          <select className={styles.select} value={settingsForm.channelId} onChange={event => setSettingsForm(current => ({ ...current, channelId: event.target.value }))}>
            <option value="">Select a text channel</option>
            {scope.textChannels.map(channel => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.inlineMeta}>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.announceJoins} onChange={event => setSettingsForm(current => ({ ...current, announceJoins: event.target.checked }))} />
            Join alerts
          </label>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.announceLeaves} onChange={event => setSettingsForm(current => ({ ...current, announceLeaves: event.target.checked }))} />
            Leave alerts
          </label>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.announceBoosts} onChange={event => setSettingsForm(current => ({ ...current, announceBoosts: event.target.checked }))} />
            Boost alerts
          </label>
        </div>
        <ModuleMessage message={scope.message} />
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={scope.busy}>
            {scope.busy ? "Saving…" : "Save notification settings"}
          </button>
        </div>
      </form>
    </section>
  );
}

function OnboardingModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "onboarding", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    welcomeChannelId: String(scope.moduleState.settings.welcomeChannelId ?? ""),
    welcomeMessage: String(scope.moduleState.settings.welcomeMessage ?? "Welcome {userMention} to **{guildName}**."),
    sendWelcomeDm: Boolean(scope.moduleState.settings.sendWelcomeDm ?? false),
  });

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      welcomeChannelId: String(scope.moduleState.settings.welcomeChannelId ?? ""),
      welcomeMessage: String(scope.moduleState.settings.welcomeMessage ?? "Welcome {userMention} to **{guildName}**."),
      sendWelcomeDm: Boolean(scope.moduleState.settings.sendWelcomeDm ?? false),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  const onboardingBaseline = useMemo(
    () => serializeDraftState({
      enabled: scope.moduleState.enabled,
      welcomeChannelId: String(scope.moduleState.settings.welcomeChannelId ?? ""),
      welcomeMessage: String(scope.moduleState.settings.welcomeMessage ?? "Welcome {userMention} to **{guildName}**."),
      sendWelcomeDm: Boolean(scope.moduleState.settings.sendWelcomeDm ?? false),
    }),
    [scope.moduleState.enabled, scope.moduleState.settings],
  );
  const onboardingDirty = onboardingBaseline !== serializeDraftState(settingsForm);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        welcomeChannelId: settingsForm.welcomeChannelId || null,
        welcomeMessage: settingsForm.welcomeMessage.trim(),
        sendWelcomeDm: settingsForm.sendWelcomeDm,
      },
      "Onboarding settings saved.",
    );
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Welcome Flow" title="Onboarding routing" description="Configure where welcome messages go and whether this bot should DM new members." />
      <form className={styles.formGrid} onSubmit={saveSettings}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
            Enable onboarding
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Welcome channel</label>
          <select className={styles.select} value={settingsForm.welcomeChannelId} onChange={event => setSettingsForm(current => ({ ...current, welcomeChannelId: event.target.value }))}>
            <option value="">Select a text channel</option>
            {scope.textChannels.map(channel => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Welcome message</label>
          <textarea className={styles.textarea} rows={4} value={settingsForm.welcomeMessage} onChange={event => setSettingsForm(current => ({ ...current, welcomeMessage: event.target.value }))} />
        </div>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={settingsForm.sendWelcomeDm} onChange={event => setSettingsForm(current => ({ ...current, sendWelcomeDm: event.target.checked }))} />
          Send welcome DM
        </label>
        <ModuleMessage message={scope.message} />
        <StickySaveBar
          dirty={onboardingDirty}
          busy={scope.busy}
          saveLabel="Save onboarding settings"
          onReset={() =>
            setSettingsForm({
              enabled: scope.moduleState.enabled,
              welcomeChannelId: String(scope.moduleState.settings.welcomeChannelId ?? ""),
              welcomeMessage: String(scope.moduleState.settings.welcomeMessage ?? "Welcome {userMention} to **{guildName}**."),
              sendWelcomeDm: Boolean(scope.moduleState.settings.sendWelcomeDm ?? false),
            })
          }
        />
      </form>
    </section>
  );
}

function VerificationModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "verification", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    roleId: String(scope.moduleState.settings.roleId ?? scope.moduleState.settings.gateRoleId ?? ""),
    panelChannelId: String(scope.moduleState.settings.panelChannelId ?? ""),
    panelMessage: String(scope.moduleState.settings.panelMessage ?? "Click below to verify and unlock the server."),
    buttonLabel: String(scope.moduleState.settings.buttonLabel ?? "Verify"),
    minAccountAgeHours: String(parseInteger(scope.moduleState.settings.minAccountAgeHours as string | number | undefined, 0)),
  });
  const [panelBusy, setPanelBusy] = useState(false);

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      roleId: String(scope.moduleState.settings.roleId ?? scope.moduleState.settings.gateRoleId ?? ""),
      panelChannelId: String(scope.moduleState.settings.panelChannelId ?? ""),
      panelMessage: String(scope.moduleState.settings.panelMessage ?? "Click below to verify and unlock the server."),
      buttonLabel: String(scope.moduleState.settings.buttonLabel ?? "Verify"),
      minAccountAgeHours: String(parseInteger(scope.moduleState.settings.minAccountAgeHours as string | number | undefined, 0)),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        roleId: settingsForm.roleId || null,
        gateRoleId: settingsForm.roleId || null,
        panelChannelId: settingsForm.panelChannelId || null,
        panelMessage: settingsForm.panelMessage.trim(),
        buttonLabel: settingsForm.buttonLabel.trim() || "Verify",
        minAccountAgeHours: parseInteger(settingsForm.minAccountAgeHours, 0),
      },
      "Verification settings saved.",
    );
  }

  async function sendPanel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scope.selectedGuildId) return;
    setPanelBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/panels/verify`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          channelId: settingsForm.panelChannelId,
          roleId: settingsForm.roleId,
          message: settingsForm.panelMessage,
          buttonLabel: settingsForm.buttonLabel,
        }),
      });
      scope.setMessage("Verification panel sent.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to send verification panel.");
    } finally {
      setPanelBusy(false);
    }
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Verification" title="Verification settings" description="Configure the verified role, account-age gate, and reusable panel copy for this guild." />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
              Enable verification
            </label>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Verified role</label>
              <select className={styles.select} value={settingsForm.roleId} onChange={event => setSettingsForm(current => ({ ...current, roleId: event.target.value }))}>
                <option value="">Select a role</option>
                {scope.roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Minimum account age in hours</label>
              <input className={styles.input} type="number" min={0} value={settingsForm.minAccountAgeHours} onChange={event => setSettingsForm(current => ({ ...current, minAccountAgeHours: event.target.value }))} />
            </div>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Panel channel</label>
              <select className={styles.select} value={settingsForm.panelChannelId} onChange={event => setSettingsForm(current => ({ ...current, panelChannelId: event.target.value }))}>
                <option value="">Select a text channel</option>
                {scope.textChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Button label</label>
              <input className={styles.input} value={settingsForm.buttonLabel} onChange={event => setSettingsForm(current => ({ ...current, buttonLabel: event.target.value }))} maxLength={32} />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Panel message</label>
            <textarea className={styles.textarea} rows={4} value={settingsForm.panelMessage} onChange={event => setSettingsForm(current => ({ ...current, panelMessage: event.target.value }))} />
          </div>
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save verification settings"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Verification Panel" title="Send verification panel" description="Publish the saved verification button into the selected guild channel." />
        <form className={styles.cardActions} onSubmit={sendPanel}>
          <button type="submit" className={styles.buttonSecondary} disabled={panelBusy || !settingsForm.panelChannelId || !settingsForm.roleId}>
            {panelBusy ? "Sending…" : "Send verification panel"}
          </button>
        </form>
      </section>
    </>
  );
}

function ReactionRolesModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "reactionRoles", onRefresh });
  const [form, setForm] = useState({
    enabled: scope.moduleState.enabled,
    channelId: String(scope.moduleState.settings.panelChannelId ?? ""),
    title: String(scope.moduleState.settings.panelTitle ?? "Choose your roles"),
    roleIds: normalizeRoleIds(Array.isArray(scope.moduleState.settings.roleIds) ? (scope.moduleState.settings.roleIds as string[]) : []),
  });
  const [panelBusy, setPanelBusy] = useState(false);

  useEffect(() => {
    setForm({
      enabled: scope.moduleState.enabled,
      channelId: String(scope.moduleState.settings.panelChannelId ?? ""),
      title: String(scope.moduleState.settings.panelTitle ?? "Choose your roles"),
      roleIds: normalizeRoleIds(Array.isArray(scope.moduleState.settings.roleIds) ? (scope.moduleState.settings.roleIds as string[]) : []),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roleIds = normalizeRoleIds(form.roleIds);
    await scope.saveModule(
      form.enabled,
      {
        panelChannelId: form.channelId || null,
        panelTitle: form.title,
        roleIds,
      },
      "Reaction role settings saved.",
    );
  }

  async function sendPanel() {
    const roleIds = normalizeRoleIds(form.roleIds);
    if (!scope.selectedGuildId) return;
    setPanelBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/panels/rolepanel`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          channelId: form.channelId,
          title: form.title,
          roleIds,
        }),
      });
      scope.setMessage("Role panel sent.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to send role panel.");
    } finally {
      setPanelBusy(false);
    }
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader
        eyebrow="Reaction Roles"
        title="Role panel delivery"
        description="Store and send self-service role panels for the selected guild under this bot."
      />
      <form className={styles.formGrid} onSubmit={saveSettings}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))}
            />
            Enable reaction roles
          </label>
        </div>
        <div className={styles.formTwo}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Panel channel</label>
            <select
              className={styles.select}
              value={form.channelId}
              onChange={event => setForm(current => ({ ...current, channelId: event.target.value }))}
            >
              <option value="">Select a text channel</option>
              {scope.textChannels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Panel title</label>
            <input
              className={styles.input}
              value={form.title}
              onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
            />
          </div>
        </div>
        <div className={styles.formGrid}>
          {[0, 1, 2, 3, 4].map(index => (
            <div key={index} className={styles.field}>
              <label className={styles.fieldLabel}>Role slot {index + 1}</label>
              <select
                className={styles.select}
                value={form.roleIds[index] ?? ""}
                onChange={event =>
                  setForm(current => {
                    const next = [...current.roleIds];
                    next[index] = event.target.value;
                    return { ...current, roleIds: next };
                  })
                }
              >
                <option value="">Empty slot</option>
                {scope.roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {scope.resourcesLoading ? <ModuleMessage message="Loading guild channels and roles…" /> : null}
        <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save role panel settings"}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={() => void sendPanel()} disabled={panelBusy}>
              {panelBusy ? "Sending…" : "Send role panel"}
            </button>
          </div>
        </form>
      </section>
  );
}

function VoiceRolesModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "voiceRoles", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    roleId: String(scope.moduleState.settings.roleId ?? ""),
    removeWhenDisconnected: Boolean(scope.moduleState.settings.removeWhenDisconnected ?? true),
  });

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      roleId: String(scope.moduleState.settings.roleId ?? ""),
      removeWhenDisconnected: Boolean(scope.moduleState.settings.removeWhenDisconnected ?? true),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        roleId: settingsForm.roleId || null,
        removeWhenDisconnected: settingsForm.removeWhenDisconnected,
      },
      "Voice role settings saved.",
    );
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow="Voice Roles" title="Voice-connected role automation" description="Grant a role while members stay in voice and remove it when they disconnect." />
      <form className={styles.formGrid} onSubmit={saveSettings}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
            Enable voice roles
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Role to grant</label>
          <select className={styles.select} value={settingsForm.roleId} onChange={event => setSettingsForm(current => ({ ...current, roleId: event.target.value }))}>
            <option value="">Select a role</option>
            {scope.roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={settingsForm.removeWhenDisconnected} onChange={event => setSettingsForm(current => ({ ...current, removeWhenDisconnected: event.target.checked }))} />
          Remove the role when the member leaves voice
        </label>
        <ModuleMessage message={scope.message} />
        <div className={styles.cardActions}>
          <button type="submit" className={styles.button} disabled={scope.busy}>
            {scope.busy ? "Saving…" : "Save voice role settings"}
          </button>
        </div>
      </form>
    </section>
  );
}

function TicketsModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "tickets", onRefresh });
  const [form, setForm] = useState({
    enabled: scope.moduleState.enabled,
    categoryId: String(scope.moduleState.settings.categoryId ?? ""),
    supportRoleId: String(scope.moduleState.settings.supportRoleId ?? ""),
    closeOnInactivityHours: String(parseNumber(scope.moduleState.settings.closeOnInactivityHours, 72)),
    panelChannelId: String(scope.moduleState.settings.panelChannelId ?? ""),
    panelTitle: String(scope.moduleState.settings.panelTitle ?? "Open a support ticket"),
    panelDescription: String(scope.moduleState.settings.panelDescription ?? "Press the button below and the bot will create a private support channel."),
  });
  const [panelBusy, setPanelBusy] = useState(false);

  useEffect(() => {
    setForm({
      enabled: scope.moduleState.enabled,
      categoryId: String(scope.moduleState.settings.categoryId ?? ""),
      supportRoleId: String(scope.moduleState.settings.supportRoleId ?? ""),
      closeOnInactivityHours: String(parseNumber(scope.moduleState.settings.closeOnInactivityHours, 72)),
      panelChannelId: String(scope.moduleState.settings.panelChannelId ?? ""),
      panelTitle: String(scope.moduleState.settings.panelTitle ?? "Open a support ticket"),
      panelDescription: String(scope.moduleState.settings.panelDescription ?? "Press the button below and the bot will create a private support channel."),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      form.enabled,
      {
        categoryId: form.categoryId || null,
        supportRoleId: form.supportRoleId || null,
        closeOnInactivityHours: parseNumber(form.closeOnInactivityHours, 72),
        panelChannelId: form.panelChannelId || null,
        panelTitle: form.panelTitle,
        panelDescription: form.panelDescription,
      },
      "Ticket settings saved.",
    );
  }

  async function sendPanel() {
    if (!scope.selectedGuildId) return;
    setPanelBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/panels/ticket`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          channelId: form.panelChannelId,
          title: form.panelTitle,
          description: form.panelDescription,
        }),
      });
      scope.setMessage("Ticket panel sent.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to send ticket panel.");
    } finally {
      setPanelBusy(false);
    }
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Ticketing"
          title="Ticket queue configuration"
          description="Control the ticket category, support role, inactivity window, and panel delivery for this bot."
        />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable ticketing
            </label>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Ticket category</label>
              <select
                className={styles.select}
                value={form.categoryId}
                onChange={event => setForm(current => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">Select a category</option>
                {scope.categoryChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Support role</label>
              <select
                className={styles.select}
                value={form.supportRoleId}
                onChange={event => setForm(current => ({ ...current, supportRoleId: event.target.value }))}
              >
                <option value="">No dedicated support role</option>
                {scope.roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Close on inactivity (hours)</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.closeOnInactivityHours}
                onChange={event => setForm(current => ({ ...current, closeOnInactivityHours: event.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Panel channel</label>
              <select
                className={styles.select}
                value={form.panelChannelId}
                onChange={event => setForm(current => ({ ...current, panelChannelId: event.target.value }))}
              >
                <option value="">Select a text channel</option>
                {scope.textChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Panel title</label>
            <input
              className={styles.input}
              value={form.panelTitle}
              onChange={event => setForm(current => ({ ...current, panelTitle: event.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Panel description</label>
            <textarea
              className={styles.textarea}
              value={form.panelDescription}
              onChange={event => setForm(current => ({ ...current, panelDescription: event.target.value }))}
            />
          </div>
          {scope.resourcesLoading ? <ModuleMessage message="Loading guild channels and roles…" /> : null}
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save ticket settings"}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={() => void sendPanel()} disabled={panelBusy}>
              {panelBusy ? "Sending…" : "Send ticket panel"}
            </button>
          </div>
        </form>
      </section>

      <ThreadsSection
        title="Support threads"
        description="Open ticket threads for this bot are listed here."
        threads={workspace.threads.filter(thread => thread.kind === "ticket")}
      />
    </>
  );
}

function ModmailModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "modmail", onRefresh });
  const [form, setForm] = useState({
    enabled: scope.moduleState.enabled,
    categoryId: String(scope.moduleState.settings.categoryId ?? ""),
  });

  useEffect(() => {
    setForm({
      enabled: scope.moduleState.enabled,
      categoryId: String(scope.moduleState.settings.categoryId ?? ""),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      form.enabled,
      {
        categoryId: form.categoryId || null,
      },
      "Modmail settings saved.",
    );
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Modmail"
          title="Private support routing"
          description="Route DM-created modmail threads into a guild category for this bot."
        />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable modmail
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Modmail category</label>
            <select
              className={styles.select}
              value={form.categoryId}
              onChange={event => setForm(current => ({ ...current, categoryId: event.target.value }))}
            >
              <option value="">Select a category</option>
              {scope.categoryChannels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
          {scope.resourcesLoading ? <ModuleMessage message="Loading guild categories…" /> : null}
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save modmail settings"}
            </button>
          </div>
        </form>
      </section>

      <ThreadsSection
        title="Modmail threads"
        description="Private support threads routed through this bot appear here."
        threads={workspace.threads.filter(thread => thread.kind === "modmail")}
      />
    </>
  );
}

function FeedDeliveryModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
  moduleId,
  kind,
  eyebrow,
  title,
  description,
  saveLabel,
  createLabel,
  emptyTitle,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
  moduleId: "feeds" | "rss" | "reddit" | "twitch" | "youtube" | "streaming";
  kind: "feed" | "rss" | "reddit" | "twitch" | "youtube" | "streaming";
  eyebrow: string;
  title: string;
  description: string;
  saveLabel: string;
  createLabel: string;
  emptyTitle: string;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId, onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    intervalMinutes: String(parseNumber(scope.moduleState.settings.intervalMinutes, kind === "rss" ? 15 : 5)),
  });
  const [feedForm, setFeedForm] = useState({
    channelId: "",
    name: "",
    feedUrl: "",
  });
  const [feedBusy, setFeedBusy] = useState(false);

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      intervalMinutes: String(parseNumber(scope.moduleState.settings.intervalMinutes, kind === "rss" ? 15 : 5)),
    });
    setFeedForm(current => ({
      ...current,
      channelId: current.channelId || scope.textChannels[0]?.id || "",
    }));
  }, [kind, scope.moduleState.enabled, scope.moduleState.settings, scope.textChannels]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        intervalMinutes: parseNumber(settingsForm.intervalMinutes, 5),
      },
      "Feed settings saved.",
    );
  }

  async function createFeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scope.selectedGuildId) return;
    setFeedBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/feeds`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          channelId: feedForm.channelId,
          name: feedForm.name,
          feedUrl: feedForm.feedUrl,
          kind,
        }),
      });
      await onRefresh();
      setFeedForm({
        channelId: scope.textChannels[0]?.id || "",
        name: "",
        feedUrl: "",
      });
      scope.setMessage("Feed subscription created.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to create feed subscription.");
    } finally {
      setFeedBusy(false);
    }
  }

  async function deleteFeed(feedId: string) {
    if (!window.confirm("Delete this subscription?")) return;
    setFeedBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/feeds/${feedId}`, {
        method: "DELETE",
      });
      await onRefresh();
      scope.setMessage("Subscription deleted.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to delete subscription.");
    } finally {
      setFeedBusy(false);
    }
  }

  const guildFeeds = workspace.feeds.filter(feed => feed.guildId === scope.selectedGuildId && feed.kind === kind);

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.enabled}
                onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable {eyebrow.toLowerCase()}
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Polling interval (minutes)</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={settingsForm.intervalMinutes}
              onChange={event => setSettingsForm(current => ({ ...current, intervalMinutes: event.target.value }))}
            />
          </div>
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : saveLabel}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Subscriptions"
          title={createLabel}
          description="The worker will poll and deliver new items into the selected channel."
        />
        <form className={styles.formGrid} onSubmit={createFeed}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Target channel</label>
              <select
                className={styles.select}
                value={feedForm.channelId}
                onChange={event => setFeedForm(current => ({ ...current, channelId: event.target.value }))}
                required
              >
                <option value="">Select a text channel</option>
                {scope.textChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Subscription name</label>
              <input
                className={styles.input}
                value={feedForm.name}
                onChange={event => setFeedForm(current => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Feed URL</label>
            <input
              className={styles.input}
              value={feedForm.feedUrl}
              onChange={event => setFeedForm(current => ({ ...current, feedUrl: event.target.value }))}
              placeholder="https://example.com/feed.xml"
              required
            />
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.buttonSecondary} disabled={feedBusy}>
              {feedBusy ? "Creating…" : createLabel}
            </button>
          </div>
        </form>

        {guildFeeds.length ? (
          <div className={styles.list}>
            {guildFeeds.map((feed: FeedRecord) => (
              <article key={feed.id} className={styles.card}>
                <div>
                  <h3 className={styles.cardTitle}>{feed.name}</h3>
                  <p className={styles.cardText}>
                    {feed.feedUrl}
                    <br />
                    Channel {feed.channelId}
                  </p>
                </div>
                <div className={styles.cardActions}>
                  <Badge label={feed.lastSeenId ? "tracking" : "new"} tone={feed.lastSeenId ? "soft" : "new"} />
                  <button type="button" className={styles.buttonDangerGhost} onClick={() => void deleteFeed(feed.id)} disabled={feedBusy}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={emptyTitle} description="Create the first subscription for this guild." />
        )}
      </section>
    </>
  );
}

function FeedsModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <FeedDeliveryModuleSection
      botId={botId}
      workspace={workspace}
      templates={templates}
      onRefresh={onRefresh}
      moduleId="feeds"
      kind="feed"
      eyebrow="Feeds & Alerts"
      title="Feed delivery"
      description="Configure generic feed polling and create guild-specific alert subscriptions."
      saveLabel="Save feed settings"
      createLabel="Create subscription"
      emptyTitle="No feed subscriptions yet"
    />
  );
}

function RssModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <FeedDeliveryModuleSection
      botId={botId}
      workspace={workspace}
      templates={templates}
      onRefresh={onRefresh}
      moduleId="rss"
      kind="rss"
      eyebrow="RSS"
      title="RSS delivery"
      description="Configure RSS polling and create guild-specific RSS subscriptions."
      saveLabel="Save RSS settings"
      createLabel="Create RSS subscription"
      emptyTitle="No RSS subscriptions yet"
    />
  );
}

function RedditModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <FeedDeliveryModuleSection
      botId={botId}
      workspace={workspace}
      templates={templates}
      onRefresh={onRefresh}
      moduleId="reddit"
      kind="reddit"
      eyebrow="Reddit"
      title="Reddit subscriptions"
      description="Track subreddit feeds or Reddit RSS sources and post new items into the selected guild."
      saveLabel="Save Reddit settings"
      createLabel="Create Reddit subscription"
      emptyTitle="No Reddit subscriptions yet"
    />
  );
}

function TwitchModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <FeedDeliveryModuleSection
      botId={botId}
      workspace={workspace}
      templates={templates}
      onRefresh={onRefresh}
      moduleId="twitch"
      kind="twitch"
      eyebrow="Twitch"
      title="Twitch subscriptions"
      description="Track Twitch channel feeds or alert URLs and post updates into the selected guild."
      saveLabel="Save Twitch settings"
      createLabel="Create Twitch subscription"
      emptyTitle="No Twitch subscriptions yet"
    />
  );
}

function YoutubeModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <FeedDeliveryModuleSection
      botId={botId}
      workspace={workspace}
      templates={templates}
      onRefresh={onRefresh}
      moduleId="youtube"
      kind="youtube"
      eyebrow="YouTube"
      title="YouTube subscriptions"
      description="Track YouTube channel feeds and post new uploads through this bot workspace."
      saveLabel="Save YouTube settings"
      createLabel="Create YouTube subscription"
      emptyTitle="No YouTube subscriptions yet"
    />
  );
}

function StreamingModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <FeedDeliveryModuleSection
      botId={botId}
      workspace={workspace}
      templates={templates}
      onRefresh={onRefresh}
      moduleId="streaming"
      kind="streaming"
      eyebrow="Streaming"
      title="Streaming alert subscriptions"
      description="Track stream alert feeds and external stream status updates for the selected guild."
      saveLabel="Save streaming settings"
      createLabel="Create streaming subscription"
      emptyTitle="No streaming subscriptions yet"
    />
  );
}

function ReputationModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "reputation", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    maxAwardPoints: String(parseInteger(scope.moduleState.settings.maxAwardPoints as string | number | undefined, 5)),
    allowSelfAward: Boolean(scope.moduleState.settings.allowSelfAward ?? false),
  });
  const [awardForm, setAwardForm] = useState({
    userId: "",
    delta: "1",
  });
  const [reputationBusy, setReputationBusy] = useState(false);

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      maxAwardPoints: String(parseInteger(scope.moduleState.settings.maxAwardPoints as string | number | undefined, 5)),
      allowSelfAward: Boolean(scope.moduleState.settings.allowSelfAward ?? false),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  const guildReputations = useMemo(
    () => workspace.reputations.filter(record => record.guildId === scope.selectedGuildId),
    [scope.selectedGuildId, workspace.reputations],
  );

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        maxAwardPoints: Math.max(1, parseInteger(settingsForm.maxAwardPoints, 5)),
        allowSelfAward: settingsForm.allowSelfAward,
      },
      "Reputation settings saved.",
    );
  }

  async function awardReputation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scope.selectedGuildId) return;
    setReputationBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/reputation/award`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          userId: awardForm.userId.trim(),
          delta: parseInteger(awardForm.delta, 1),
        }),
      });
      await onRefresh();
      setAwardForm(current => ({ ...current, userId: "", delta: "1" }));
      scope.setMessage("Reputation updated.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to update reputation.");
    } finally {
      setReputationBusy(false);
    }
  }

  async function resetReputation(userId?: string) {
    if (!scope.selectedGuildId) return;
    const confirmed = window.confirm(userId ? "Reset this member reputation?" : "Reset all reputation in this guild?");
    if (!confirmed) return;
    setReputationBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/reputation/reset`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          userId: userId ?? undefined,
        }),
      });
      await onRefresh();
      scope.setMessage(userId ? "Member reputation reset." : "Guild reputation reset.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to reset reputation.");
    } finally {
      setReputationBusy(false);
    }
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Reputation" title="Reputation settings" description="Set guild caps and award behavior for moderator-driven reputation." />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
              Enable reputation
            </label>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Max points per award</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={settingsForm.maxAwardPoints}
                onChange={event => setSettingsForm(current => ({ ...current, maxAwardPoints: event.target.value }))}
              />
            </div>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.allowSelfAward}
                onChange={event => setSettingsForm(current => ({ ...current, allowSelfAward: event.target.checked }))}
              />
              Allow self-awards
            </label>
          </div>
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save reputation settings"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Adjustments" title="Award or reset reputation" description="Use a Discord user ID to adjust points or clear standings from the dashboard." />
        <form className={styles.formGrid} onSubmit={awardReputation}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Discord user ID</label>
              <input
                className={styles.input}
                value={awardForm.userId}
                onChange={event => setAwardForm(current => ({ ...current, userId: event.target.value }))}
                placeholder="123456789012345678"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Points</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={awardForm.delta}
                onChange={event => setAwardForm(current => ({ ...current, delta: event.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.buttonSecondary} disabled={reputationBusy}>
              {reputationBusy ? "Saving…" : "Award points"}
            </button>
            <button type="button" className={styles.buttonDangerGhost} onClick={() => void resetReputation(awardForm.userId.trim() || undefined)} disabled={reputationBusy}>
              Reset user
            </button>
            <button type="button" className={styles.buttonGhost} onClick={() => void resetReputation()} disabled={reputationBusy}>
              Reset guild
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Leaderboard" title="Guild standings" description="Top reputation holders for the currently selected guild." />
        {guildReputations.length ? (
          <div className={styles.list}>
            {guildReputations.slice(0, 20).map((record, index) => (
              <article key={`${record.guildId}:${record.userId}`} className={styles.card}>
                <div>
                  <h3 className={styles.cardTitle}>#{index + 1} · User {record.userId}</h3>
                  <p className={styles.cardText}>{record.points} points</p>
                </div>
                <div className={styles.cardActions}>
                  <Badge label={`${record.points} pts`} tone="soft" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No reputation yet" description="Use the award form or /reputation commands to start tracking points." />
        )}
      </section>
    </>
  );
}

function RsvpModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "rsvp", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    allowMaybe: Boolean(scope.moduleState.settings.allowMaybe ?? true),
    defaultChannelId: String(scope.moduleState.settings.defaultChannelId ?? ""),
  });
  const [eventForm, setEventForm] = useState({
    channelId: "",
    title: "",
    description: "",
    allowMaybe: Boolean(scope.moduleState.settings.allowMaybe ?? true),
  });
  const [eventBusy, setEventBusy] = useState(false);

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      allowMaybe: Boolean(scope.moduleState.settings.allowMaybe ?? true),
      defaultChannelId: String(scope.moduleState.settings.defaultChannelId ?? ""),
    });
    setEventForm(current => ({
      ...current,
      channelId: current.channelId || String(scope.moduleState.settings.defaultChannelId ?? scope.textChannels[0]?.id ?? ""),
      allowMaybe: Boolean(scope.moduleState.settings.allowMaybe ?? true),
    }));
  }, [scope.moduleState.enabled, scope.moduleState.settings, scope.textChannels]);

  const guildEvents = useMemo(
    () => workspace.rsvpEvents.filter(event => event.guildId === scope.selectedGuildId),
    [scope.selectedGuildId, workspace.rsvpEvents],
  );

  function getCounts(eventId: string) {
    return workspace.rsvpResponses
      .filter(response => response.eventId === eventId)
      .reduce(
        (counts, response) => {
          if (response.response === "yes") counts.yes += 1;
          if (response.response === "no") counts.no += 1;
          if (response.response === "maybe") counts.maybe += 1;
          return counts;
        },
        { yes: 0, no: 0, maybe: 0 },
      );
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        allowMaybe: settingsForm.allowMaybe,
        defaultChannelId: settingsForm.defaultChannelId || null,
      },
      "RSVP settings saved.",
    );
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scope.selectedGuildId) return;
    setEventBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/rsvp-events`, {
        method: "POST",
        body: JSON.stringify({
          guildId: scope.selectedGuildId,
          channelId: eventForm.channelId,
          title: eventForm.title.trim(),
          description: eventForm.description.trim(),
          allowMaybe: eventForm.allowMaybe,
          sendMessage: true,
        }),
      });
      await onRefresh();
      setEventForm({
        channelId: settingsForm.defaultChannelId || scope.textChannels[0]?.id || "",
        title: "",
        description: "",
        allowMaybe: settingsForm.allowMaybe,
      });
      scope.setMessage("RSVP event created and posted.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to create RSVP event.");
    } finally {
      setEventBusy(false);
    }
  }

  async function closeEvent(eventId: string) {
    setEventBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/rsvp-events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "closed",
        }),
      });
      await onRefresh();
      scope.setMessage("RSVP event closed.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to close RSVP event.");
    } finally {
      setEventBusy(false);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!window.confirm("Delete this RSVP event?")) return;
    setEventBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/rsvp-events/${eventId}`, {
        method: "DELETE",
      });
      await onRefresh();
      scope.setMessage("RSVP event deleted.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to delete RSVP event.");
    } finally {
      setEventBusy(false);
    }
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="RSVP" title="RSVP defaults" description="Choose whether maybe responses are allowed and which channel should be preselected for new events." />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input type="checkbox" checked={settingsForm.enabled} onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))} />
              Enable RSVP
            </label>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Default channel</label>
              <select
                className={styles.select}
                value={settingsForm.defaultChannelId}
                onChange={event => setSettingsForm(current => ({ ...current, defaultChannelId: event.target.value }))}
              >
                <option value="">Select a text channel</option>
                {scope.textChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={settingsForm.allowMaybe} onChange={event => setSettingsForm(current => ({ ...current, allowMaybe: event.target.checked }))} />
              Allow maybe responses
            </label>
          </div>
          {scope.resourcesLoading ? <ModuleMessage message="Loading guild channels…" /> : null}
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save RSVP settings"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Create Event" title="Post a new RSVP panel" description="Create a stored event and publish the RSVP panel into a guild text channel." />
        <form className={styles.formGrid} onSubmit={createEvent}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Target channel</label>
              <select
                className={styles.select}
                value={eventForm.channelId}
                onChange={event => setEventForm(current => ({ ...current, channelId: event.target.value }))}
                required
              >
                <option value="">Select a text channel</option>
                {scope.textChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={eventForm.allowMaybe} onChange={event => setEventForm(current => ({ ...current, allowMaybe: event.target.checked }))} />
              Allow maybe on this event
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Event title</label>
            <input className={styles.input} value={eventForm.title} onChange={event => setEventForm(current => ({ ...current, title: event.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={eventForm.description}
              onChange={event => setEventForm(current => ({ ...current, description: event.target.value }))}
              required
            />
          </div>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.buttonSecondary} disabled={eventBusy}>
              {eventBusy ? "Posting…" : "Create RSVP event"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Events" title="Tracked RSVP events" description="Review current RSVP panels and close or remove them from the dashboard." />
        {guildEvents.length ? (
          <div className={styles.list}>
            {guildEvents.map(event => {
              const counts = getCounts(event.id);
              return (
                <article key={event.id} className={styles.card}>
                  <div>
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    <p className={styles.cardText}>
                      {event.description}
                      <br />
                      Yes {counts.yes} · {event.allowMaybe ? `Maybe ${counts.maybe} · ` : ""}No {counts.no}
                      <br />
                      {event.status} · channel {event.channelId}
                    </p>
                  </div>
                  <div className={styles.cardActions}>
                    <Badge label={event.status} tone={event.status === "open" ? "soft" : "beta"} />
                    {event.status === "open" ? (
                      <button type="button" className={styles.buttonGhost} onClick={() => void closeEvent(event.id)} disabled={eventBusy}>
                        Close
                      </button>
                    ) : null}
                    <button type="button" className={styles.buttonDangerGhost} onClick={() => void deleteEvent(event.id)} disabled={eventBusy}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No RSVP events yet" description="Create the first RSVP event for this guild." />
        )}
      </section>
    </>
  );
}

function SoundboardModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "soundboard", onRefresh });
  const [enabled, setEnabled] = useState(scope.moduleState.enabled);
  const [settings, setSettings] = useState<Record<string, unknown>>(scope.moduleState.settings);
  const [clipForm, setClipForm] = useState({
    name: "",
    url: "",
    emoji: "",
  });

  useEffect(() => {
    setEnabled(scope.moduleState.enabled);
    setSettings(scope.moduleState.settings);
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  const clips = Array.isArray(settings.clips) ? (settings.clips as Array<Record<string, unknown>>) : [];

  function addClip() {
    const name = clipForm.name.trim();
    const url = clipForm.url.trim();
    if (!name || !url) {
      return;
    }
    setSettings(current => ({
      ...current,
      clips: [
        ...(Array.isArray(current.clips) ? (current.clips as Array<Record<string, unknown>>) : []),
        {
          name,
          url,
          emoji: clipForm.emoji.trim() || null,
        },
      ].slice(0, 25),
    }));
    setClipForm({ name: "", url: "", emoji: "" });
  }

  function removeClip(index: number) {
    setSettings(current => ({
      ...current,
      clips: (Array.isArray(current.clips) ? (current.clips as Array<Record<string, unknown>>) : []).filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      enabled,
      {
        clips,
      },
      "Soundboard settings saved.",
    );
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Soundboard" title="Clip library" description="Configure named clips that members can trigger with /soundboard play in this guild." />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />
              Enable soundboard
            </label>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Clip name</label>
              <input className={styles.input} value={clipForm.name} onChange={event => setClipForm(current => ({ ...current, name: event.target.value }))} placeholder="airhorn" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Emoji (optional)</label>
              <input className={styles.input} value={clipForm.emoji} onChange={event => setClipForm(current => ({ ...current, emoji: event.target.value }))} placeholder="🔊" />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Clip URL</label>
            <input className={styles.input} value={clipForm.url} onChange={event => setClipForm(current => ({ ...current, url: event.target.value }))} placeholder="https://example.com/clip.mp3" />
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.buttonSecondary} onClick={addClip}>
              Add clip
            </button>
          </div>
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save soundboard settings"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Configured Clips" title="Saved soundboard entries" description="These names are exposed through the runtime /soundboard commands." />
        {clips.length ? (
          <div className={styles.list}>
            {clips.map((clip, index) => (
              <article key={`${String(clip.name)}-${index}`} className={styles.card}>
                <div>
                  <h3 className={styles.cardTitle}>
                    {typeof clip.emoji === "string" && clip.emoji ? `${clip.emoji} ` : ""}
                    {String(clip.name ?? "Unnamed clip")}
                  </h3>
                  <p className={styles.cardText}>{String(clip.url ?? "")}</p>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" className={styles.buttonDangerGhost} onClick={() => removeClip(index)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No clips configured" description="Add the first soundboard clip and save the module settings." />
        )}
      </section>
    </>
  );
}

function CustomCommandsModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId: "customCommands", onRefresh });
  const [settingsForm, setSettingsForm] = useState({
    enabled: scope.moduleState.enabled,
    prefix: String(scope.moduleState.settings.prefix ?? "!"),
  });
  const [commands, setCommands] = useState<CustomCommandRecord[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(false);
  const [commandBusy, setCommandBusy] = useState(false);
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [commandForm, setCommandForm] = useState({
    name: "",
    triggerType: "command" as CustomCommandRecord["triggerType"],
    trigger: "",
    caseSensitive: false,
    responseText: "",
    enabled: true,
  });

  const loadCommands = useCallback(async () => {
    if (!scope.selectedGuildId) {
      setCommands([]);
      return;
    }

    setCommandsLoading(true);
    try {
      const payload = await requestJson<{ commands: CustomCommandRecord[] }>(
        `/api/bots/${botId}/custom-commands?guildId=${encodeURIComponent(scope.selectedGuildId)}`,
      );
      setCommands(payload.commands);
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to load custom commands.");
    } finally {
      setCommandsLoading(false);
    }
  }, [botId, scope]);

  useEffect(() => {
    setSettingsForm({
      enabled: scope.moduleState.enabled,
      prefix: String(scope.moduleState.settings.prefix ?? "!"),
    });
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  useEffect(() => {
    void loadCommands();
  }, [loadCommands]);

  function resetCommandForm() {
    setEditingCommandId(null);
    setCommandForm({
      name: "",
      triggerType: "command",
      trigger: "",
      caseSensitive: false,
      responseText: "",
      enabled: true,
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(
      settingsForm.enabled,
      {
        prefix: settingsForm.prefix.trim() || "!",
      },
      "Custom command settings saved.",
    );
  }

  async function saveCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scope.selectedGuildId) return;

    setCommandBusy(true);
    scope.setMessage(null);
    try {
      const payload = {
        guildId: scope.selectedGuildId,
        name: commandForm.name.trim(),
        triggerType: commandForm.triggerType,
        trigger: commandForm.trigger.trim(),
        caseSensitive: commandForm.caseSensitive,
        responseText: commandForm.responseText,
        enabled: commandForm.enabled,
      };

      if (editingCommandId) {
        await requestJson(`/api/bots/${botId}/custom-commands/${editingCommandId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        scope.setMessage("Custom command updated.");
      } else {
        await requestJson(`/api/bots/${botId}/custom-commands`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        scope.setMessage("Custom command created.");
      }

      resetCommandForm();
      await Promise.all([loadCommands(), onRefresh()]);
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to save custom command.");
    } finally {
      setCommandBusy(false);
    }
  }

  async function deleteCommand(commandId: string) {
    const confirmed = window.confirm("Delete this custom command?");
    if (!confirmed) return;

    setCommandBusy(true);
    scope.setMessage(null);
    try {
      await requestJson(`/api/bots/${botId}/custom-commands/${commandId}`, {
        method: "DELETE",
      });
      if (editingCommandId === commandId) {
        resetCommandForm();
      }
      await Promise.all([loadCommands(), onRefresh()]);
      scope.setMessage("Custom command deleted.");
    } catch (error) {
      scope.setMessage(error instanceof Error ? error.message : "Failed to delete custom command.");
    } finally {
      setCommandBusy(false);
    }
  }

  function startEditing(command: CustomCommandRecord) {
    setEditingCommandId(command.id);
    setCommandForm({
      name: command.name,
      triggerType: command.triggerType,
      trigger: command.trigger,
      caseSensitive: command.caseSensitive,
      responseText: command.responseText,
      enabled: command.enabled,
    });
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Custom Commands"
          title="Runtime trigger settings"
          description="Use YAGPDB-style trigger matching with a per-guild prefix and runtime-backed responses."
        />
        <form className={styles.formGrid} onSubmit={saveSettings}>
          <div className={styles.formTwo}>
            <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settingsForm.enabled}
                onChange={event => setSettingsForm(current => ({ ...current, enabled: event.target.checked }))}
              />
              Enable custom commands
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Command prefix</label>
            <input
              className={styles.input}
              value={settingsForm.prefix}
              onChange={event => setSettingsForm(current => ({ ...current, prefix: event.target.value }))}
              placeholder="!"
              maxLength={10}
            />
          </div>
          <ModuleMessage message={scope.message} />
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={scope.busy}>
              {scope.busy ? "Saving…" : "Save command settings"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Command Builder"
          title={editingCommandId ? "Edit custom command" : "Create custom command"}
          description="This is the panel-driven version of YAGPDB custom commands: trigger text in, bot response out."
        />
        <form className={styles.formGrid} onSubmit={saveCommand}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Command name</label>
              <input
                className={styles.input}
                value={commandForm.name}
                onChange={event => setCommandForm(current => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Trigger type</label>
              <select
                className={styles.select}
                value={commandForm.triggerType}
                onChange={event => setCommandForm(current => ({ ...current, triggerType: event.target.value as CustomCommandRecord["triggerType"] }))}
              >
                <option value="command">Command</option>
                <option value="startsWith">Starts with</option>
                <option value="contains">Contains</option>
                <option value="exact">Exact</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          </div>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Trigger</label>
              <input
                className={styles.input}
                value={commandForm.trigger}
                onChange={event => setCommandForm(current => ({ ...current, trigger: event.target.value }))}
                placeholder={commandForm.triggerType === "command" ? "hello" : "hello there"}
                required
              />
            </div>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={commandForm.caseSensitive}
                onChange={event => setCommandForm(current => ({ ...current, caseSensitive: event.target.checked }))}
              />
              Case sensitive
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Response</label>
            <textarea
              className={styles.textarea}
              rows={6}
              value={commandForm.responseText}
              onChange={event => setCommandForm(current => ({ ...current, responseText: event.target.value }))}
              placeholder={"Use tokens like {userMention}, {user}, {server}, {channel}, {args}, {bot}"}
              required
            />
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={commandForm.enabled}
              onChange={event => setCommandForm(current => ({ ...current, enabled: event.target.checked }))}
            />
            Enable this command
          </label>
          <div className={styles.cardActions}>
            <button type="submit" className={styles.buttonSecondary} disabled={commandBusy}>
              {commandBusy ? "Saving…" : editingCommandId ? "Update command" : "Create command"}
            </button>
            {editingCommandId ? (
              <button type="button" className={styles.buttonGhost} onClick={resetCommandForm} disabled={commandBusy}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Guild Commands"
          title="Active custom commands"
          description="These commands execute inside the selected guild only and stay tied to this bot runtime."
        />
        {commandsLoading ? <ModuleMessage message="Loading custom commands…" /> : null}
        {commands.length ? (
          <div className={styles.list}>
            {commands.map(command => (
              <article key={command.id} className={styles.card}>
                <div>
                  <h3 className={styles.cardTitle}>{command.name}</h3>
                  <p className={styles.cardText}>
                    {command.triggerType} · {command.trigger}
                    <br />
                    {command.responseText.slice(0, 160)}
                  </p>
                </div>
                <div className={styles.cardActions}>
                  <Badge label={command.enabled ? "enabled" : "disabled"} tone={command.enabled ? "soft" : "beta"} />
                  <button type="button" className={styles.buttonGhost} onClick={() => startEditing(command)} disabled={commandBusy}>
                    Edit
                  </button>
                  <button type="button" className={styles.buttonDangerGhost} onClick={() => void deleteCommand(command.id)} disabled={commandBusy}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No custom commands yet" description="Create the first trigger-driven command for this guild." />
        )}
      </section>
    </>
  );
}

function SimpleGuildModuleSection({
  botId,
  workspace,
  templates,
  onRefresh,
  moduleId,
  eyebrow,
  title,
  description,
  settingsFactory,
  fields,
  saveLabel,
}: {
  botId: string;
  workspace: BotWorkspacePayload;
  templates: TemplateDefinition[];
  onRefresh: () => Promise<void>;
  moduleId: ModuleId;
  eyebrow: string;
  title: string;
  description: string;
  settingsFactory: (settings: Record<string, unknown>) => Record<string, unknown>;
  fields: (args: {
    scope: ReturnType<typeof useGuildModuleScope>;
    values: Record<string, unknown>;
    setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  }) => React.ReactNode;
  saveLabel: string;
}) {
  const scope = useGuildModuleScope({ botId, workspace, templates, moduleId, onRefresh });
  const [enabled, setEnabled] = useState(scope.moduleState.enabled);
  const [values, setValues] = useState<Record<string, unknown>>(scope.moduleState.settings);

  useEffect(() => {
    setEnabled(scope.moduleState.enabled);
    setValues(scope.moduleState.settings);
  }, [scope.moduleState.enabled, scope.moduleState.settings]);

  const sharedModuleBaseline = useMemo(
    () => serializeDraftState({ enabled: scope.moduleState.enabled, values: scope.moduleState.settings }),
    [scope.moduleState.enabled, scope.moduleState.settings],
  );
  const sharedModuleDirty = sharedModuleBaseline !== serializeDraftState({ enabled, values });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await scope.saveModule(enabled, settingsFactory(values), `${title} saved.`);
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <form className={styles.formGrid} onSubmit={handleSubmit}>
        <div className={styles.formTwo}>
          <GuildSelector guilds={scope.guilds} selectedGuildId={scope.selectedGuildId} onChange={scope.setSelectedGuildId} />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />
            Enable {eyebrow.toLowerCase()}
          </label>
        </div>
        {fields({ scope, values, setValues })}
        <ModuleMessage message={scope.message} />
        <StickySaveBar
          dirty={sharedModuleDirty}
          busy={scope.busy}
          saveLabel={saveLabel}
          onReset={() => {
            setEnabled(scope.moduleState.enabled);
            setValues(scope.moduleState.settings);
          }}
        />
      </form>
    </section>
  );
}

export function BotWorkspaceScreen({
  botId,
  section,
}: {
  botId: string;
  section: WorkspaceScreen;
}) {
  const searchParams = useSearchParams();
  const { bootstrap, refresh } = useConsole();
  const { pushToast } = useDashboardFeedback();
  const templates = bootstrap?.templates || [];
  const state = useBotWorkspaceState(botId);
  const {
    workspace,
    loading,
    message,
    busyAction,
    settingsForm,
    setSettingsForm,
    tokenForm,
    setTokenForm,
    overridesText,
    setOverridesText,
    aiForm,
    setAiForm,
    webhookForm,
    setWebhookForm,
    saveSettings,
    replaceToken,
    saveOverrides,
    saveAi,
    createWebhook,
    dispatchAction,
    deleteBot,
  } = state;

  const [moduleOverrideText, setModuleOverrideText] = useState("{}");
  const focusedGuildId = searchParams.get("guild") || "";
  const focusedGuildConfig = workspace?.guildConfigs.find(configRecord => configRecord.guildId === focusedGuildId) || null;
  const focusedGuildTemplateKey = getGuildTemplateKey(focusedGuildConfig?.overrides);

  const selectedTemplate = workspace
    ? getTemplateDefinition(templates, focusedGuildTemplateKey || workspace.bot.templateKey)
    : null;
  const enabledModules = workspace
    ? getEnabledModules(selectedTemplate, focusedGuildConfig?.overrides ?? workspace.bot.featureOverrides)
    : [];
  const enabledModuleCards = workspace
    ? getEnabledModuleCards(templates, workspace.bot, focusedGuildId || undefined, focusedGuildConfig?.overrides)
    : [];
  const currentModule = sectionToModule[section] || null;
  const focusedGuild = workspace
    ? getAvailableGuilds(workspace).find(guild => guild.id === focusedGuildId) || null
    : null;

  useEffect(() => {
    if (!workspace || !currentModule) {
      setModuleOverrideText("{}");
      return;
    }
    setModuleOverrideText(getModuleOverrideValue(workspace.bot.featureOverrides, currentModule));
  }, [workspace, currentModule]);

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader title="Loading bot workspace" description="Pulling bot-specific settings and operational state." />
      </section>
    );
  }

  if (!workspace) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState
          title="Bot workspace unavailable"
          description={message || "This bot could not be loaded."}
          action={
            <div className={styles.cardActions}>
              <Link href="/app/bots" className={styles.button}>
                Back to fleet
              </Link>
            </div>
          }
        />
      </section>
    );
  }

  async function saveFocusedModuleOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentModule || !workspace) return;
    try {
      const parsed = parseJsonInput<Record<string, unknown>>(moduleOverrideText);
      await requestJson(`/api/bots/${botId}/overrides`, {
        method: "PUT",
        body: JSON.stringify({
          featureOverrides: {
            ...workspace.bot.featureOverrides,
            [currentModule]: parsed,
          },
        }),
      });
      await Promise.all([state.loadWorkspace(), refresh()]);
      pushToast({
        title: "Module override saved",
        description: "The focused module override was applied to this bot workspace.",
        tone: "success",
      });
    } catch (error) {
      pushToast({
        title: "Override save failed",
        description: error instanceof Error ? error.message : "Failed to save module override.",
        tone: "danger",
      });
    }
  }

  const moduleEnabled = currentModule ? enabledModules.includes(currentModule) : true;

  if (section === "overview") {
    return (
      <>
        <WorkspaceHero
          workspace={workspace}
          busyAction={busyAction}
          onDispatch={dispatchAction}
          onDelete={deleteBot}
        />
        <MessageBanner message={message} />
        <section className={styles.pageSurface}>
          <SectionHeader
            title={
              <span className={styles.sectionInlineHeading}>
                <span>Template Functions</span>
                <span className={styles.sectionInlineDash}>-</span>
                <span className={`${styles.chip} ${styles.sectionChip}`}>{selectedTemplate?.name || formatTemplateLabel(workspace.bot.templateKey)} modules</span>
              </span>
            }
            titleClassName={styles.sectionTitleCompact}
          />
          {enabledModuleCards.length ? (
            <div className={styles.pluginGrid}>
              {enabledModuleCards.map(moduleCard => {
                const Icon = moduleCard.icon;
                return (
                  <article key={moduleCard.id} className={styles.card}>
                    <span className={styles.pluginIconWrap}>
                      <Icon className={styles.pluginIcon} />
                    </span>
                    <div>
                      <h3 className={styles.cardTitle}>{moduleCard.label}</h3>
                      <p className={styles.cardText}>
                        Enabled through the selected template and available only for this bot workspace.
                      </p>
                    </div>
                    <div className={styles.cardActions}>
                      <Link href={moduleCard.href} scroll={false} className={styles.buttonSecondary}>
                        Open function
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No modules enabled yet" description="This bot starts empty. Enable modules one by one when you're ready." />
          )}
        </section>
      </>
    );
  }

  if (section === "settings") {
    return (
      <>
        <MessageBanner message={message} />
        <SettingsSection
          templates={templates}
          busyAction={busyAction}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          tokenForm={tokenForm}
          setTokenForm={setTokenForm}
          overridesText={overridesText}
          setOverridesText={setOverridesText}
          onSaveSettings={saveSettings}
          onReplaceToken={replaceToken}
          onSaveOverrides={saveOverrides}
          onDispatch={dispatchAction}
        />
      </>
    );
  }

  if (section === "audit") {
    return (
      <>
        <MessageBanner message={message} />
        <AuditSection
          auditLogs={workspace.auditLogs}
          title="Recent bot-specific actions"
          description="Operational history stays here and is scoped to this bot only."
        />
      </>
    );
  }

  if (!currentModule || !moduleEnabled) {
    return (
      <>
        <section className={styles.pageSurface}>
          <EmptyState
            title="Module unavailable"
            description="This function is not enabled for the selected bot template or bot-specific overrides."
            action={
              <div className={styles.cardActions}>
                <Link href={getBotWorkspaceHref(botId, "overview", focusedGuildId || undefined)} scroll={false} className={styles.button}>
                  Back to workspace
                </Link>
                <Link href={getBotWorkspaceHref(botId, "settings", focusedGuildId || undefined)} scroll={false} className={styles.buttonSecondary}>
                  Review template
                </Link>
              </div>
            }
          />
        </section>
      </>
    );
  }

  const copy = moduleTitles[currentModule];

  return (
    <>
      <MessageBanner message={message} />
      <section className={styles.pageSurface}>
        <div className={styles.pageBackRow}>
          <Link href={getBotWorkspaceHref(botId, "overview", focusedGuildId || undefined)} scroll={false} className={styles.backLink}>
            ← Back to workspace
          </Link>
        </div>
        <SectionHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />
      </section>

      {currentModule === "moderation" ? (
        <ModerationModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "automod" ? (
        <AutomodModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "autorole" ? (
        <AutoroleModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "roleCommands" ? (
        <RoleCommandsModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "reputation" ? (
        <ReputationModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "logs" ? (
        <LogsModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "notifications" ? (
        <NotificationsModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "ai" ? (
        <AiSection busyAction={busyAction} aiForm={aiForm} setAiForm={setAiForm} onSaveAi={saveAi} />
      ) : null}

      {currentModule === "onboarding" ? (
        <OnboardingModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "verification" ? (
        <VerificationModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "reactionRoles" ? (
        <ReactionRolesModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "voiceRoles" ? (
        <VoiceRolesModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "tickets" ? (
        <TicketsModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "modmail" ? (
        <ModmailModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "componentsV2" ? (
        <TemplatesSection
          botId={botId}
          workspace={workspace}
          title={copy.title}
          description="Draft, publish, share, and send managed layouts with JSON-level control over embeds and component actions."
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "premium" ? (
        <PremiumSection
          botId={botId}
          workspace={workspace}
          title={copy.title}
          description="Premium unlocks advanced studio features, share links, webhook sends, and guild-specific bot profile customization."
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "personalizer" ? (
        <PersonalizerSection
          botId={botId}
          workspace={workspace}
          title={copy.title}
          description="Customize how this bot appears in each premium-enabled guild without changing the global Discord application profile."
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "webhooks" ? (
        <WebhooksSection
          title={copy.title}
          description="Create only the endpoints and feed hooks required for this selected bot."
          busyAction={busyAction}
          webhookForm={webhookForm}
          setWebhookForm={setWebhookForm}
          webhooks={workspace.webhooks}
          onCreateWebhook={createWebhook}
        />
      ) : null}

      {currentModule === "feeds" ? (
        <FeedsModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "rss" ? (
        <RssModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "reddit" ? (
        <RedditModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "twitch" ? (
        <TwitchModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "youtube" ? (
        <YoutubeModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "streaming" ? (
        <StreamingModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "rsvp" ? (
        <RsvpModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "soundboard" ? (
        <SoundboardModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "customCommands" ? (
        <CustomCommandsModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
        />
      ) : null}

      {currentModule === "reminders" ? (
        <SimpleGuildModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
          moduleId="reminders"
          eyebrow="Reminders"
          title="Reminder delivery settings"
          description="Keep reminder limits and reminder module availability scoped per guild."
          saveLabel="Save reminder settings"
          settingsFactory={values => ({
            maxPerUser: parseNumber(values.maxPerUser, 25),
          })}
          fields={({ values, setValues }) => (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Max reminders per user</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={String(values.maxPerUser ?? 25)}
                onChange={event => setValues(current => ({ ...current, maxPerUser: event.target.value }))}
              />
            </div>
          )}
        />
      ) : null}

      {currentModule === "musicVoice" ? (
        <SimpleGuildModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
          moduleId="musicVoice"
          eyebrow="Music & Voice"
          title="Voice runtime settings"
          description="Control voice auto-disconnect and module availability per guild."
          saveLabel="Save voice settings"
          settingsFactory={values => ({
            autoDisconnectMinutes: parseNumber(values.autoDisconnectMinutes, 10),
          })}
          fields={({ values, setValues }) => (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Auto-disconnect minutes</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={String(values.autoDisconnectMinutes ?? 10)}
                onChange={event => setValues(current => ({ ...current, autoDisconnectMinutes: event.target.value }))}
              />
            </div>
          )}
        />
      ) : null}

      {currentModule === "serverStats" ? (
        <SimpleGuildModuleSection
          botId={botId}
          workspace={workspace}
          templates={templates}
          onRefresh={state.loadWorkspace}
          moduleId="serverStats"
          eyebrow="Server Stats"
          title="Server statistics settings"
          description="Keep server stats enabled and configure boost visibility for the selected guild."
          saveLabel="Save stats settings"
          settingsFactory={values => ({
            includeBoosts: Boolean(values.includeBoosts),
          })}
          fields={({ values, setValues, scope }) => (
            <>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={Boolean(values.includeBoosts)}
                  onChange={event => setValues(current => ({ ...current, includeBoosts: event.target.checked }))}
                />
                Include server boosts in stats
              </label>
              <ModuleMessage
                message={
                  scope.guilds.find(guild => guild.id === scope.selectedGuildId)
                    ? `${scope.guilds.find(guild => guild.id === scope.selectedGuildId)!.name} has ${scope.guilds.find(guild => guild.id === scope.selectedGuildId)!.memberCount} tracked members in the worker snapshot.`
                    : null
                }
              />
            </>
          )}
        />
      ) : null}

      {currentModule === "utilities" ? (
        <ModuleOverrideSection
          title={`${copy.title} override payload`}
          description="Utilities still use a shared override payload until their dedicated forms are split out."
          buttonLabel={`Save ${copy.eyebrow.toLowerCase()} config`}
          value={moduleOverrideText}
          onChange={setModuleOverrideText}
          onSubmit={saveFocusedModuleOverride}
          busy={busyAction !== null}
        />
      ) : null}
    </>
  );
}

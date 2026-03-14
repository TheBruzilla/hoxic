"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { useGuildContext } from "@/components/console/GuildContext";
import { buildFocusedBotsHref, buildSetupHref } from "@/app/app/setup/setup-helpers";
import {
  BotRecord,
  BotWorkspacePayload,
  buildModulesHref,
  getBotWorkspaceHref,
  getEnabledModules,
  getGuildTemplateKey,
  getModuleWorkspaceSection,
  getTemplateDefinition,
  requestJson,
  type ModuleId,
} from "@/lib/console";
import { getModuleSurfaceMetadata, moduleCategories } from "@/lib/moduleCatalog";
import { templateCatalogModules } from "@/lib/templateCatalog";
import styles from "./console.module.scss";

function isMeaningfulValue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && value !== 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some(isMeaningfulValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(isMeaningfulValue);
  }
  return false;
}

function getGuildOverrides(workspace: BotWorkspacePayload, guildId: string) {
  return workspace.guildConfigs.find(record => record.guildId === guildId)?.overrides || {};
}

function isModuleConfigured(moduleId: ModuleId, workspace: BotWorkspacePayload, guildId: string) {
  const overrides = getGuildOverrides(workspace, guildId);
  const rawOverride = overrides[moduleId];
  const settings =
    rawOverride && typeof rawOverride === "object" && "settings" in (rawOverride as Record<string, unknown>)
      ? (((rawOverride as { settings?: unknown }).settings as Record<string, unknown> | undefined) ?? {})
      : {};

  switch (moduleId) {
    case "automod":
      return workspace.automodRules.some(rule => rule.guildId === guildId);
    case "logs":
      return isMeaningfulValue(settings.logChannelId);
    case "notifications":
      return isMeaningfulValue(settings.joinChannelId) || isMeaningfulValue(settings.leaveChannelId) || Boolean(settings.announceBoosts);
    case "onboarding":
      return isMeaningfulValue(settings.welcomeChannelId) || isMeaningfulValue(settings.welcomeMessage) || Boolean(settings.sendWelcomeDm);
    case "verification":
    case "reactionRoles":
    case "tickets":
      return isMeaningfulValue(settings.panelChannelId) || isMeaningfulValue(settings.panelTemplateId);
    case "modmail":
      return Array.isArray(workspace.threads) && workspace.threads.some(thread => {
        const threadGuildId = thread && typeof thread === "object" && "guildId" in thread ? (thread as { guildId?: unknown }).guildId : null;
        return typeof threadGuildId === "string" && threadGuildId === guildId;
      });
    case "ai":
      return Boolean(workspace.ai);
    case "webhooks":
      return workspace.webhooks.length > 0;
    case "componentsV2":
      return workspace.templates.some(template => template.guildId === guildId);
    case "feeds":
      return workspace.feeds.some(feed => feed.guildId === guildId && feed.kind === "feed");
    case "rss":
      return workspace.feeds.some(feed => feed.guildId === guildId && feed.kind === "rss");
    case "reddit":
      return workspace.feeds.some(feed => feed.guildId === guildId && feed.kind === "reddit");
    case "twitch":
      return workspace.feeds.some(feed => feed.guildId === guildId && feed.kind === "twitch");
    case "youtube":
      return workspace.feeds.some(feed => feed.guildId === guildId && feed.kind === "youtube");
    case "streaming":
      return workspace.feeds.some(feed => feed.guildId === guildId && feed.kind === "streaming");
    case "reputation":
      return workspace.reputations.some(record => record.guildId === guildId);
    case "rsvp":
      return workspace.rsvpEvents.some(event => event.guildId === guildId);
    case "premium":
      return workspace.entitlements.some(entitlement => entitlement.guildId === guildId && entitlement.status === "active");
    case "personalizer":
      return workspace.personalizations.some(record => record.guildId === guildId && Boolean(record.nickname || record.avatarSource || record.bannerSource));
    default:
      return isMeaningfulValue(settings);
  }
}

function getCategoryKey(value: string) {
  return value.toLowerCase();
}

export function ModulesCenterScreen({ forcedGuildId }: { forcedGuildId?: string } = {}) {
  const searchParams = useSearchParams();
  const { bootstrap, loading, error } = useConsole();
  const { selectedGuildId, setSelectedGuildId } = useGuildContext();
  const [workspaceMap, setWorkspaceMap] = useState<Record<string, BotWorkspacePayload>>({});
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const group = searchParams.get("group") || "all";
  const activeGuildId = forcedGuildId || searchParams.get("guild") || "";
  const activeGuild = useMemo(
    () => bootstrap?.manageableGuilds.find(guild => guild.id === activeGuildId) || null,
    [activeGuildId, bootstrap?.manageableGuilds],
  );

  useEffect(() => {
    if (activeGuildId) {
      setSelectedGuildId(activeGuildId);
    }
  }, [activeGuildId, setSelectedGuildId]);

  const connectedBots = useMemo(() => {
    if (!bootstrap || !activeGuild) {
      return [] as BotRecord[];
    }

    return activeGuild.botIds
      .map(botId => bootstrap.bots.find(bot => bot.id === botId) || null)
      .filter((bot): bot is BotRecord => Boolean(bot));
  }, [activeGuild, bootstrap]);

  useEffect(() => {
    if (!activeGuild || connectedBots.length === 0) {
      setWorkspaceMap({});
      setWorkspaceError(null);
      setWorkspaceLoading(false);
      return;
    }

    let cancelled = false;
    setWorkspaceLoading(true);
    setWorkspaceError(null);

    void Promise.all(
      connectedBots.map(async bot => {
        const payload = await requestJson<BotWorkspacePayload>(`/api/bots/${bot.id}`);
        return [bot.id, payload] as const;
      }),
    )
      .then(entries => {
        if (!cancelled) {
          setWorkspaceMap(Object.fromEntries(entries));
        }
      })
      .catch(loadError => {
        if (!cancelled) {
          setWorkspaceMap({});
          setWorkspaceError(loadError instanceof Error ? loadError.message : "Unable to load module state.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWorkspaceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeGuild, connectedBots]);

  const moduleCards = useMemo(() => {
    if (!bootstrap || !activeGuild) {
      return [];
    }

    const workspaceEntries = connectedBots
      .map(bot => ({
        bot,
        workspace: workspaceMap[bot.id] || null,
      }))
      .filter((entry): entry is { bot: BotRecord; workspace: BotWorkspacePayload } => Boolean(entry.workspace));

    const guildHasPremium = workspaceEntries.some(({ workspace }) =>
      workspace.entitlements.some(entitlement => entitlement.guildId === activeGuild.id && entitlement.status === "active"),
    );

    return templateCatalogModules.map(module => {
      const moduleId = module.id as ModuleId;
      const metadata = getModuleSurfaceMetadata(moduleId, module.label);
      const enabledEntries = workspaceEntries.filter(({ bot, workspace }) => {
        const overrides = getGuildOverrides(workspace, activeGuild.id);
        const templateKey = getGuildTemplateKey(overrides) || bot.templateKey;
        const template = getTemplateDefinition(bootstrap.templates, templateKey);
        return getEnabledModules(template, overrides).includes(moduleId);
      });

      const configured = enabledEntries.some(({ workspace }) => isModuleConfigured(moduleId, workspace, activeGuild.id));
      const preferredBot = enabledEntries[0]?.bot || connectedBots[0] || null;
      const section = getModuleWorkspaceSection(moduleId);
      const configureHref = preferredBot && section ? getBotWorkspaceHref(preferredBot.id, section, activeGuild.id) : "";
      const upgradeHref = preferredBot ? getBotWorkspaceHref(preferredBot.id, "premium", activeGuild.id) : "/app/operators";
      const setupHref =
        activeGuild.provisioning.mode === "secondary"
          ? buildFocusedBotsHref(activeGuild.id)
          : buildSetupHref(activeGuild.id);

      return {
        id: moduleId,
        label: module.label,
        metadata,
        configured,
        enabled: enabledEntries.length > 0,
        connectedBotCount: connectedBots.length,
        assignedBotNames: enabledEntries.map(entry => entry.bot.name),
        configureHref,
        upgradeHref,
        setupHref,
        guildHasPremium,
      };
    });
  }, [activeGuild, bootstrap, connectedBots, workspaceMap]);

  const visibleCards = useMemo(() => {
    if (group === "all") {
      return moduleCards;
    }

    return moduleCards.filter(card => getCategoryKey(card.metadata.category) === group);
  }, [group, moduleCards]);

  const moduleStats = useMemo(() => {
    return {
      enabled: moduleCards.filter(card => card.enabled).length,
      configured: moduleCards.filter(card => card.configured).length,
      premium: moduleCards.filter(card => card.metadata.premium).length,
    };
  }, [moduleCards]);

  if (loading) {
    return (
      <GlassPanel>
        <SectionHeader title="Loading modules" description="Preparing guild context and module registry state." />
      </GlassPanel>
    );
  }

  if (error || !bootstrap) {
    return (
      <GlassPanel>
        <EmptyState title="Modules unavailable" description={error || "No dashboard data is available."} />
      </GlassPanel>
    );
  }

  if (!activeGuild) {
    return (
      <>
        <GlassPanel className={styles.serverPickerHero}>
          <SectionHeader
            eyebrow="Modules"
            title="Pick a server before configuring modules"
            description="This is the new module control center. Choose a guild first so every card reflects live bot state, template coverage, and upgrade context."
          />
          <div className={styles.inlineMeta}>
            <span className={styles.chip}>{bootstrap.manageableGuilds.length} visible servers</span>
            <span className={styles.chip}>{bootstrap.manageableGuilds.filter(guild => guild.botIds.length > 0).length} connected</span>
            {selectedGuildId ? (
              <Link href={buildModulesHref(selectedGuildId)} className={styles.buttonSecondary}>
                Resume last server
              </Link>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel className={styles.serverPickerSurface}>
          {bootstrap.manageableGuilds.length ? (
            <div className={`${styles.pluginGrid} ${styles.moduleServerGrid}`}>
              {bootstrap.manageableGuilds.map(guild => (
                <GlassCard key={guild.id} className={styles.moduleServerCard}>
                  <div className={styles.splitHeader}>
                    <div>
                      <h3 className={styles.cardTitle}>{guild.name}</h3>
                      <p className={styles.serverSubline}>
                        {guild.botIds.length ? `${guild.botIds.length} connected bot${guild.botIds.length === 1 ? "" : "s"}` : "Setup required"}
                      </p>
                    </div>
                    <div className={styles.inlineMeta}>
                      <span className={styles.chip}>{guild.isOwner ? "Owner" : "Admin"}</span>
                    </div>
                  </div>
                  <div className={styles.moduleServerActions}>
                    <Link href={buildModulesHref(guild.id)} className={styles.button}>
                      Open modules
                    </Link>
                    <Link href={guild.botIds.length ? buildSetupHref(guild.id) : `/app/setup?guild=${encodeURIComponent(guild.id)}`} className={styles.buttonSecondary}>
                      {guild.botIds.length ? "Setup" : "Connect"}
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <EmptyState title="No manageable servers found" description="Sign in with a Discord account that owns a guild or has Manage Server permission." />
          )}
        </GlassPanel>
      </>
    );
  }

  if (connectedBots.length === 0) {
    return (
      <GlassPanel>
        <SectionHeader eyebrow="Modules" title={`${activeGuild.name} is not connected yet`} description="Finish setup first, then the module center will light up with live state, template coverage, and quick configure actions." />
        <EmptyState
          title="No bot workspace is attached"
          description="This guild is visible, but there is no active bot connection yet."
          action={
            <div className={styles.cardActions}>
              <Link href={`/app/setup?guild=${encodeURIComponent(activeGuild.id)}`} className={styles.button}>
                Continue setup
              </Link>
            </div>
          }
        />
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Modules"
          title={`${activeGuild.name} module control center`}
          description="Choose a module, see whether it is live for this guild, and jump straight into configuration without hunting through the workspace."
          actions={
            <div className={styles.inlineMeta}>
              <Link href={buildSetupHref(activeGuild.id)} className={styles.buttonSecondary}>
                Template setup
              </Link>
            </div>
          }
        />
        <div className={styles.moduleCenterSummary}>
          <div className={styles.moduleCenterStat}>
            <strong>{moduleStats.enabled}</strong>
            <span>Enabled</span>
          </div>
          <div className={styles.moduleCenterStat}>
            <strong>{moduleStats.configured}</strong>
            <span>Configured</span>
          </div>
          <div className={styles.moduleCenterStat}>
            <strong>{connectedBots.length}</strong>
            <span>Connected bots</span>
          </div>
          <div className={styles.moduleCenterStat}>
            <strong>{moduleStats.premium}</strong>
            <span>Premium surfaces</span>
          </div>
        </div>
        <div className={styles.tabRow}>
          <Link href={buildModulesHref(activeGuild.id)} className={`${styles.tab} ${group === "all" ? styles.tabActive : ""}`}>
            All modules
          </Link>
          {moduleCategories.map(category => {
            const categoryKey = getCategoryKey(category);
            return (
              <Link
                key={category}
                href={`${buildModulesHref(activeGuild.id)}?group=${encodeURIComponent(categoryKey)}`}
                className={`${styles.tab} ${group === categoryKey ? styles.tabActive : ""}`}
              >
                {category}
              </Link>
            );
          })}
        </div>
        {!moduleCards.some(card => card.guildHasPremium) ? (
          <div className={styles.moduleWarning}>
            <strong>Premium-aware surfaces are visible now.</strong>
            <span>Upgrade banners and premium actions stay visible even when this guild has no active entitlement yet.</span>
          </div>
        ) : null}
        {workspaceError ? <p className={styles.pageText}>Workspace warning: {workspaceError}</p> : null}
      </GlassPanel>

      <GlassPanel>
        <SectionHeader
          eyebrow="Inventory"
          title={group === "all" ? "All modules" : `${moduleCategories.find(category => getCategoryKey(category) === group) || "Selected"} modules`}
          description={workspaceLoading ? "Refreshing live guild state from connected bot workspaces." : "Every card is derived from the canonical module registry plus live guild/bot state."}
        />
        {visibleCards.length ? (
          <div className={`${styles.pluginGrid} ${styles.moduleCenterGrid}`}>
            {visibleCards.map(card => {
              const Icon = card.metadata.icon;
              const primaryHref = card.enabled && card.configureHref ? card.configureHref : card.setupHref;
              const primaryLabel = card.enabled && card.configureHref ? "Configure" : "Choose template";
              return (
                <GlassCard key={card.id} className={styles.moduleCenterCard}>
                  <div className={styles.moduleCenterHeader}>
                    <div className={styles.splitHeader}>
                      <div className={styles.inlineMeta}>
                        <span className={styles.pluginIconWrap}>
                          <Icon className={styles.pluginIcon} />
                        </span>
                        <div className={styles.moduleCenterCopy}>
                          <h3 className={styles.cardTitle}>{card.label}</h3>
                          <p className={styles.moduleCenterOutcome}>{card.metadata.description}</p>
                        </div>
                      </div>
                      <div className={styles.moduleStatusRow}>
                        <Badge label={card.metadata.category} tone="soft" />
                        {card.metadata.preview ? <Badge label="Preview" tone="beta" /> : null}
                        {card.metadata.premium ? <Badge label="Premium" tone="premium" /> : null}
                        {card.configured ? (
                          <Badge label="Configured" tone="new" />
                        ) : card.enabled ? (
                          <Badge label="Enabled" tone="beta" />
                        ) : (
                          <Badge label="Template required" tone="soft" />
                        )}
                      </div>
                    </div>
                    <p className={styles.moduleCenterOutcome}>{card.metadata.outcome}</p>
                  </div>

                  <div className={styles.inlineMeta}>
                    <span className={styles.chip}>
                      {card.assignedBotNames.length
                        ? card.assignedBotNames.join(", ")
                        : `${card.connectedBotCount} bot${card.connectedBotCount === 1 ? "" : "s"} available`}
                    </span>
                    {card.metadata.runtimeLinked ? <span className={styles.chip}>Runtime linked</span> : null}
                  </div>

                  <div className={styles.cardActions}>
                    <Link href={primaryHref} className={styles.button}>
                      {primaryLabel}
                    </Link>
                    {card.enabled ? (
                      card.metadata.runtimeLinked ? (
                        <Link href="/app/runtime" className={styles.buttonSecondary}>
                          Monitor
                        </Link>
                      ) : (
                        <Link href={card.setupHref} className={styles.buttonSecondary}>
                          Template
                        </Link>
                      )
                    ) : (
                      <Link href={card.metadata.premium ? card.upgradeHref : buildSetupHref(activeGuild.id)} className={styles.buttonSecondary}>
                        {card.metadata.premium ? "Upgrade" : "Setup"}
                      </Link>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No modules in this group" description="Choose another category to keep exploring this server." />
        )}
      </GlassPanel>
    </>
  );
}

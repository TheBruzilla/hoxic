"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { BotWorkspacePayload, ManageableGuildRecord, buildModulesHref, getBotWorkspaceHref, requestJson } from "@/lib/console";
import { buildSetupHref, getAccessLabel } from "@/app/app/setup/setup-helpers";
import styles from "@/components/console/console.module.scss";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "DS";
}

function sortGuilds(guilds: ManageableGuildRecord[]) {
  return [...guilds].sort((left, right) => {
    const connectionDelta = Number(Boolean(right.primaryBotId)) - Number(Boolean(left.primaryBotId));
    if (connectionDelta !== 0) {
      return connectionDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

export default function AppOverviewPage() {
  const { bootstrap, loading, error } = useConsole();
  const [runtimeGuilds, setRuntimeGuilds] = useState<ManageableGuildRecord[]>([]);
  const manageableGuilds = useMemo(
    () => (Array.isArray(bootstrap?.manageableGuilds) ? bootstrap.manageableGuilds : []),
    [bootstrap?.manageableGuilds],
  );
  const bots = bootstrap?.bots;
  const sharedBot = bots?.[0] || null;

  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeGuilds() {
      if (!bootstrap || !bots?.length) {
        setRuntimeGuilds([]);
        return;
      }

      const workspaces = await Promise.all(
        bots.map(async bot => {
          try {
            const payload = await requestJson<BotWorkspacePayload>(`/api/bots/${bot.id}`);
            return {
              botId: bot.id,
              botName: bot.name,
              botRole: bot.role,
              guilds: payload.guilds,
            };
          } catch {
            return {
              botId: bot.id,
              botName: bot.name,
              botRole: bot.role,
              guilds: [],
            };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      const guildMap = new Map<string, ManageableGuildRecord>();

      for (const workspace of workspaces) {
        for (const guild of workspace.guilds) {
          const existing = guildMap.get(guild.id);
          if (existing) {
            existing.memberCount = Math.max(existing.memberCount, guild.memberCount);
            if (!existing.botIds.includes(workspace.botId)) {
              existing.botIds.push(workspace.botId);
              existing.connectedBotNames.push(workspace.botName);
            }
            continue;
          }

          guildMap.set(guild.id, {
            id: guild.id,
            name: guild.name,
            iconUrl: null,
            isOwner: false,
            permissions: "0",
            memberCount: guild.memberCount,
            botIds: [workspace.botId],
            connectedBotNames: [workspace.botName],
            primaryBotId: workspace.botRole === "primary" ? workspace.botId : null,
            provisioning: {
              mode: workspace.botRole === "primary" ? "primary" : "secondary",
              blockedReason: workspace.botRole === "primary" ? "full_suite_already_installed" : "remove_secondary_bots_first",
              primaryBotId: workspace.botRole === "primary" ? workspace.botId : null,
              secondaryBotIds: workspace.botRole === "secondary" ? [workspace.botId] : [],
              remainingFocusedSlots: workspace.botRole === "secondary" ? 3 : 0,
            },
          });
        }
      }

      setRuntimeGuilds(sortGuilds([...guildMap.values()]));
    }

    void loadRuntimeGuilds();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, bots]);

  const visibleGuilds = useMemo(() => {
    const merged = new Map<string, ManageableGuildRecord>();

    for (const guild of runtimeGuilds) {
      merged.set(guild.id, { ...guild });
    }

    for (const guild of manageableGuilds) {
      const existing = merged.get(guild.id);
      if (existing) {
        merged.set(guild.id, {
          ...existing,
          ...guild,
          iconUrl: guild.iconUrl || existing.iconUrl,
          memberCount: Math.max(existing.memberCount, guild.memberCount),
          botIds: existing.botIds.length ? existing.botIds : guild.botIds,
          connectedBotNames: existing.connectedBotNames.length ? existing.connectedBotNames : guild.connectedBotNames,
          primaryBotId: existing.primaryBotId || guild.primaryBotId,
        });
        continue;
      }

      merged.set(guild.id, guild);
    }

    return sortGuilds([...merged.values()]);
  }, [manageableGuilds, runtimeGuilds]);

  const connectedGuilds = visibleGuilds.filter(guild => guild.primaryBotId);

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader title="Loading servers" description="Checking which Discord servers you can manage." />
      </section>
    );
  }

  if (error || !bootstrap) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Servers unavailable" description={error || "No server data could be loaded."} />
      </section>
    );
  }

  return (
    <>
      <section className={`${styles.hero} ${styles.serverPickerHero}`}>
        <SectionHeader
          eyebrow="Servers"
          title="Select the server you want to manage"
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>{visibleGuilds.length} visible servers</span>
          <span className={styles.chip}>{connectedGuilds.length} linked to a bot</span>
          <span className={styles.chip}>{Math.max(visibleGuilds.length - connectedGuilds.length, 0)} awaiting setup</span>
        </div>
      </section>

      <section className={`${styles.pageSurface} ${styles.serverPickerSurface}`}>
        {visibleGuilds.length ? (
          <div className={styles.serverGrid}>
            {visibleGuilds.map(guild => {
              const canManageGuild = manageableGuilds.some(item => item.id === guild.id);
              const accessLabel = canManageGuild ? getAccessLabel(guild.isOwner) : "Connected server";

              return (
              <article key={guild.id} className={`${styles.card} ${styles.serverCard}`}>
                <div
                  className={styles.serverMedia}
                  style={guild.iconUrl ? { backgroundImage: `url(${guild.iconUrl})` } : undefined}
                  aria-hidden="true"
                >
                  <div
                    className={styles.serverAvatar}
                    style={guild.iconUrl ? { backgroundImage: `url(${guild.iconUrl})` } : undefined}
                  >
                    {guild.iconUrl ? null : getInitials(guild.name)}
                  </div>
                </div>

                <div className={styles.serverRow}>
                  <div className={styles.serverCopy}>
                    <div className={styles.serverTitleRow}>
                      <h3 className={styles.cardTitle}>{guild.name}</h3>
                      {guild.primaryBotId ? (
                        <span className={styles.chip}>{guild.connectedBotNames[0] || "Bot linked"}</span>
                      ) : null}
                    </div>
                    <p className={styles.serverSubline}>{accessLabel}</p>
                  </div>

                  <Link
                    href={
                      guild.primaryBotId
                        ? buildModulesHref(guild.id)
                        : `/app/setup?guild=${encodeURIComponent(guild.id)}`
                    }
                    className={guild.primaryBotId ? styles.serverActionPrimary : styles.serverActionSecondary}
                  >
                    {guild.primaryBotId ? "Modules" : sharedBot ? "Invite" : "Register"}
                  </Link>
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No manageable servers found"
            description="Discord did not return any servers where this account is the owner or has administrator permission."
            action={
              <div className={styles.cardActions}>
                <Link href={sharedBot ? getBotWorkspaceHref(sharedBot.id, "overview") : "/app/bots"} className={styles.button}>
                  {sharedBot ? "Open main bot" : "Register main bot"}
                </Link>
              </div>
            }
          />
        )}
      </section>
    </>
  );
}

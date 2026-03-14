"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findMainBotForServer, findServerRecord } from "@/features/flow/server-flow";
import { useBotWorkspace } from "@/features/flow/use-bot-workspace";
import { coerceTemplateKey } from "@/features/flow/server-flow";
import { getGuildTemplateKey } from "@/lib/console";
import styles from "@/components/console/console.module.scss";

export default function InviteMainBotPage() {
  const params = useParams<{ serverId: string }>();
  const searchParams = useSearchParams();
  const serverId = String(params?.serverId || "");
  const selectedTemplateFromQuery = coerceTemplateKey(searchParams.get("template"));
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);
  const mainBot = findMainBotForServer(bootstrap, server);
  const workspaceQuery = useBotWorkspace(mainBot?.id || "");

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Invite flow unavailable" description="Server context could not be loaded." />
      </GlassPanel>
    );
  }

  const isBotPresent = Boolean(mainBot);
  const templateFromWorkspace = (() => {
    if (!mainBot || !workspaceQuery.payload) {
      return "";
    }
    const guildConfig = workspaceQuery.payload.guildConfigs.find(config => config.guildId === server.id);
    return coerceTemplateKey(getGuildTemplateKey(guildConfig?.overrides));
  })();
  const effectiveTemplateKey = selectedTemplateFromQuery || templateFromWorkspace;
  const isProvisioned = Boolean(effectiveTemplateKey);
  const hubHref = `/app/servers/${encodeURIComponent(serverId)}`;
  const templateLibraryHref = `/app/servers/${encodeURIComponent(serverId)}/main/templates`;
  const workspaceHref = `/app/servers/${encodeURIComponent(serverId)}/main/workspace?template=${encodeURIComponent(effectiveTemplateKey)}`;
  const dormantHref = effectiveTemplateKey
    ? `/app/servers/${encodeURIComponent(serverId)}/main/templates/${encodeURIComponent(effectiveTemplateKey)}/dormant`
    : templateLibraryHref;

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Invite Main Bot"
          title={`Invite branch for ${server.name}`}
          description="Invite does not imply active state. Template provisioning determines active workspace access."
        />
      </GlassPanel>
      <section className={styles.cardGrid}>
        <GlassCard>
          <div className={styles.eyebrow}>Bot Present in Server</div>
          <h2 className={styles.cardTitle}>{isBotPresent ? "Yes" : "No"}</h2>
          <p className={styles.cardText}>
            {isBotPresent
              ? `${mainBot?.name || "Main bot"} is visible for this server.`
              : "Main bot has not been linked or invited yet."}
          </p>
          <div className={styles.cardActions}>
            {!isBotPresent ? <Link href={templateLibraryHref} className={styles.button}>Open Template Library</Link> : null}
            <Link href={hubHref} className={styles.buttonSecondary}>Back to Overview Hub</Link>
          </div>
        </GlassCard>
        {isBotPresent ? (
          <GlassCard>
            <div className={styles.eyebrow}>Template Provisioned?</div>
            <h2 className={styles.cardTitle}>{isProvisioned ? "Yes" : "No"}</h2>
            <p className={styles.cardText}>
              {isProvisioned
                ? `Template ${effectiveTemplateKey} is provisioned. Workspace is active.`
                : "Bot remains dormant until template provisioning is completed."}
            </p>
            <div className={styles.cardActions}>
              {isProvisioned ? (
                <Link href={workspaceHref} className={styles.button}>Open Main Workspace</Link>
              ) : (
                <Link href={dormantHref} className={styles.button}>View Dormant State</Link>
              )}
              <Link href={templateLibraryHref} className={styles.buttonSecondary}>Template Library</Link>
            </div>
          </GlassCard>
        ) : null}
      </section>
    </>
  );
}

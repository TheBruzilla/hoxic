"use client";

import { useParams } from "next/navigation";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findFocusedBotsForServer, findMainBotForServer, findServerRecord, formatServerAccessLabel, summarizeProvisioningMode } from "@/features/flow/server-flow";
import styles from "@/components/console/console.module.scss";

export default function ServerDetailsPage() {
  const params = useParams<{ serverId: string }>();
  const serverId = String(params?.serverId || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Server details unavailable" description="Server context was not found." />
      </GlassPanel>
    );
  }

  const mainBot = findMainBotForServer(bootstrap, server);
  const focusedBots = findFocusedBotsForServer(bootstrap, server);

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Server Details"
        title={server.name}
        description="Server detail pages stay in no-sidebar flow shell."
      />
      <div className={styles.list}>
        <div className={styles.callout}>Server ID: {server.id}</div>
        <div className={styles.callout}>Access: {formatServerAccessLabel(server)}</div>
        <div className={styles.callout}>Provisioning: {summarizeProvisioningMode(server)}</div>
        <div className={styles.callout}>Main bot: {mainBot?.name || "None linked"}</div>
        <div className={styles.callout}>
          Focused bots: {focusedBots.length ? focusedBots.map(bot => bot.name).join(", ") : "None linked"}
        </div>
      </div>
    </GlassPanel>
  );
}

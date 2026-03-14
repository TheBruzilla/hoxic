"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findFocusedBotsForServer, findMainBotForServer, findServerRecord, formatServerAccessLabel, summarizeProvisioningMode } from "@/features/flow/server-flow";
import styles from "@/components/console/console.module.scss";

export default function ServerOverviewHubPage() {
  const params = useParams<{ serverId: string }>();
  const serverId = String(params?.serverId || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState
          title="Server not found"
          description="The requested server is not available in the current manageable guild directory."
        />
      </GlassPanel>
    );
  }

  const mainBot = findMainBotForServer(bootstrap, server);
  const focusedBots = findFocusedBotsForServer(bootstrap, server);

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Server Overview Hub"
          title={server.name}
          description="No sidebar appears in the hub. Main and focused bot flows are explicitly separated."
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>{formatServerAccessLabel(server)}</span>
          <span className={styles.chip}>{summarizeProvisioningMode(server)}</span>
          <span className={styles.chip}>{focusedBots.length}/4 focused slots linked</span>
        </div>
      </GlassPanel>
      <section className={styles.cardGrid}>
        <GlassCard>
          <div className={styles.eyebrow}>Main Bot</div>
          <h2 className={styles.cardTitle}>{mainBot?.name || "No main bot linked"}</h2>
          <p className={styles.cardText}>Template library and workspace for the main bot scope.</p>
          <div className={styles.cardActions}>
            <Link href={`/app/servers/${encodeURIComponent(serverId)}/main/templates`} className={styles.button}>
              Open Main Flow
            </Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.eyebrow}>Focused Bots</div>
          <h2 className={styles.cardTitle}>Focused Slot Board</h2>
          <p className={styles.cardText}>Choose slot 1-4, link custom bots, and provision focused templates.</p>
          <div className={styles.cardActions}>
            <Link href={`/app/servers/${encodeURIComponent(serverId)}/focused`} className={styles.button}>
              Open Focused Board
            </Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.eyebrow}>Runtime / Health</div>
          <h2 className={styles.cardTitle}>Runtime and telemetry</h2>
          <p className={styles.cardText}>Operational status for this server context.</p>
          <div className={styles.cardActions}>
            <Link href={`/app/servers/${encodeURIComponent(serverId)}/runtime`} className={styles.buttonSecondary}>
              Runtime / Health
            </Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.eyebrow}>Server Details</div>
          <h2 className={styles.cardTitle}>Ownership and provisioning details</h2>
          <p className={styles.cardText}>Audit server-level metadata and provisioning state.</p>
          <div className={styles.cardActions}>
            <Link href={`/app/servers/${encodeURIComponent(serverId)}/details`} className={styles.buttonSecondary}>
              Server Details
            </Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.eyebrow}>Invite Main Bot</div>
          <h2 className={styles.cardTitle}>Invite does not mean active</h2>
          <p className={styles.cardText}>Use the invite branch to determine provisioned versus dormant state.</p>
          <div className={styles.cardActions}>
            <Link href={`/app/servers/${encodeURIComponent(serverId)}/invite-main`} className={styles.buttonSecondary}>
              Invite Main Bot
            </Link>
          </div>
        </GlassCard>
      </section>
    </>
  );
}

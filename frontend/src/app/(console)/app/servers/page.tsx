"use client";

import Link from "next/link";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import styles from "@/components/console/console.module.scss";
import flowStyles from "@/features/flow/rewrite-flow.module.scss";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "SV";
}

export default function ServerDirectoryPage() {
  const { bootstrap, loading, error } = useConsole();

  if (loading || !bootstrap) {
    return (
      <GlassPanel>
        <SectionHeader
          eyebrow="Server Directory"
          title="Loading manageable servers"
          description="Reading bootstrap guild ownership and provisioning summaries."
        />
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <EmptyState title="Server directory unavailable" description={error} />
      </GlassPanel>
    );
  }

  const sortedServers = [...bootstrap.manageableGuilds].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Server Directory"
          title="Select a server"
          description="No sidebar is shown here by contract. Server-level flows are controlled from the overview hub."
        />
        <div className={flowStyles.summaryRow}>
          <span className={flowStyles.summaryChip}>{sortedServers.length} visible</span>
          <span className={flowStyles.summaryChip}>No-sidebar flow shell</span>
          <span className={flowStyles.summaryChip}>Overview-hub owned</span>
        </div>
      </GlassPanel>
      {sortedServers.length === 0 ? (
        <GlassPanel>
          <EmptyState
            title="No servers returned"
            description="Your Discord account has no manageable guilds in this session."
          />
        </GlassPanel>
      ) : (
        <section className={styles.serverGrid}>
          {sortedServers.map(server => (
            <GlassCard key={server.id}>
              <div className={styles.splitHeader}>
                <div>
                  <div className={styles.eyebrow}>Server</div>
                  <h2 className={styles.cardTitle}>{server.name}</h2>
                </div>
                <span className={styles.chip}>{getInitials(server.name)}</span>
              </div>
              <div className={flowStyles.pillRow}>
                <span className={styles.chip}>{server.provisioning.mode}</span>
                <span className={styles.chip}>{server.botIds.length} bot links</span>
              </div>
              <p className={styles.cardText}>
                {server.isOwner ? "Owner access" : "Administrator access"} · Provisioning mode: {server.provisioning.mode}
              </p>
              <div className={styles.cardActions}>
                <Link href={`/app/servers/${encodeURIComponent(server.id)}`} className={styles.button}>
                  Open Overview Hub
                </Link>
              </div>
            </GlassCard>
          ))}
        </section>
      )}
    </>
  );
}

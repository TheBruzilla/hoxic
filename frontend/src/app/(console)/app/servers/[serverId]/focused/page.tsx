"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findFocusedBotsForServer, findServerRecord } from "@/features/flow/server-flow";
import { getCanonicalTemplate } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function FocusedSlotBoardPage() {
  const params = useParams<{ serverId: string }>();
  const serverId = String(params?.serverId || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Focused slot board unavailable" description="Server context was not found." />
      </GlassPanel>
    );
  }

  const focusedBots = findFocusedBotsForServer(bootstrap, server);

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Focused Slot Board"
          title={`Focused slots for ${server.name}`}
          description="No sidebar appears here. Slot setup remains a dedicated pre-workspace flow."
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>{focusedBots.length}/4 linked</span>
          <span className={styles.chip}>{Math.max(0, 4 - focusedBots.length)} slots open</span>
        </div>
      </GlassPanel>
      <section className={styles.cardGrid}>
        {Array.from({ length: 4 }, (_, index) => {
          const slot = index + 1;
          const bot = focusedBots[index] || null;
          const template = bot ? getCanonicalTemplate(bot.templateKey) : null;
          return (
            <GlassCard key={`focused-slot-${slot}`}>
              <div className={styles.eyebrow}>Slot {slot}</div>
              <h2 className={styles.cardTitle}>{bot?.name || "Open slot"}</h2>
              <p className={styles.cardText}>
                {bot
                  ? `Linked bot · template ${template?.name || bot.templateKey}`
                  : "Link custom bot, choose template, then provision to activate."}
              </p>
              <div className={styles.cardActions}>
                {bot ? (
                  <Link
                    href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/workspace?template=${encodeURIComponent(bot.templateKey)}`}
                    className={styles.button}
                  >
                    Open Workspace
                  </Link>
                ) : (
                  <Link
                    href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/link`}
                    className={styles.button}
                  >
                    Configure Slot
                  </Link>
                )}
              </div>
            </GlassCard>
          );
        })}
      </section>
    </>
  );
}

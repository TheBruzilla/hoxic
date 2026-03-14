"use client";

import { useParams } from "next/navigation";
import { EmptyState, GlassPanel, MetricCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findServerRecord } from "@/features/flow/server-flow";
import { formatBytes, formatPercent } from "@/lib/console";
import styles from "@/components/console/console.module.scss";

export default function ServerRuntimePage() {
  const params = useParams<{ serverId: string }>();
  const serverId = String(params?.serverId || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Runtime unavailable" description="Server context is missing for runtime rendering." />
      </GlassPanel>
    );
  }

  const runtime = bootstrap.runtime;

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Runtime / Health"
        title={`${server.name} runtime context`}
        description="No sidebar is used on runtime health pages."
      />
      <div className={styles.statsGrid}>
        <MetricCard
          label="Fleet CPU"
          value={formatPercent(runtime.fleet.totalBotCpuPercent)}
          meta={`running bots ${runtime.fleet.runningCount}/${runtime.fleet.botCount}`}
        />
        <MetricCard
          label="Fleet memory"
          value={formatBytes(runtime.fleet.totalBotRssBytes)}
          meta={`host used ${formatBytes(runtime.host.usedMemoryBytes)}`}
        />
        <MetricCard
          label="Guild visibility"
          value={String(runtime.fleet.totalGuilds)}
          meta={`users ${runtime.fleet.totalUsers}`}
        />
        <MetricCard
          label="Control plane RSS"
          value={formatBytes(runtime.controlPlane.rssBytes)}
          meta={`cpu cores ${runtime.host.cpuCount}`}
        />
      </div>
    </GlassPanel>
  );
}

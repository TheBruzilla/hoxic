"use client";

import { EmptyState, MetricCard, SectionHeader, StatusBadge } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { formatBytes, formatDuration, formatPercent, getHeartbeat, getBotRuntimeMetric } from "@/lib/console";
import styles from "@/components/console/console.module.scss";

export default function RuntimePage() {
  const { bootstrap, loading, error, refresh } = useConsole();

  if (loading) {
    return <section className={styles.pageSurface}><SectionHeader title="Loading runtime" description="Collecting control-plane and worker telemetry." /></section>;
  }

  if (error || !bootstrap) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Runtime unavailable" description={error || "No runtime data is available."} />
      </section>
    );
  }

  const runtime = bootstrap.runtime;
  const rows = [...bootstrap.bots]
    .map(bot => {
      const heartbeat = getHeartbeat(bootstrap, bot.id);
      return {
        bot,
        heartbeat,
        cpu: getBotRuntimeMetric(heartbeat, "cpuPercent"),
        rss: getBotRuntimeMetric(heartbeat, "rssBytes"),
        heap: getBotRuntimeMetric(heartbeat, "heapUsedBytes"),
        reminders: getBotRuntimeMetric(heartbeat, "pendingReminders"),
        threads: getBotRuntimeMetric(heartbeat, "openThreads"),
        feeds: getBotRuntimeMetric(heartbeat, "feedSubscriptions"),
      };
    })
    .sort((left, right) => right.rss - left.rss || right.cpu - left.cpu);

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Runtime"
          title="Keep operations monitoring separate"
          description="This page is only for telemetry, machine pressure, and worker visibility."
          actions={
            <button type="button" className={styles.buttonSecondary} onClick={() => void refresh()}>
              Refresh runtime
            </button>
          }
        />
        <div className={styles.statsGrid}>
          <MetricCard label="Host memory" value={formatBytes(runtime.host.usedMemoryBytes)} meta={`of ${formatBytes(runtime.host.totalMemoryBytes)} · ${runtime.host.cpuCount} CPU`} />
          <MetricCard label="Control plane" value={formatBytes(runtime.controlPlane.rssBytes)} meta={`uptime ${formatDuration(runtime.controlPlane.uptimeMs)}`} />
          <MetricCard label="Fleet CPU" value={formatPercent(runtime.fleet.totalBotCpuPercent)} meta={`top CPU ${runtime.fleet.heaviestByCpuBotId || "n/a"}`} />
          <MetricCard label="Fleet memory" value={formatBytes(runtime.fleet.totalBotRssBytes)} meta={`top RAM ${runtime.fleet.heaviestByMemoryBotId || "n/a"}`} />
        </div>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Worker table"
          title="Per-bot runtime view"
          description="Use this page when you need the operational view, not when you are editing bot settings."
        />
        {rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bot</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>RSS</th>
                  <th>Heap</th>
                  <th>Guilds</th>
                  <th>Users</th>
                  <th>Reminders</th>
                  <th>Threads</th>
                  <th>Feeds</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.bot.id}>
                    <td>
                      <strong>{row.bot.name}</strong>
                      <div className={styles.muted}>{row.bot.templateKey}</div>
                    </td>
                    <td>
                      <StatusBadge status={row.heartbeat?.status || row.bot.status} />
                    </td>
                    <td>{formatPercent(row.cpu)}</td>
                    <td>{formatBytes(row.rss)}</td>
                    <td>{formatBytes(row.heap)}</td>
                    <td>{row.heartbeat?.guildCount || 0}</td>
                    <td>{row.heartbeat?.userCount || 0}</td>
                    <td>{row.reminders}</td>
                    <td>{row.threads}</td>
                    <td>{row.feeds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No workers yet" description="Create a bot first, then this page will show live worker telemetry." />
        )}
      </section>
    </>
  );
}

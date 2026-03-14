"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState, MetricCard, SectionHeader, StatusBadge } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { OpsStatsPayload, formatBytes, formatDuration, formatPercent, getHeartbeat, getBotRuntimeMetric, requestJson } from "@/lib/console";
import styles from "@/components/console/console.module.scss";

function formatLatencyMs(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return `${Math.round(value)} ms`;
}

export default function RuntimePage() {
  const { bootstrap, loading, error, refresh } = useConsole();
  const [opsStats, setOpsStats] = useState<OpsStatsPayload | null>(null);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);

  const loadOpsStats = useCallback(async () => {
    setOpsLoading(true);
    try {
      const payload = await requestJson<OpsStatsPayload>("/api/ops/stats");
      setOpsStats(payload);
      setOpsError(null);
    } catch (err) {
      setOpsStats(null);
      setOpsError(err instanceof Error ? err.message : "Unable to load ops shard metrics.");
    } finally {
      setOpsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && bootstrap) {
      void loadOpsStats();
    }
  }, [bootstrap, loading, loadOpsStats]);

  const handleRefreshRuntime = useCallback(async () => {
    await refresh();
    await loadOpsStats();
  }, [refresh, loadOpsStats]);

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
  const opsAlerts = Array.isArray(opsStats?.alerts) ? opsStats.alerts : [];

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Runtime"
          title="Keep operations monitoring separate"
          description="This page is only for telemetry, machine pressure, and worker visibility."
          actions={
            <button type="button" className={styles.buttonSecondary} onClick={() => void handleRefreshRuntime()}>
              Refresh runtime
            </button>
          }
        />
        <div className={styles.statsGrid}>
          <MetricCard label="Host memory" value={formatBytes(runtime.host.usedMemoryBytes)} meta={`of ${formatBytes(runtime.host.totalMemoryBytes)} · ${runtime.host.cpuCount} CPU`} />
          <MetricCard label="Control plane" value={formatBytes(runtime.controlPlane.rssBytes)} meta={`uptime ${formatDuration(runtime.controlPlane.uptimeMs)}`} />
          <MetricCard label="Fleet CPU" value={formatPercent(runtime.fleet.totalBotCpuPercent)} meta={`top CPU ${runtime.fleet.heaviestByCpuBotId || "n/a"}`} />
          <MetricCard label="Fleet memory" value={formatBytes(runtime.fleet.totalBotRssBytes)} meta={`top RAM ${runtime.fleet.heaviestByMemoryBotId || "n/a"}`} />
          <MetricCard
            label="Ops shards"
            value={opsStats?.enabled ? String(opsStats.totals.shardCount) : opsLoading ? "…" : "Disabled"}
            meta={opsStats?.enabled ? `${opsStats.totals.readyShardCount} ready · ${opsStats.totals.staleShardCount} stale` : "Enable use_ops_api for shard-level telemetry."}
          />
          <MetricCard
            label="Shard ping"
            value={opsStats?.enabled ? formatLatencyMs(opsStats.totals.avgPingMs) : "n/a"}
            meta={opsStats?.enabled ? `max ${formatLatencyMs(opsStats.totals.maxPingMs)}` : "No shard ping data yet."}
          />
        </div>
        {opsError ? <p className={styles.pageText}>Ops stats warning: {opsError}</p> : null}
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

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Ops shards"
          title="Shard heartbeat telemetry"
          description="Shard-level metrics are sourced from the gateway heartbeat ingest pipeline."
        />
        {opsLoading && !opsStats ? (
          <EmptyState title="Loading shard metrics" description="Collecting shard heartbeat snapshots from control-plane ops ingest." />
        ) : opsStats?.enabled ? (
          opsStats.shards.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bot</th>
                    <th>Shard</th>
                    <th>Status</th>
                    <th>Ping</th>
                    <th>Guilds</th>
                    <th>Users</th>
                    <th>Heartbeat</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {opsStats.shards.map(shard => (
                    <tr key={`${shard.botInstanceId}:${shard.shardId}`}>
                      <td>
                        <strong>{shard.botName}</strong>
                        <div className={styles.muted}>{shard.botInstanceId}</div>
                      </td>
                      <td>{shard.shardId}</td>
                      <td>
                        {shard.status}
                        {shard.stale ? <div className={styles.muted}>stale</div> : null}
                      </td>
                      <td>{formatLatencyMs(shard.pingMs)}</td>
                      <td>{shard.guildCount}</td>
                      <td>{shard.userCount}</td>
                      <td>{new Date(shard.heartbeatAt).toLocaleTimeString()}</td>
                      <td className={styles.muted}>{shard.gatewayInstanceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No shard snapshots yet" description="Ops API is enabled but no shard heartbeats have been ingested yet." />
          )
        ) : (
          <EmptyState title="Ops API disabled" description="Shard telemetry widgets will activate when use_ops_api is enabled." />
        )}
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Ops alerts"
          title="Alert conditions"
          description="Alerts are evaluated from shard health and latency with conservative, low-noise thresholds."
        />
        {!opsStats?.enabled ? (
          <EmptyState title="Ops API disabled" description="Enable use_ops_api to activate alert evaluation." />
        ) : opsAlerts.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Summary</th>
                  <th>Observed</th>
                  <th>Threshold</th>
                  <th>Scope</th>
                  <th>Runbook</th>
                </tr>
              </thead>
              <tbody>
                {opsAlerts.map(alert => (
                  <tr key={alert.key}>
                    <td>
                      <StatusBadge status={alert.severity} />
                    </td>
                    <td>
                      <strong>{alert.summary}</strong>
                      <div className={styles.muted}>{alert.code}</div>
                    </td>
                    <td>{alert.observed}</td>
                    <td>{alert.threshold}</td>
                    <td>{alert.botName || "Fleet"}</td>
                    <td className={styles.muted}>{alert.runbookId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No active alerts" description="Current shard health is within configured alert thresholds." />
        )}
      </section>
    </>
  );
}

import assert from 'node:assert/strict';
import test from 'node:test';

import type { OpsStatsSnapshot } from './ops-stats-read.service';

import { OpsAlertEvaluatorService } from './ops-alert-evaluator.service';

function sampleSnapshot(overrides: Partial<OpsStatsSnapshot> = {}): OpsStatsSnapshot {
  return {
    enabled: true,
    generatedAt: 1_000,
    staleAfterMs: 45_000,
    totals: {
      shardCount: 2,
      botCount: 1,
      readyShardCount: 2,
      staleShardCount: 0,
      avgPingMs: 120,
      maxPingMs: 180,
      guildCount: 20,
      userCount: 200,
    },
    bots: [
      {
        botInstanceId: 'bot-1',
        botName: 'Alpha',
        shardCount: 2,
        readyShardCount: 2,
        avgPingMs: 120,
        maxPingMs: 180,
        guildCount: 20,
        userCount: 200,
        latestHeartbeatAt: 900,
        staleShardCount: 0,
      },
    ],
    shards: [
      {
        gatewayInstanceId: 'gateway-1',
        botInstanceId: 'bot-1',
        botName: 'Alpha',
        shardId: 0,
        status: 'ready',
        pingMs: 110,
        guildCount: 10,
        userCount: 100,
        heartbeatAt: 900,
        updatedAt: 901,
        stale: false,
      },
      {
        gatewayInstanceId: 'gateway-1',
        botInstanceId: 'bot-1',
        botName: 'Alpha',
        shardId: 1,
        status: 'ready',
        pingMs: 130,
        guildCount: 10,
        userCount: 100,
        heartbeatAt: 900,
        updatedAt: 901,
        stale: false,
      },
    ],
    ...overrides,
  };
}

test('OpsAlertEvaluatorService returns no alerts for healthy snapshot', () => {
  const service = new OpsAlertEvaluatorService();
  const alerts = service.evaluate(sampleSnapshot());
  assert.equal(alerts.length, 0);
});

test('OpsAlertEvaluatorService emits stale and no-ready alerts', () => {
  const service = new OpsAlertEvaluatorService();
  const alerts = service.evaluate(
    sampleSnapshot({
      totals: {
        shardCount: 4,
        botCount: 1,
        readyShardCount: 0,
        staleShardCount: 3,
        avgPingMs: 250,
        maxPingMs: 400,
        guildCount: 20,
        userCount: 200,
      },
      bots: [
        {
          botInstanceId: 'bot-1',
          botName: 'Alpha',
          shardCount: 4,
          readyShardCount: 0,
          avgPingMs: 250,
          maxPingMs: 400,
          guildCount: 20,
          userCount: 200,
          latestHeartbeatAt: 500,
          staleShardCount: 3,
        },
      ],
    }),
  );

  assert.ok(alerts.some(alert => alert.code === 'stale-shards'));
  assert.ok(alerts.some(alert => alert.code === 'no-ready-shards'));
});

test('OpsAlertEvaluatorService emits ping alerts when thresholds are crossed', () => {
  const service = new OpsAlertEvaluatorService();
  const alerts = service.evaluate(
    sampleSnapshot({
      totals: {
        shardCount: 3,
        botCount: 1,
        readyShardCount: 3,
        staleShardCount: 0,
        avgPingMs: 380,
        maxPingMs: 1200,
        guildCount: 20,
        userCount: 200,
      },
    }),
  );

  assert.ok(alerts.some(alert => alert.code === 'high-avg-ping'));
  assert.ok(alerts.some(alert => alert.code === 'high-max-ping' && alert.severity === 'critical'));
});

test('OpsAlertEvaluatorService respects maxAlerts and prioritizes critical alerts', () => {
  const service = new OpsAlertEvaluatorService({ maxAlerts: 2 });
  const alerts = service.evaluate(
    sampleSnapshot({
      totals: {
        shardCount: 4,
        botCount: 1,
        readyShardCount: 0,
        staleShardCount: 3,
        avgPingMs: 800,
        maxPingMs: 1_500,
        guildCount: 20,
        userCount: 200,
      },
      bots: [
        {
          botInstanceId: 'bot-1',
          botName: 'Alpha',
          shardCount: 4,
          readyShardCount: 0,
          avgPingMs: 800,
          maxPingMs: 1_500,
          guildCount: 20,
          userCount: 200,
          latestHeartbeatAt: 500,
          staleShardCount: 4,
        },
      ],
    }),
  );

  assert.equal(alerts.length, 2);
  assert.ok(alerts.every(alert => alert.severity === 'critical'));
  assert.equal(alerts.some(alert => alert.code === 'high-avg-ping'), false);
});

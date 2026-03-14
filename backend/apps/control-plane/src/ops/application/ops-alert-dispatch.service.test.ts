import assert from 'node:assert/strict';
import test from 'node:test';

import type { OpsAlertRecord } from './ops-alert-evaluator.service';

import { OpsAlertDispatchService } from './ops-alert-dispatch.service';

function sampleAlert(overrides: Partial<OpsAlertRecord> = {}): OpsAlertRecord {
  return {
    key: 'ops:stale-shards',
    code: 'stale-shards',
    severity: 'warning',
    summary: 'Shard heartbeats are stale',
    observed: '1/2 stale',
    threshold: 'critical at >= 50% stale',
    runbookId: 'RB-OPS-001',
    runbookPath: 'docs/operations/OPS_ALERT_RUNBOOKS.md#rb-ops-001',
    botInstanceId: null,
    botName: null,
    generatedAt: Date.now(),
    ...overrides,
  };
}

test('OpsAlertDispatchService respects cooldown for repeat alerts', async () => {
  const service = new OpsAlertDispatchService(60_000);
  const emitted: OpsAlertRecord[] = [];

  const first = await service.dispatch([sampleAlert()], alert => {
    emitted.push(alert);
  });
  const second = await service.dispatch([sampleAlert()], alert => {
    emitted.push(alert);
  });

  assert.equal(first.length, 1);
  assert.equal(second.length, 0);
  assert.equal(emitted.length, 1);
});

test('OpsAlertDispatchService allows escalation during cooldown', async () => {
  const service = new OpsAlertDispatchService(60_000);
  const emitted: OpsAlertRecord[] = [];

  await service.dispatch([sampleAlert({ severity: 'warning' })], alert => {
    emitted.push(alert);
  });

  const escalation = await service.dispatch([sampleAlert({ severity: 'critical' })], alert => {
    emitted.push(alert);
  });

  assert.equal(escalation.length, 1);
  assert.equal(emitted.length, 2);
  assert.equal(emitted[1]?.severity, 'critical');
});

test('OpsAlertDispatchService re-emits after cooldown window elapses', async () => {
  const service = new OpsAlertDispatchService(20);
  const emitted: OpsAlertRecord[] = [];

  const first = await service.dispatch([sampleAlert()], alert => {
    emitted.push(alert);
  });
  await new Promise(resolve => setTimeout(resolve, 30));
  const second = await service.dispatch([sampleAlert()], alert => {
    emitted.push(alert);
  });

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(emitted.length, 2);
});

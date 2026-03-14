import assert from 'node:assert/strict';
import test from 'node:test';

import { createInMemoryRoleSyncQueueRepository } from '../infrastructure/queue/in-memory-role-sync-queue.repository';
import { RoleSyncQueueDispatchService } from './role-sync-queue-dispatch.service';

test('RoleSyncQueueDispatchService skips dispatch when queue flag is disabled', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  const service = new RoleSyncQueueDispatchService({ useRoleSyncQueue: false }, queue);

  const result = await service.dispatch({
    guildId: 'guild-1',
    userId: 'user-1',
    roleIds: ['role-1'],
    operation: 'add',
    source: 'test',
  });

  assert.equal(result.status, 'skipped');
  assert.equal(result.reason, 'flag_disabled');
  assert.equal(queue.countPending(), 0);
});

test('RoleSyncQueueDispatchService rejects invalid payloads before enqueueing', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  const service = new RoleSyncQueueDispatchService({ useRoleSyncQueue: true }, queue);

  const result = await service.dispatch({
    guildId: 'guild-1',
    userId: '',
    roleIds: [''],
    operation: 'add',
    source: 'test',
  });

  assert.equal(result.status, 'invalid');
  assert.equal(result.reason, 'missing_required_fields');
  assert.equal(result.job, null);
  assert.equal(queue.countPending(), 0);
});

test('RoleSyncQueueDispatchService enqueues normalized jobs with generated correlation IDs', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  const service = new RoleSyncQueueDispatchService({ useRoleSyncQueue: true }, queue);

  const result = await service.dispatch({
    guildId: 'guild-1',
    userId: 'user-1',
    roleIds: ['role-a', '', 'role-a', 'role-b'],
    operation: 'remove',
    source: 'dashboard',
  });

  assert.equal(result.status, 'queued');
  assert.equal(result.reason, null);
  assert.ok(result.job);
  assert.deepEqual(result.job?.roleIds, ['role-a', 'role-b']);
  assert.ok(result.job?.correlationId.startsWith('corr_'));
  assert.equal(queue.countPending(), 1);

  const dequeued = await queue.dequeueReady(Date.now() + 1, 10);
  assert.equal(dequeued.length, 1);
  assert.deepEqual(dequeued[0]?.roleIds, ['role-a', 'role-b']);
  assert.equal(dequeued[0]?.operation, 'remove');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import type { Client } from 'discord.js';

import type { RoleSyncQueueJob } from '@platform/shared';

import { createInMemoryRoleSyncQueueRepository } from '../infrastructure/queue/in-memory-role-sync-queue.repository';
import { RoleSyncQueueProcessor } from './role-sync-queue-processor';

function createJob(partial: Partial<RoleSyncQueueJob>): RoleSyncQueueJob {
  return {
    id: 'job-1',
    guildId: 'guild-1',
    userId: 'user-1',
    roleIds: ['role-1'],
    operation: 'add',
    correlationId: 'corr-1',
    retryCount: 0,
    maxRetries: 3,
    scheduledAt: 0,
    source: 'test',
    createdAt: 0,
    updatedAt: 0,
    lastError: null,
    ...partial,
  };
}

test('RoleSyncQueueProcessor does nothing when queue flag is disabled', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  await queue.enqueue(createJob({ id: 'job-disabled' }));

  const processor = new RoleSyncQueueProcessor(
    { useRoleSyncQueue: false },
    queue,
    {
      async applyQueuedJob() {
        throw new Error('should not execute');
      },
    } as unknown as import('./role-sync-mutation.service').RoleSyncMutationService,
  );

  const result = await processor.processTick({} as Client);

  assert.deepEqual(result, {
    processed: 0,
    succeeded: 0,
    retried: 0,
    deadLettered: 0,
  });
  assert.equal(queue.countPending(), 1);
});

test('RoleSyncQueueProcessor honors batch size and supports no-op success', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  await queue.enqueue(createJob({ id: 'job-1', roleIds: [] }));
  await queue.enqueue(createJob({ id: 'job-2', roleIds: ['role-2'] }));
  await queue.enqueue(createJob({ id: 'job-3', roleIds: ['role-3'] }));

  const processor = new RoleSyncQueueProcessor(
    { useRoleSyncQueue: true },
    queue,
    {
      async applyQueuedJob(_client: Client, job: RoleSyncQueueJob) {
        if (job.roleIds.length === 0) {
          return { status: 'no-op' as const, mutatedRoleIds: [] };
        }
        return { status: 'mutated' as const, mutatedRoleIds: [...job.roleIds] };
      },
    } as unknown as import('./role-sync-mutation.service').RoleSyncMutationService,
    {
      batchSize: 2,
    },
  );

  const result = await processor.processTick({} as Client);

  assert.equal(result.processed, 2);
  assert.equal(result.succeeded, 2);
  assert.equal(result.retried, 0);
  assert.equal(result.deadLettered, 0);
  assert.equal(queue.countPending(), 1);
});

test('RoleSyncQueueProcessor schedules retries with capped exponential backoff', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  await queue.enqueue(
    createJob({
      id: 'job-retry',
      retryCount: 3,
      maxRetries: 5,
    }),
  );

  const events: string[] = [];
  const processor = new RoleSyncQueueProcessor(
    { useRoleSyncQueue: true },
    queue,
    {
      async applyQueuedJob() {
        throw new Error('transient failure');
      },
    } as unknown as import('./role-sync-mutation.service').RoleSyncMutationService,
    {
      baseBackoffMs: 500,
      maxBackoffMs: 1000,
      onLifecycleEvent: event => events.push(event.type),
    },
  );

  const before = Date.now();
  const result = await processor.processTick({} as Client);
  const after = Date.now();

  assert.equal(result.processed, 1);
  assert.equal(result.succeeded, 0);
  assert.equal(result.retried, 1);
  assert.equal(result.deadLettered, 0);
  assert.ok(events.includes('retry_scheduled'));

  const retried = await queue.dequeueReady(after + 2_000, 10);
  assert.equal(retried.length, 1);
  assert.equal(retried[0]?.retryCount, 4);
  assert.equal(retried[0]?.lastError, 'transient failure');
  assert.ok(typeof retried[0]?.scheduledAt === 'number');
  assert.ok((retried[0]?.scheduledAt ?? 0) >= before + 1_000);
  assert.ok((retried[0]?.scheduledAt ?? 0) <= after + 1_250);
});

test('RoleSyncQueueProcessor dead-letters jobs that exceed retry budget', async () => {
  const queue = createInMemoryRoleSyncQueueRepository();
  await queue.enqueue(
    createJob({
      id: 'job-dead-letter',
      retryCount: 2,
      maxRetries: 2,
    }),
  );

  const events: string[] = [];
  const processor = new RoleSyncQueueProcessor(
    { useRoleSyncQueue: true },
    queue,
    {
      async applyQueuedJob() {
        throw new Error('permanent failure');
      },
    } as unknown as import('./role-sync-mutation.service').RoleSyncMutationService,
    {
      onLifecycleEvent: event => events.push(event.type),
    },
  );

  const result = await processor.processTick({} as Client);

  assert.equal(result.processed, 1);
  assert.equal(result.succeeded, 0);
  assert.equal(result.retried, 0);
  assert.equal(result.deadLettered, 1);
  assert.equal(queue.countPending(), 0);
  assert.equal(queue.countDeadLetters(), 1);
  assert.ok(events.includes('dead_lettered'));
});

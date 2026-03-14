import assert from 'node:assert/strict';
import test from 'node:test';

import type { GatewayShardStatsRecord } from '@platform/shared';

import { OpsShardStatsRepository } from './ops-shard-stats.repository';

class FakeSqliteStore {
  readonly upsertCalls: Array<
    Array<
      Omit<GatewayShardStatsRecord, 'updatedAt'> & {
        updatedAt?: number;
      }
    >
  > = [];
  listCalls = 0;
  records: GatewayShardStatsRecord[] = [];

  upsertGatewayShardStats(
    shardStats: Array<
      Omit<GatewayShardStatsRecord, 'updatedAt'> & {
        updatedAt?: number;
      }
    >,
  ) {
    this.upsertCalls.push(shardStats);
    this.records = shardStats.map(record => ({
      ...record,
      updatedAt: record.updatedAt ?? Date.now(),
    }));
    return shardStats.length;
  }

  listGatewayShardStats() {
    this.listCalls += 1;
    return [...this.records];
  }
}

function sampleStats(): GatewayShardStatsRecord[] {
  return [
    {
      gatewayInstanceId: 'gateway-1',
      botInstanceId: 'bot-1',
      shardId: 0,
      status: 'ready',
      pingMs: 42,
      guildCount: 10,
      userCount: 100,
      heartbeatAt: 1_000,
      emittedAt: 1_001,
      updatedAt: 1_002,
    },
  ];
}

test('OpsShardStatsRepository uses sqlite mode without postgres access', async () => {
  const sqlite = new FakeSqliteStore();
  const warnings: Array<{ message: string; context?: Record<string, unknown> }> = [];
  const repository = new OpsShardStatsRepository({
    mode: 'sqlite',
    postgresUrl: 'postgresql://unused',
    sqliteStore: sqlite,
    logger: {
      warn(message, context) {
        warnings.push({ message, context });
      },
    },
  });

  const upserted = await repository.upsertGatewayShardStats(sampleStats());
  const listed = await repository.listGatewayShardStats();

  assert.equal(upserted, 1);
  assert.equal(listed.length, 1);
  assert.equal(sqlite.upsertCalls.length, 1);
  assert.equal(sqlite.listCalls, 1);
  assert.equal(warnings.length, 0);

  await repository.close();
});

test('OpsShardStatsRepository fallback mode degrades to sqlite and logs once', async () => {
  const sqlite = new FakeSqliteStore();
  const warnings: Array<{ message: string; context?: Record<string, unknown> }> = [];
  const repository = new OpsShardStatsRepository({
    mode: 'postgres_with_sqlite_fallback',
    postgresUrl: 'not-a-url',
    sqliteStore: sqlite,
    logger: {
      warn(message, context) {
        warnings.push({ message, context });
      },
    },
  });

  await repository.migrate();
  const upserted = await repository.upsertGatewayShardStats(sampleStats());
  const listed = await repository.listGatewayShardStats();

  assert.equal(upserted, 1);
  assert.equal(listed.length, 1);
  assert.equal(sqlite.upsertCalls.length, 1);
  assert.equal(sqlite.listCalls, 1);
  assert.equal(warnings.length, 1);
  assert.ok(warnings[0]?.message.includes('falling back to SQLite'));

  await repository.close();
});

test('OpsShardStatsRepository postgres mode surfaces failures without sqlite fallback', async () => {
  const sqlite = new FakeSqliteStore();
  const repository = new OpsShardStatsRepository({
    mode: 'postgres',
    postgresUrl: 'not-a-url',
    sqliteStore: sqlite,
  });

  await assert.rejects(() => repository.listGatewayShardStats());
  assert.equal(sqlite.listCalls, 0);

  await repository.close();
});

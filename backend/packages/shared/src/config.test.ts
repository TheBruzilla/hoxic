import assert from 'node:assert/strict';
import test from 'node:test';

import { loadPlatformConfig } from './config';

function baseEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    CONTROL_PLANE_BASE_URL: 'http://127.0.0.1:3000',
    CONTROL_PLANE_INTERNAL_URL: 'http://127.0.0.1:3000',
    DASHBOARD_PUBLIC_URL: 'http://127.0.0.1:3000',
    DISCORD_GATEWAY_INTERNAL_URL: 'http://127.0.0.1:3100',
    CONTROL_PLANE_DEV_BYPASS_AUTH: 'true',
    DATABASE_PATH: './tmp/test.sqlite',
    ASSET_STORAGE_DIR: './tmp/assets',
    TRANSCRIPT_STORAGE_DIR: './tmp/transcripts',
    LOG_STORAGE_DIR: './tmp/logs',
    PLATFORM_ENCRYPTION_KEY: '12345678901234567890123456789012',
    ...overrides,
  };
}

test('loadPlatformConfig keeps provider and ops rollback modes explicit by default', () => {
  const config = loadPlatformConfig(baseEnv());

  assert.equal(config.ROLE_SYNC_MUTATION_MODE, 'discord-rest-provider');
  assert.equal(config.OPS_SHARD_STATS_STORE_MODE, 'postgres_with_sqlite_fallback');
});

test('loadPlatformConfig allows explicit rollback mode configuration', () => {
  const config = loadPlatformConfig(
    baseEnv({
      ROLE_SYNC_MUTATION_MODE: 'legacy-discord-js',
      OPS_SHARD_STATS_STORE_MODE: 'sqlite',
    }),
  );

  assert.equal(config.ROLE_SYNC_MUTATION_MODE, 'legacy-discord-js');
  assert.equal(config.OPS_SHARD_STATS_STORE_MODE, 'sqlite');
});

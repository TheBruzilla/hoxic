import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuditLogRecord, BotInstanceRecord, MessageTemplateRecord } from '@platform/shared';

import { createInMemoryTemplateVersionRepository } from '../infrastructure/repositories/in-memory-template-version.repository';
import { TemplateVersionShadowService } from './template-version-shadow.service';
import { TemplateLifecycleError, TemplateLifecycleService } from './template-lifecycle.service';

class InMemoryTemplateLifecycleStore {
  private readonly bots = new Map<string, BotInstanceRecord>();
  private readonly templates = new Map<string, MessageTemplateRecord>();
  private readonly audits: AuditLogRecord[] = [];
  private templateSequence = 1;
  private auditSequence = 1;

  addBot(bot: BotInstanceRecord) {
    this.bots.set(bot.id, bot);
  }

  addTemplate(template: MessageTemplateRecord) {
    this.templates.set(template.id, template);
  }

  getBot(id: string): BotInstanceRecord | null {
    return this.bots.get(id) ?? null;
  }

  createMessageTemplate(input: Omit<MessageTemplateRecord, 'id' | 'createdAt' | 'updatedAt'>): MessageTemplateRecord {
    const timestamp = Date.now();
    const record: MessageTemplateRecord = {
      ...input,
      id: `tpl-${this.templateSequence++}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.templates.set(record.id, record);
    return record;
  }

  updateMessageTemplate(id: string, input: Partial<MessageTemplateRecord>): MessageTemplateRecord | null {
    const current = this.templates.get(id);
    if (!current) {
      return null;
    }
    const next: MessageTemplateRecord = {
      ...current,
      ...input,
      updatedAt: Date.now(),
    };
    this.templates.set(next.id, next);
    return next;
  }

  getMessageTemplate(id: string): MessageTemplateRecord | null {
    return this.templates.get(id) ?? null;
  }

  getMessageTemplateByShareToken(shareToken: string): MessageTemplateRecord | null {
    for (const template of this.templates.values()) {
      if (template.shareToken === shareToken) {
        return template;
      }
    }

    return null;
  }

  deleteMessageTemplate(id: string) {
    this.templates.delete(id);
  }

  writeAudit(entry: Omit<AuditLogRecord, 'id' | 'createdAt'>): AuditLogRecord {
    const record: AuditLogRecord = {
      ...entry,
      id: `audit-${this.auditSequence++}`,
      createdAt: Date.now(),
    };
    this.audits.push(record);
    return record;
  }

  listAudits() {
    return [...this.audits];
  }
}

function sampleBot(overrides: Partial<BotInstanceRecord> = {}): BotInstanceRecord {
  const now = Date.now();
  return {
    id: 'bot-1',
    role: 'secondary',
    botUserId: '123456789',
    applicationId: 'app-1',
    name: 'Sample Bot',
    tokenEncrypted: 'encrypted-token',
    templateKey: 'support',
    status: 'running',
    desiredState: 'running',
    autoStart: true,
    featureOverrides: {},
    resourcePolicy: {
      restartOnFailure: true,
      maxRestartsPerHour: 3,
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
    lastValidatedAt: now,
    lastError: null,
    ...overrides,
  };
}

function sampleTemplate(overrides: Partial<MessageTemplateRecord> = {}): MessageTemplateRecord {
  const now = Date.now();
  return {
    id: 'tpl-source',
    botInstanceId: 'bot-1',
    guildId: 'guild-1',
    name: 'Shared Layout',
    description: 'Reusable template',
    status: 'published',
    dispatchMode: 'bot',
    channelId: 'channel-1',
    payload: { content: 'hello' },
    interactionSchema: {},
    tags: ['welcome'],
    shareToken: 'share-abc',
    sourceTemplateId: null,
    createdBy: 'admin-1',
    createdAt: now,
    publishedAt: null,
    lastSentAt: null,
    updatedAt: now,
    ...overrides,
  };
}

function createLogger() {
  const entries: Array<{ context: Record<string, unknown>; message: string }> = [];
  return {
    logger: {
      warn(context: Record<string, unknown>, message: string) {
        entries.push({ context, message });
      },
    },
    entries,
  };
}

test('TemplateLifecycleService createTemplate captures version and writes audit', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const versionRepository = createInMemoryTemplateVersionRepository();
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: true },
      repositories: { versions: versionRepository },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger, entries } = createLogger();

  const created = await service.createTemplate({
    botId: 'bot-1',
    actorUserId: 'admin-1',
    correlationId: 'corr-create',
    logger,
    input: {
      name: 'Welcome Layout',
      payload: { content: 'Welcome' },
      tags: ['one', '', ' two '],
    },
  });

  assert.equal(created.name, 'Welcome Layout');
  assert.deepEqual(created.tags, ['one', ' two ']);
  assert.equal(store.listAudits()[0]?.action, 'studio.template.create');
  const versions = await versionRepository.listByTemplateId(created.id);
  assert.equal(versions.length, 1);
  assert.equal(versions[0]?.event, 'create');
  assert.equal(entries.length, 0);
});

test('TemplateLifecycleService createTemplate remains functional with versions flag disabled', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const versionRepository = createInMemoryTemplateVersionRepository();
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: false },
      repositories: { versions: versionRepository },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger, entries } = createLogger();

  const created = await service.createTemplate({
    botId: 'bot-1',
    actorUserId: 'admin-1',
    correlationId: 'corr-default-flag',
    logger,
    input: {
      name: 'No Versions Flag',
      payload: { content: 'safe-default' },
    },
  });

  assert.equal(created.name, 'No Versions Flag');
  assert.equal(store.listAudits()[0]?.action, 'studio.template.create');
  assert.deepEqual(await versionRepository.listByTemplateId(created.id), []);
  assert.equal(entries.length, 0);
});

test('TemplateLifecycleService importTemplate supports share token source and captures import event', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  store.addTemplate(sampleTemplate());
  const versionRepository = createInMemoryTemplateVersionRepository();
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: true },
      repositories: { versions: versionRepository },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger } = createLogger();

  const imported = await service.importTemplate({
    botId: 'bot-1',
    actorUserId: 'admin-2',
    correlationId: 'corr-import',
    logger,
    input: {
      shareToken: 'share-abc',
    },
  });

  assert.equal(imported.sourceTemplateId, 'tpl-source');
  assert.equal(imported.status, 'draft');
  const versions = await versionRepository.listByTemplateId(imported.id);
  assert.equal(versions.length, 1);
  assert.equal(versions[0]?.event, 'import');
  assert.equal(store.listAudits()[0]?.action, 'studio.template.import');
});

test('TemplateLifecycleService importTemplate rejects unpublished share-token templates', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  store.addTemplate(sampleTemplate({ status: 'draft' }));
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: true },
      repositories: { versions: createInMemoryTemplateVersionRepository() },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger } = createLogger();

  await assert.rejects(
    () =>
      service.importTemplate({
        botId: 'bot-1',
        actorUserId: 'admin-2',
        correlationId: 'corr-import',
        logger,
        input: {
          shareToken: 'share-abc',
        },
      }),
    (error: unknown) => error instanceof TemplateLifecycleError && error.statusCode === 404,
  );
});

test('TemplateLifecycleService updateTemplate captures update event and sets publishedAt when status becomes published', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const created = store.createMessageTemplate({
    botInstanceId: 'bot-1',
    guildId: 'guild-1',
    name: 'Original',
    description: '',
    status: 'draft',
    dispatchMode: 'bot',
    channelId: null,
    payload: { content: 'v1' },
    interactionSchema: {},
    tags: [],
    shareToken: null,
    sourceTemplateId: null,
    createdBy: 'admin-1',
    publishedAt: null,
    lastSentAt: null,
  });
  const versionRepository = createInMemoryTemplateVersionRepository();
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: true },
      repositories: { versions: versionRepository },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger } = createLogger();

  const updated = await service.updateTemplate({
    botId: 'bot-1',
    templateId: created.id,
    actorUserId: 'admin-3',
    correlationId: 'corr-update',
    logger,
    input: {
      name: 'Updated',
      status: 'published',
    },
  });

  assert.equal(updated?.name, 'Updated');
  assert.equal(updated?.status, 'published');
  assert.equal(typeof updated?.publishedAt, 'number');
  const versions = await versionRepository.listByTemplateId(created.id);
  assert.equal(versions.length, 1);
  assert.equal(versions[0]?.event, 'update');
  assert.equal(store.listAudits()[0]?.action, 'studio.template.update');
});

test('TemplateLifecycleService updateTemplate clears share token when status becomes draft', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const template = store.createMessageTemplate({
    botInstanceId: 'bot-1',
    guildId: 'guild-1',
    name: 'Shared',
    description: '',
    status: 'published',
    dispatchMode: 'bot',
    channelId: null,
    payload: { content: 'v1' },
    interactionSchema: {},
    tags: [],
    shareToken: 'share-abc',
    sourceTemplateId: null,
    createdBy: 'admin-1',
    publishedAt: Date.now(),
    lastSentAt: null,
  });
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: false },
      repositories: { versions: createInMemoryTemplateVersionRepository() },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger } = createLogger();

  const updated = await service.updateTemplate({
    botId: 'bot-1',
    templateId: template.id,
    actorUserId: 'admin-3',
    correlationId: 'corr-unshare',
    logger,
    input: {
      status: 'draft',
    },
  });

  assert.equal(updated?.status, 'draft');
  assert.equal(updated?.shareToken, null);
  assert.equal(updated?.publishedAt, null);
});

test('TemplateLifecycleService publishTemplate captures publish event', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const template = store.createMessageTemplate({
    botInstanceId: 'bot-1',
    guildId: 'guild-1',
    name: 'Draft',
    description: '',
    status: 'draft',
    dispatchMode: 'bot',
    channelId: null,
    payload: { content: 'v1' },
    interactionSchema: {},
    tags: [],
    shareToken: null,
    sourceTemplateId: null,
    createdBy: 'admin-1',
    publishedAt: null,
    lastSentAt: null,
  });
  const versionRepository = createInMemoryTemplateVersionRepository();
  const service = new TemplateLifecycleService({
    store,
    versionShadow: new TemplateVersionShadowService({
      flags: { useTemplateVersions: true },
      repositories: { versions: versionRepository },
    }),
    isTemplateModuleEnabled: () => true,
  });
  const { logger } = createLogger();

  const published = await service.publishTemplate({
    templateId: template.id,
    actorUserId: 'admin-4',
    correlationId: 'corr-publish',
    logger,
  });

  assert.equal(published?.status, 'published');
  assert.equal(typeof published?.publishedAt, 'number');
  const versions = await versionRepository.listByTemplateId(template.id);
  assert.equal(versions.length, 1);
  assert.equal(versions[0]?.event, 'publish');
  assert.equal(store.listAudits()[0]?.action, 'studio.template.publish');
});

test('TemplateLifecycleService logs capture failures without failing template mutation', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const { logger, entries } = createLogger();
  const service = new TemplateLifecycleService({
    store,
    versionShadow: {
      async captureTemplateVersion() {
        return {
          status: 'failed' as const,
          reason: 'repository_error' as const,
          versionRecord: null,
        };
      },
    },
    isTemplateModuleEnabled: () => true,
  });

  const created = await service.createTemplate({
    botId: 'bot-1',
    actorUserId: 'admin-1',
    correlationId: 'corr-failed-capture',
    logger,
    input: {
      name: 'Layout',
      payload: { content: 'hello' },
    },
  });

  assert.equal(created.name, 'Layout');
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.message, 'Template version shadow capture failed');
  assert.equal(entries[0]?.context.event, 'create');
});

test('TemplateLifecycleService throws a lifecycle error when Message Studio module is disabled', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  const service = new TemplateLifecycleService({
    store,
    versionShadow: {
      async captureTemplateVersion() {
        return {
          status: 'skipped' as const,
          reason: 'flag_disabled' as const,
          versionRecord: null,
        };
      },
    },
    isTemplateModuleEnabled: () => false,
  });
  const { logger } = createLogger();

  await assert.rejects(
    () =>
      service.createTemplate({
        botId: 'bot-1',
        actorUserId: 'admin-1',
        correlationId: 'corr-disabled',
        logger,
        input: {
          name: 'Layout',
          payload: { content: 'hello' },
        },
      }),
    (error: unknown) => error instanceof TemplateLifecycleError && error.statusCode === 422,
  );
});

test('TemplateLifecycleService importTemplate enforces Message Studio module gate', async () => {
  const store = new InMemoryTemplateLifecycleStore();
  store.addBot(sampleBot());
  store.addTemplate(sampleTemplate());
  const service = new TemplateLifecycleService({
    store,
    versionShadow: {
      async captureTemplateVersion() {
        return {
          status: 'skipped' as const,
          reason: 'flag_disabled' as const,
          versionRecord: null,
        };
      },
    },
    isTemplateModuleEnabled: () => false,
  });
  const { logger } = createLogger();

  await assert.rejects(
    () =>
      service.importTemplate({
        botId: 'bot-1',
        actorUserId: 'admin-2',
        correlationId: 'corr-import-disabled',
        logger,
        input: {
          shareToken: 'share-abc',
        },
      }),
    (error: unknown) => error instanceof TemplateLifecycleError && error.statusCode === 422,
  );
});

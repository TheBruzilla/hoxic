"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuBot,
  LuBoxes,
  LuCircleX,
  LuLayoutDashboard,
  LuShield,
  LuSparkles,
  LuWandSparkles,
} from "react-icons/lu";
import { EmptyState, MetricCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { BotRecord, formatBytes, formatPercent, getBotRuntimeMetric, getBotWorkspaceHref, getSharedBotInviteHref, getTemplateDefinition, requestJson } from "@/lib/console";
import { useGuildTemplateDraft } from "@/lib/templateDraft";
import {
  buildFocusedBotsHref,
  buildSetupHref,
  buildTemplateSelectorHref,
  findPrimaryBot,
  findSecondaryBots,
  getAccessLabel,
  getFocusedSlotLabel,
  getGuildProvisioning,
  getProvisioningLabel,
  getTransitionLockMessage,
} from "@/app/app/setup/setup-helpers";
import styles from "@/components/console/console.module.scss";

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bootstrap, loading, error, refresh } = useConsole();
  const [showFocusedTemplateMap, setShowFocusedTemplateMap] = useState(false);
  const [showFullSuiteModal, setShowFullSuiteModal] = useState(false);
  const [validatedPrimaryBot, setValidatedPrimaryBot] = useState<BotRecord | null>(null);
  const [primaryDraft, setPrimaryDraft] = useState({ name: "HOXiq primary bot", token: "" });
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const targetGuildId = searchParams.get("guild") || "";
  const selectedTemplateKey = searchParams.get("template") || "";
  const targetGuild = targetGuildId && bootstrap
    ? bootstrap.manageableGuilds.find(item => item.id === targetGuildId) || null
    : null;
  const { templateKey: lockedTemplateKey } = useGuildTemplateDraft(targetGuildId, selectedTemplateKey);
  const slotDraft0 = useGuildTemplateDraft(targetGuildId, "", "slot-0");
  const slotDraft1 = useGuildTemplateDraft(targetGuildId, "", "slot-1");
  const slotDraft2 = useGuildTemplateDraft(targetGuildId, "", "slot-2");
  const slotDraft3 = useGuildTemplateDraft(targetGuildId, "", "slot-3");
  const templates = bootstrap?.templates || [];
  const slotDraftTemplates = [slotDraft0.templateKey, slotDraft1.templateKey, slotDraft2.templateKey, slotDraft3.templateKey].map(
    templateKey => (templateKey && templateKey !== "full-suite" ? getTemplateDefinition(templates, templateKey) : null),
  );

  useEffect(() => {
    if (!targetGuildId) {
      router.replace("/app/bots");
    }
  }, [router, targetGuildId]);

  useEffect(() => {
    if (!targetGuildId || selectedTemplateKey === lockedTemplateKey) {
      return;
    }

    router.replace(buildSetupHref(targetGuildId, lockedTemplateKey || undefined));
  }, [lockedTemplateKey, router, selectedTemplateKey, targetGuildId]);

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader title="Loading setup" description="Preparing template and provisioning data." />
      </section>
    );
  }

  if (error || !bootstrap) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Setup unavailable" description={error || "No provisioning data is available."} />
      </section>
    );
  }

  if (!targetGuild) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Main Bot" title="Opening setup" />
      </section>
    );
  }

  const primaryBot = findPrimaryBot(bootstrap.bots, targetGuild);
  const secondaryBots = findSecondaryBots(bootstrap.bots, targetGuild);
  const provisioning = getGuildProvisioning(targetGuild);
  const metricsBot = primaryBot || secondaryBots[0] || null;
  const metricsHeartbeat = metricsBot
    ? bootstrap.heartbeats.find(item => item.botInstanceId === metricsBot.id) || null
    : null;
  const workspaceHref = metricsBot ? getBotWorkspaceHref(metricsBot.id, "overview", targetGuildId || undefined) : null;
  const fullSuiteInviteHref =
    primaryBot?.applicationId ? getSharedBotInviteHref(primaryBot.applicationId, targetGuildId || undefined) : null;
  const fullSuiteSelectorHref = buildTemplateSelectorHref(buildSetupHref(targetGuildId), "full-suite");
  const focusedManagementHref = buildFocusedBotsHref(targetGuildId);
  const transitionLockMessage = getTransitionLockMessage(targetGuild);
  const fullSuiteLocked =
    provisioning.blockedReason === "remove_secondary_bots_first" ||
    provisioning.blockedReason === "invalid_existing_state";
  const focusedLocked =
    provisioning.blockedReason === "full_suite_already_installed" ||
    provisioning.blockedReason === "invalid_existing_state";
  const guildConnected = provisioning.mode === "primary" && Boolean(provisioning.primaryBotId);
  const runtimeStatus = metricsHeartbeat?.status || metricsBot?.status || "stopped";
  const focusedSlotAssignments = Array.from({ length: 4 }, (_, index) => {
    const bot = secondaryBots[index] || null;
    const template = bot ? getTemplateDefinition(templates, bot.templateKey) : slotDraftTemplates[index];
    return { bot, template };
  });
  const focusedTemplateNames = Array.from(
    new Set(focusedSlotAssignments.map(item => item.template?.name).filter((value): value is string => Boolean(value))),
  );
  const activeTemplateLabel =
    provisioning.mode === "primary"
      ? (metricsBot ? getTemplateDefinition(templates, metricsBot.templateKey)?.name : null) || "Not selected"
      : focusedTemplateNames.length === 0
        ? "Not selected"
        : focusedTemplateNames.length === 1
          ? focusedTemplateNames[0]
          : "Per slot";
  const details = [
    { label: "Server Name", value: targetGuild.name },
    { label: "Server ID", value: targetGuild.id },
    { label: "Access", value: getAccessLabel(targetGuild.isOwner) },
    { label: "Provisioning", value: getProvisioningLabel(targetGuild) },
  ];
  const primaryStatusCopy = guildConnected
    ? `${primaryBot?.name || "Primary bot"} is attached to this server.`
    : fullSuiteLocked
      ? transitionLockMessage || "Full Suite is currently locked."
      : null;

  function openFullSuiteModal() {
    setValidatedPrimaryBot(null);
    setMessage(null);
    setShowFullSuiteModal(true);
  }

  function closeFullSuiteModal() {
    setValidatedPrimaryBot(null);
    setShowFullSuiteModal(false);
  }

  async function createFullSuiteBot() {
    const token = primaryDraft.token.trim();
    if (!token) {
      setMessage("Paste the Full Suite bot token first.");
      return;
    }

    setBusyAction("create-full-suite");
    setMessage(null);
    try {
      const bot = await requestJson<BotRecord>("/api/bots", {
        method: "POST",
        body: JSON.stringify({
          name: primaryDraft.name.trim() || "HOXiq primary bot",
          token,
          templateKey: "full-suite",
          guildId: targetGuildId,
          autoStart: true,
        }),
      });
      setValidatedPrimaryBot(bot);
      setPrimaryDraft(current => ({ ...current, token: "" }));
      setMessage(`${bot.name} was validated. Invite it to the server next.`);
      await refresh();
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "Failed to validate Full Suite bot.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className={styles.setupStandalone}>
      <section
        id="setup-overview"
        className={`${styles.hero} ${styles.setupOverviewHero}`}
        style={targetGuild.iconUrl ? { backgroundImage: `linear-gradient(180deg, rgba(6, 9, 20, 0.52), rgba(6, 9, 20, 0.76)), url(${targetGuild.iconUrl})` } : undefined}
      >
        <SectionHeader eyebrow="Overview" title={targetGuild.name} />
        <div className={`${styles.inlineMeta} ${styles.inlineMetaCentered}`}>
          <span className={styles.chip}>{getAccessLabel(targetGuild.isOwner)}</span>
          <span className={styles.chip}>{getProvisioningLabel(targetGuild)}</span>
          <span className={styles.chip}>{provisioning.remainingFocusedSlots} focused slots open</span>
        </div>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Provisioning" title="Choose how this server will run HOXiq" />
        <div className={styles.setupProvisionGrid}>
          <article className={`${styles.card} ${styles.setupProvisionZone}`}>
            <div className={styles.splitHeader}>
              <div className={styles.setupProvisionCopy}>
                <div className={styles.setupDetailLabel}>Main Bot</div>
                <h3 className={styles.cardTitle}>Run one Full Suite bot</h3>
              </div>
              <details className={styles.infoDisclosure}>
                <summary className={styles.infoSummary} aria-label="Full Suite info">
                  i
                </summary>
                <div className={styles.infoPanel}>
                  <strong>Full Suite</strong>
                  <span>Use one HOXiq-managed bot for this server.</span>
                  <span>Best when you want one install and one workspace for everything.</span>
                </div>
              </details>
            </div>
            <div className={styles.inlineMeta}>
            </div>
            <div className={styles.setupDetailsGrid}>
              <div className={styles.setupDetailTile}>
                <span className={styles.setupDetailLabel}>Status</span>
                <span className={styles.setupDetailValue}>
                  {guildConnected ? "Connected" : fullSuiteLocked ? "Locked" : "Ready to install"}
                </span>
              </div>
              <div className={styles.setupDetailTile}>
                <span className={styles.setupDetailLabel}>Bot</span>
                <span className={styles.setupDetailValue}>{primaryBot?.name || "HOXiq primary bot"}</span>
              </div>
            </div>
            <div className={styles.setupProvisionRule}>
              {primaryStatusCopy ? (
                <div className={styles.setupSlotMeta}>
                  <LuShield />
                  <span>{guildConnected ? "Workspace is ready." : primaryStatusCopy}</span>
                </div>
              ) : null}
              {transitionLockMessage && fullSuiteLocked ? (
                <div className={styles.setupLockNote}>{transitionLockMessage}</div>
              ) : null}
            </div>
            <div className={styles.cardActions}>
              {fullSuiteLocked ? (
                <span className={`${styles.buttonSecondary} ${styles.buttonDisabled}`}>Install Full Suite</span>
              ) : guildConnected && workspaceHref ? (
                <Link href={workspaceHref} className={styles.button}>
                  <LuLayoutDashboard />
                  Open workspace
                </Link>
              ) : fullSuiteInviteHref ? (
                <a href={fullSuiteInviteHref} target="_blank" rel="noreferrer" className={styles.button}>
                  <LuBot />
                  Invite bot
                </a>
              ) : (
                <button type="button" className={styles.button} onClick={openFullSuiteModal}>
                  <LuSparkles />
                  Prepare Full Suite
                </button>
              )}
              {guildConnected && fullSuiteInviteHref ? (
                <a href={fullSuiteInviteHref} target="_blank" rel="noreferrer" className={styles.buttonSecondary}>
                  <LuBot />
                  Invite bot
                </a>
              ) : null}
              <Link href={fullSuiteSelectorHref} className={styles.buttonSecondary}>
                <LuWandSparkles />
                View template
              </Link>
            </div>
          </article>

          <article className={`${styles.card} ${styles.setupProvisionZone}`}>
            <div className={styles.splitHeader}>
              <div className={styles.setupProvisionCopy}>
                <div className={styles.setupDetailLabel}>Focused Bots</div>
                <h3 className={styles.cardTitle}>Run focused bots</h3>
              </div>
              <details className={styles.infoDisclosure}>
                <summary className={styles.infoSummary} aria-label="Focused bots info">
                  i
                </summary>
                <div className={styles.infoPanel}>
                  <strong>Focused bots</strong>
                  <span>Use up to four specialized bots for this server.</span>
                  <span>Choose a template per slot, validate the token in HOXiq, then invite the bot.</span>
                </div>
              </details>
            </div>
            <div className={styles.inlineMeta}>
            </div>
            <div className={styles.setupDetailsGrid}>
              <button
                type="button"
                className={`${styles.setupDetailTile} ${styles.setupDetailButton}`}
                onClick={() => setShowFocusedTemplateMap(true)}
              >
                <span className={styles.setupDetailLabel}>Draft template</span>
                <span className={styles.setupDetailValue}>Click to View slot mapping</span>
              </button>
              <div className={styles.setupDetailTile}>
                <span className={styles.setupDetailLabel}>Slot availability</span>
                <span className={styles.setupDetailValue}>{getFocusedSlotLabel(targetGuild)}</span>
              </div>
            </div>
            {transitionLockMessage && focusedLocked ? (
              <div className={styles.setupLockNote}>{transitionLockMessage}</div>
            ) : null}
            <div className={styles.cardActions}>
              <Link href={focusedManagementHref} className={styles.button}>
                <LuBoxes />
                Open focused setup
              </Link>
            </div>
          </article>
        </div>
        {message ? <div className={styles.callout}>{message}</div> : null}
      </section>

      <section className={styles.pageSurface}>
        <article className={`${styles.card} ${styles.setupDetailsPanel}`}>
          <div className={styles.setupCardTitle}>Details</div>
          <div className={styles.setupDetailsGrid}>
            {details.map(item => (
              <div key={item.label} className={styles.setupDetailTile}>
                <span className={styles.setupDetailLabel}>{item.label}</span>
                <span className={styles.setupDetailValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="setup-systems" className={styles.pageSurface}>
        <SectionHeader eyebrow="Runtime" title="Bot metrics" />
        <div className={`${styles.statsGrid} ${styles.setupMetricsGrid}`}>
          <MetricCard
            label="Bot CPU"
            value={formatPercent(getBotRuntimeMetric(metricsHeartbeat, "cpuPercent"))}
            meta={`status ${runtimeStatus}`}
          />
          <MetricCard
            label="Bot memory"
            value={formatBytes(getBotRuntimeMetric(metricsHeartbeat, "rssBytes"))}
            meta={`heap ${formatBytes(getBotRuntimeMetric(metricsHeartbeat, "heapUsedBytes"))}`}
          />
          <MetricCard
            label="Guilds"
            value={String(metricsHeartbeat?.guildCount || 0)}
            meta={`${metricsHeartbeat?.userCount || 0} users`}
          />
          <MetricCard
            label="Host memory"
            value={formatBytes(bootstrap.runtime.host.usedMemoryBytes)}
            meta={`of ${formatBytes(bootstrap.runtime.host.totalMemoryBytes)}`}
          />
        </div>
      </section>

      {showFocusedTemplateMap ? (
        <div className={styles.slotModalScrim} role="presentation" onClick={() => setShowFocusedTemplateMap(false)}>
          <div
            className={styles.slotModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="focused-template-map-title"
            onClick={event => event.stopPropagation()}
          >
            <div className={styles.splitHeader}>
              <div>
                <div className={styles.eyebrow}>Focused bots</div>
                <h3 id="focused-template-map-title" className={styles.cardTitle}>Bot to template mapping</h3>
              </div>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={() => setShowFocusedTemplateMap(false)}
                aria-label="Close template mapping"
              >
                <LuCircleX />
              </button>
            </div>
            <div className={styles.setupDetailsGrid}>
              {focusedSlotAssignments.map((item, index) => (
                <div key={`focused-template-${index}`} className={styles.setupDetailTile}>
                  <span className={styles.setupDetailLabel}>Slot {index + 1}</span>
                  <span className={styles.setupDetailValue}>{item.bot?.name || "No bot linked"}</span>
                  <span className={styles.muted}>{item.template?.name || "No template selected"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showFullSuiteModal ? (
        <div className={styles.slotModalScrim} role="presentation" onClick={closeFullSuiteModal}>
          <div
            className={styles.slotModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-suite-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <div className={styles.splitHeader}>
              <div>
                <div className={styles.eyebrow}>Full Suite</div>
                <h3 id="full-suite-modal-title" className={styles.cardTitle}>Add primary bot</h3>
              </div>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={closeFullSuiteModal}
                aria-label="Close full suite setup"
              >
                <LuCircleX />
              </button>
            </div>
            {validatedPrimaryBot ? (
              <>
                <p className={styles.cardText}>
                  {validatedPrimaryBot.name} is validated. Invite it to this server, then open the workspace when the install completes.
                </p>
                <div className={styles.cardActions}>
                  {validatedPrimaryBot.applicationId ? (
                    <a
                      href={getSharedBotInviteHref(validatedPrimaryBot.applicationId, targetGuildId || undefined)}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.button}
                    >
                      <LuBot />
                      Invite bot
                    </a>
                  ) : null}
                  <button type="button" className={styles.buttonSecondary} onClick={closeFullSuiteModal}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.cardText}>
                  Paste the bot token for your HOXiq app here. This creates the Full Suite bot record and starts the bot worker.
                </p>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="full-suite-name">
                      Dashboard nickname
                    </label>
                    <span className={styles.fieldHint}>Discord manages the public bot name, avatar, and banner.</span>
                    <input
                      id="full-suite-name"
                      className={styles.input}
                      value={primaryDraft.name}
                      onChange={event => setPrimaryDraft(current => ({ ...current, name: event.target.value }))}
                      placeholder="HOXiq primary bot"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="full-suite-token">
                      Bot token
                    </label>
                    <input
                      id="full-suite-token"
                      type="password"
                      className={styles.input}
                      value={primaryDraft.token}
                      onChange={event => setPrimaryDraft(current => ({ ...current, token: event.target.value }))}
                      placeholder="Paste bot token"
                    />
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={busyAction === "create-full-suite"}
                    onClick={() => void createFullSuiteBot()}
                  >
                    <LuSparkles />
                    {busyAction === "create-full-suite" ? "Validating…" : "Validate Full Suite"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <section className={styles.pageSurface}>
          <SectionHeader title="Loading setup" description="Preparing template and provisioning data." />
        </section>
      }
    >
      <SetupPageContent />
    </Suspense>
  );
}

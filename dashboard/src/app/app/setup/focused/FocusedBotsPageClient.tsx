"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuCircleX,
  LuBoxes,
  LuLayoutDashboard,
  LuLink,
  LuPlay,
  LuShield,
  LuSquare,
  LuWandSparkles,
} from "react-icons/lu";
import { EmptyState, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { BotRecord, getBotWorkspaceHref, getSharedBotInviteHref, getTemplateDefinition, requestJson } from "@/lib/console";
import { useGuildTemplateDraft } from "@/lib/templateDraft";
import {
  DISCORD_DEVELOPER_PORTAL_URL,
  buildFocusedBotsHref,
  buildProvisionHref,
  buildTemplateSelectorHref,
  findSecondaryBots,
  getFocusedSlotLabel,
  getGuildProvisioning,
  getTransitionLockMessage,
} from "@/app/app/setup/setup-helpers";
import styles from "@/components/console/console.module.scss";

function FocusedBotsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bootstrap, loading, error, refresh } = useConsole();
  const [slotDrafts, setSlotDrafts] = useState(() =>
    Array.from({ length: 4 }, () => ({ name: "", token: "" })),
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [showDeveloperPortalGuide, setShowDeveloperPortalGuide] = useState(false);
  const [validatedSlotBot, setValidatedSlotBot] = useState<BotRecord | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const targetGuildId = searchParams.get("guild") || "";
  const selectedTemplateKey = searchParams.get("template") || "";
  const selectedSlotIndex = Number.parseInt(searchParams.get("slot") || "", 10);
  const targetGuild = targetGuildId && bootstrap
    ? bootstrap.manageableGuilds.find(item => item.id === targetGuildId) || null
    : null;
  const slotDraft0 = useGuildTemplateDraft(targetGuildId, Number.isInteger(selectedSlotIndex) && selectedSlotIndex === 0 ? selectedTemplateKey : "", "slot-0");
  const slotDraft1 = useGuildTemplateDraft(targetGuildId, Number.isInteger(selectedSlotIndex) && selectedSlotIndex === 1 ? selectedTemplateKey : "", "slot-1");
  const slotDraft2 = useGuildTemplateDraft(targetGuildId, Number.isInteger(selectedSlotIndex) && selectedSlotIndex === 2 ? selectedTemplateKey : "", "slot-2");
  const slotDraft3 = useGuildTemplateDraft(targetGuildId, Number.isInteger(selectedSlotIndex) && selectedSlotIndex === 3 ? selectedTemplateKey : "", "slot-3");
  const templates = bootstrap?.templates || [];
  const slotTemplateKeys = useMemo(
    () => [slotDraft0.templateKey, slotDraft1.templateKey, slotDraft2.templateKey, slotDraft3.templateKey],
    [slotDraft0.templateKey, slotDraft1.templateKey, slotDraft2.templateKey, slotDraft3.templateKey],
  );
  const slotDraftTemplates = slotTemplateKeys.map(templateKey =>
    templateKey && templateKey !== "full-suite" ? getTemplateDefinition(templates, templateKey) : null,
  );
  const activeSlotTemplate = activeSlotIndex !== null ? slotDraftTemplates[activeSlotIndex] : null;

  useEffect(() => {
    if (!targetGuildId) {
      router.replace("/app/bots");
    }
  }, [router, targetGuildId]);

  useEffect(() => {
    if (!targetGuildId || !selectedTemplateKey || !Number.isInteger(selectedSlotIndex) || selectedSlotIndex < 0 || selectedSlotIndex > 3) {
      return;
    }
    if (slotTemplateKeys[selectedSlotIndex] !== selectedTemplateKey) {
      return;
    }
    router.replace(buildFocusedBotsHref(targetGuildId));
  }, [router, selectedSlotIndex, selectedTemplateKey, slotTemplateKeys, targetGuildId]);

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader title="Loading focused bots" description="Preparing secondary bot data." />
      </section>
    );
  }

  if (error || !bootstrap || !targetGuild) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Focused bots unavailable" description={error || "No focused bot data is available."} />
      </section>
    );
  }

  const secondaryBots = findSecondaryBots(bootstrap.bots, targetGuild);
  const provisioning = getGuildProvisioning(targetGuild);
  const focusedLocked =
    provisioning.blockedReason === "full_suite_already_installed" ||
    provisioning.blockedReason === "invalid_existing_state";
  const transitionLockMessage = getTransitionLockMessage(targetGuild);
  const secondarySlots = Array.from({ length: 4 }, (_, index) => secondaryBots[index] || null);

  function updateSlotDraft(index: number, patch: Partial<{ name: string; token: string }>) {
    if (activeSlotIndex === index && validatedSlotBot) {
      setValidatedSlotBot(null);
    }
    setSlotDrafts(current =>
      current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)),
    );
  }

  function openSlotModal(index: number) {
    setMessage(null);
    setValidatedSlotBot(null);
    setActiveSlotIndex(index);
  }

  function closeSlotModal() {
    setValidatedSlotBot(null);
    setActiveSlotIndex(null);
  }

  async function createFocusedBot(index: number) {
    const slotTemplate = slotDraftTemplates[index];
    if (!slotTemplate) {
      setMessage("Choose a focused template first.");
      return;
    }

    const draft = slotDrafts[index];
    if (!draft.name.trim() || !draft.token.trim()) {
      setMessage(`Slot ${index + 1} needs a bot name and token.`);
      return;
    }

    const actionKey = `create-${index}`;
    setBusyAction(actionKey);
    setMessage(null);
    try {
      const bot = await requestJson<BotRecord>("/api/bots", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name.trim(),
          token: draft.token.trim(),
          templateKey: slotTemplate.key,
          guildId: targetGuildId,
          autoStart: false,
        }),
      });
      setSlotDrafts(current =>
        current.map((slotDraft, draftIndex) => (draftIndex === index ? { name: "", token: "" } : slotDraft)),
      );
      setValidatedSlotBot(bot);
      await refresh();
      setMessage(`${bot.name} was validated for Slot ${index + 1}. Invite it to the server next.`);
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "Failed to add focused bot.");
    } finally {
      setBusyAction(null);
    }
  }

  async function runBotAction(bot: BotRecord, action: "start" | "stop") {
    const actionKey = `${action}-${bot.id}`;
    setBusyAction(actionKey);
    setMessage(null);
    try {
      await requestJson(`/api/bots/${bot.id}/actions/${action}`, {
        method: "POST",
      });
      await refresh();
      setMessage(`${bot.name} ${action === "start" ? "started" : "stopped"}.`);
    } catch (actionError) {
      setMessage(actionError instanceof Error ? actionError.message : `Failed to ${action} bot.`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className={styles.setupStandalone}>
      <section className={styles.pageSurface}>
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>{getFocusedSlotLabel(targetGuild)}</span>
          <span className={styles.chip}>{provisioning.remainingFocusedSlots} available</span>
        </div>
        {transitionLockMessage && focusedLocked ? (
          <div className={styles.setupLockNote}>{transitionLockMessage}</div>
        ) : null}
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => setShowDeveloperPortalGuide(true)}
          >
            <LuLink />
            Developer Portal
          </button>
        </div>
      </section>

      <section className={styles.pageSurface}>
        <div className={styles.splitHeader}>
          <div>
            <div className={styles.eyebrow}>Slots</div>
            <h2 className={styles.pageTitle}>Focused bot board</h2>
          </div>
          <span className={styles.chip}>{secondaryBots.length} active</span>
        </div>
        <div className={styles.focusedSlotGrid}>
          {secondarySlots.map((bot, index) => {
            const slotTemplate = bot ? getTemplateDefinition(templates, bot.templateKey) : slotDraftTemplates[index];
            const slotState = bot ? bot.status : focusedLocked ? "Locked" : "Ready";
            const slotTemplateSelectorHref = buildTemplateSelectorHref(
              buildFocusedBotsHref(targetGuildId, undefined, index),
              slotTemplate?.key || undefined,
            );
            const slotProvisionHref = slotTemplate ? buildProvisionHref(targetGuildId, slotTemplate.key, index) : "";
            const slotHref = bot
              ? getBotWorkspaceHref(bot.id, "overview", targetGuildId || undefined)
              : slotTemplateSelectorHref;
            const controlsHref = bot ? getBotWorkspaceHref(bot.id, "controls", targetGuildId || undefined) : null;
            const inviteHref = bot?.applicationId ? getSharedBotInviteHref(bot.applicationId, targetGuildId || undefined) : null;
            const canStart = bot ? bot.status !== "running" && bot.status !== "starting" : false;

            return (
              <article key={bot?.id || `slot-${index}`} className={styles.card}>
                <div className={styles.splitHeader}>
                  <div>
                    <div className={styles.eyebrow}>Slot {index + 1}</div>
                    <h3 className={styles.cardTitle}>{bot?.name || "Open slot"}</h3>
                  </div>
                  <span className={styles.chip}>{slotState}</span>
                </div>
                <div className={styles.list}>
                  <div className={styles.setupSlotMeta}>
                    <LuLink />
                    <span>{bot ? "Token validated and linked" : "Paste the bot token here to link this slot"}</span>
                  </div>
                  <div className={styles.setupSlotMeta}>
                    <LuShield />
                    <span>{bot ? `Role: ${bot.role}` : "Single-server secondary bot"}</span>
                  </div>
                </div>
                {bot ? (
                  <div className={styles.cardActions}>
                    <Link href={slotHref} className={styles.button}>
                      <LuLayoutDashboard />
                      Open workspace
                    </Link>
                    {controlsHref ? (
                      <Link href={controlsHref} className={styles.buttonSecondary}>
                        <LuBoxes />
                        Template controls
                      </Link>
                    ) : null}
                    {inviteHref ? (
                      <a href={inviteHref} target="_blank" rel="noreferrer" className={styles.buttonSecondary}>
                        <LuLink />
                        Invite bot again
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className={canStart ? styles.buttonSecondary : styles.buttonDanger}
                      disabled={busyAction === `${canStart ? "start" : "stop"}-${bot.id}`}
                      onClick={() => void runBotAction(bot, canStart ? "start" : "stop")}
                    >
                      {canStart ? (
                        <>
                          <LuPlay />
                          {busyAction === `start-${bot.id}` ? "Starting…" : "Start bot"}
                        </>
                      ) : (
                        <>
                          <LuSquare />
                          {busyAction === `stop-${bot.id}` ? "Stopping…" : "Stop bot"}
                        </>
                      )}
                    </button>
                  </div>
                ) : focusedLocked ? (
                  <div className={styles.cardActions}>
                    <span className={`${styles.buttonSecondary} ${styles.buttonDisabled}`}>Slot locked</span>
                  </div>
                ) : slotTemplate ? (
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => openSlotModal(index)}
                    >
                      <LuBoxes />
                      Configure slot
                    </button>
                    <Link href={slotProvisionHref} className={styles.buttonSecondary}>
                      <LuWandSparkles />
                      {`Configure ${slotTemplate.name}`}
                    </Link>
                  </div>
                ) : (
                  <div className={styles.cardActions}>
                    <Link href={slotTemplateSelectorHref} className={styles.button}>
                      <LuWandSparkles />
                      Pick template
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {message ? <div className={styles.callout}>{message}</div> : null}
      </section>

      {activeSlotIndex !== null && activeSlotTemplate ? (
        <div className={styles.slotModalScrim} role="presentation" onClick={closeSlotModal}>
          <div
            className={styles.slotModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <div className={styles.splitHeader}>
              <div>
                <div className={styles.eyebrow}>Slot {activeSlotIndex + 1}</div>
                <h3 id="slot-modal-title" className={styles.cardTitle}>Add {activeSlotTemplate.name} bot</h3>
              </div>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={closeSlotModal}
                aria-label="Close slot setup"
              >
                <LuCircleX />
              </button>
            </div>
            {validatedSlotBot ? (
              <>
                <p className={styles.cardText}>
                  {validatedSlotBot.name} is linked. Invite it to this server, then open the workspace when Discord
                  finishes the install.
                </p>
                <div className={styles.cardActions}>
                  {validatedSlotBot.applicationId ? (
                    <a
                      href={getSharedBotInviteHref(validatedSlotBot.applicationId, targetGuildId || undefined)}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.button}
                    >
                      <LuLink />
                      Invite bot
                    </a>
                  ) : null}
                  <button type="button" className={styles.buttonSecondary} onClick={closeSlotModal}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.cardText}>
                  Paste the bot token here. The name below is only a HOXiq dashboard nickname so you can identify the
                  bot inside this workspace.
                </p>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="slot-modal-name">
                      Dashboard nickname
                    </label>
                    <span className={styles.fieldHint}>Discord manages the public bot name, avatar, and banner.</span>
                    <input
                      id="slot-modal-name"
                      className={styles.input}
                      value={slotDrafts[activeSlotIndex]?.name || ""}
                      onChange={event => updateSlotDraft(activeSlotIndex, { name: event.target.value })}
                      placeholder={`${activeSlotTemplate.name} Bot ${activeSlotIndex + 1}`}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="slot-modal-token">
                      Bot token
                    </label>
                    <input
                      id="slot-modal-token"
                      type="password"
                      className={styles.input}
                      value={slotDrafts[activeSlotIndex]?.token || ""}
                      onChange={event => updateSlotDraft(activeSlotIndex, { token: event.target.value })}
                      placeholder="Paste bot token"
                    />
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={busyAction === `create-${activeSlotIndex}`}
                    onClick={() => void createFocusedBot(activeSlotIndex)}
                  >
                    <LuBoxes />
                    {busyAction === `create-${activeSlotIndex}` ? "Validating…" : "Validate"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showDeveloperPortalGuide ? (
        <div className={styles.slotModalScrim} role="presentation" onClick={() => setShowDeveloperPortalGuide(false)}>
          <div
            className={styles.slotModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="developer-portal-guide-title"
            onClick={event => event.stopPropagation()}
          >
            <div className={styles.splitHeader}>
              <div>
                <div className={styles.eyebrow}>Developer Portal</div>
                <h3 id="developer-portal-guide-title" className={styles.cardTitle}>What to do there</h3>
              </div>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={() => setShowDeveloperPortalGuide(false)}
                aria-label="Close developer portal guide"
              >
                <LuCircleX />
              </button>
            </div>
            <div className={styles.setupDetailsGrid}>
              <div className={styles.setupDetailTile}>
                <span className={styles.setupDetailLabel}>Linked</span>
                <span className={styles.setupDetailValue}>{getFocusedSlotLabel(targetGuild)}</span>
              </div>
              <div className={styles.setupDetailTile}>
                <span className={styles.setupDetailLabel}>Available</span>
                <span className={styles.setupDetailValue}>{provisioning.remainingFocusedSlots}</span>
              </div>
            </div>
            <ul className={styles.infoList}>
              <li>Create a new Discord bot application.</li>
              <li>Copy the bot token from the Bot tab.</li>
              <li>Come back here and paste the token into the slot.</li>
              <li>After validation, invite the bot to this server.</li>
            </ul>
            <div className={styles.cardActions}>
              <a href={DISCORD_DEVELOPER_PORTAL_URL} target="_blank" rel="noreferrer" className={styles.button}>
                <LuLink />
                Open Developer Portal
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FocusedBotsPage() {
  return (
    <Suspense
      fallback={
        <section className={styles.pageSurface}>
          <SectionHeader title="Loading focused bots" description="Preparing secondary bot data." />
        </section>
      }
    >
      <FocusedBotsPageContent />
    </Suspense>
  );
}

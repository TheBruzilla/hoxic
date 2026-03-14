"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { buildGuildTemplateOverrides, getTemplateDefinition, requestJson } from "@/lib/console";
import { useGuildTemplateDraft } from "@/lib/templateDraft";
import {
  buildProvisionHref,
  buildTemplateSelectorHref,
  findPrimaryBot,
  findSecondaryBots,
  resolveTemplateConfigureHref,
  stripTemplateFromHref,
} from "@/app/app/setup/setup-helpers";
import styles from "@/components/console/console.module.scss";

function BotsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bootstrap, loading, error, refresh } = useConsole();
  const returnTo = searchParams.get("returnTo") || "";
  const selectedTemplateKey = searchParams.get("template") || "";

  const returnTarget = useMemo<URL | null>(() => {
    if (!returnTo) return null;
    try {
      return new URL(returnTo, "http://localhost");
    } catch {
      return null;
    }
  }, [returnTo]);
  const returnGuildId = returnTarget?.searchParams.get("guild") || "";
  const returnSlotIndexValue = returnTarget?.searchParams.get("slot") || "";
  const returnSlotIndex = returnSlotIndexValue ? Number.parseInt(returnSlotIndexValue, 10) : null;
  const isFocusedReturn = returnTarget?.pathname === "/app/setup/focused" && Number.isInteger(returnSlotIndex);
  const draftScope = isFocusedReturn && returnSlotIndex !== null ? `slot-${returnSlotIndex}` : "guild";
  const {
    templateKey: lockedTemplateKey,
    setTemplateKey: setLockedTemplateKey,
    clearTemplateKey,
  } = useGuildTemplateDraft(
    returnGuildId,
    selectedTemplateKey,
    draftScope,
  );

  useEffect(() => {
    if (!returnTo || selectedTemplateKey === lockedTemplateKey) {
      return;
    }

    const nextReturnTo = lockedTemplateKey ? returnTo : stripTemplateFromHref(returnTo);
    const nextHref = buildTemplateSelectorHref(nextReturnTo, lockedTemplateKey || undefined);
    router.replace(nextHref);
  }, [lockedTemplateKey, returnTo, router, selectedTemplateKey]);

  if (!returnTo) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Bot Fleet"
          title="Choose a server first"
          description="Template selection belongs to a server setup flow, not a standalone empty page."
        />
        <EmptyState
          title="No setup context"
          description="Open a server from the directory, then pick a template or continue into a bot workspace."
          action={
            <Link href="/app" className={styles.buttonSecondary}>
              Back to servers
            </Link>
          }
        />
      </section>
    );
  }

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader title="Loading templates" />
      </section>
    );
  }

  if (error || !bootstrap) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Templates unavailable" description={error || "No template data is available."} />
      </section>
    );
  }

  const targetGuild = returnGuildId
    ? bootstrap.manageableGuilds.find(guild => guild.id === returnGuildId) || null
    : null;
  const templates = bootstrap.templates;
  const effectiveTemplateKey = lockedTemplateKey || selectedTemplateKey;
  const selectedTemplate = effectiveTemplateKey ? getTemplateDefinition(templates, effectiveTemplateKey) : null;
  const orderedTemplates = [
    ...templates.filter(template => template.key === "full-suite"),
    ...templates.filter(template => template.key !== "full-suite"),
  ];
  const mainBot = targetGuild
    ? findPrimaryBot(bootstrap.bots, targetGuild)
    : bootstrap.bots.find(bot => bot.role === "primary") || null;
  const secondaryBots = targetGuild ? findSecondaryBots(bootstrap.bots, targetGuild) : [];
  const selectedFocusedBot = isFocusedReturn && returnSlotIndex !== null ? secondaryBots[returnSlotIndex] || null : null;
  const configureFallbackHref = selectedTemplate && returnGuildId
    ? buildProvisionHref(returnGuildId, selectedTemplate.key, isFocusedReturn ? returnSlotIndex : undefined)
    : returnTo;
  const configureHref = selectedTemplate
    ? resolveTemplateConfigureHref({
        templates,
        bot: isFocusedReturn ? selectedFocusedBot : mainBot,
        guildId: returnGuildId || undefined,
        fallbackHref: configureFallbackHref,
      })
    : "";

  async function chooseTemplate(templateKey: string) {
    const nextTemplate = getTemplateDefinition(templates, templateKey);
    if (!nextTemplate) {
      return;
    }

    setLockedTemplateKey(templateKey);

    if (!isFocusedReturn && mainBot && returnGuildId) {
      await requestJson(`/api/bots/${mainBot.id}/guild-configs/${returnGuildId}`, {
        method: "PUT",
        body: JSON.stringify({
          overrides: buildGuildTemplateOverrides(nextTemplate),
        }),
      });
      await refresh();
    }

    router.replace(buildTemplateSelectorHref(returnTo, templateKey));
  }

  async function clearTemplateSelection() {
    clearTemplateKey();

    if (!isFocusedReturn && mainBot && returnGuildId) {
      await requestJson(`/api/bots/${mainBot.id}/guild-configs/${returnGuildId}`, {
        method: "PUT",
        body: JSON.stringify({
          overrides: {},
        }),
      });
      await refresh();
    }

    const nextReturnTo = stripTemplateFromHref(returnTo);
    router.replace(buildTemplateSelectorHref(nextReturnTo));
  }

  return (
    <section className={styles.pageSurface}>
      <SectionHeader
        eyebrow="Provision"
        title={targetGuild ? `Select a template for ${targetGuild.name}` : "Select a template"}
      />
      <div className={`${styles.inlineMeta} ${styles.inlineMetaCentered}`}>
        <span className={styles.chip}>1 Full Suite max</span>
        <span className={styles.chip}>4 focused bots max</span>
        {selectedTemplate ? <span className={styles.chip}>{selectedTemplate.name} selected</span> : null}
      </div>
      <div className={`${styles.pluginGrid} ${styles.templateGrid}`}>
        {orderedTemplates.map(template => (
          <article
            key={template.key}
            className={styles.card}
            style={selectedTemplate?.key === template.key ? { borderColor: "rgba(87, 173, 197, 0.24)" } : undefined}
          >
            <div className={styles.splitHeader}>
              <div>
                <h3 className={styles.cardTitle}>{template.name}</h3>
              </div>
              <div className={styles.inlineMeta}>
                <span className={styles.chip}>{template.key === "full-suite" ? "Full Suite" : "Focused"}</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              {selectedTemplate?.key === template.key ? (
                <>
                  <button type="button" className={styles.button} onClick={() => void clearTemplateSelection()}>
                    Deselect
                  </button>
                  {configureHref ? (
                    <Link href={configureHref} className={styles.buttonSecondary}>
                      {isFocusedReturn ? "Back to slot" : "Configure"}
                    </Link>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => void chooseTemplate(template.key)}
                >
                  Use template
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BotsPage() {
  return (
    <Suspense
      fallback={
        <section className={styles.pageSurface}>
          <SectionHeader title="Loading templates" />
        </section>
      }
    >
      <BotsPageContent />
    </Suspense>
  );
}

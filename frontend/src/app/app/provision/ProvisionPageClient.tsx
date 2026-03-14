"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuBoxes } from "react-icons/lu";
import { EmptyState, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { getEnabledModuleCards, getEnabledModuleEntities, getTemplateDefinition } from "@/lib/console";
import { useGuildTemplateDraft } from "@/lib/templateDraft";
import {
  buildFocusedBotsHref,
  buildProvisionHref,
  buildSetupHref,
  findPrimaryBot,
  findSecondaryBots,
} from "@/app/app/setup/setup-helpers";
import styles from "@/components/console/console.module.scss";

function ProvisionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bootstrap, loading, error } = useConsole();
  const guildId = searchParams.get("guild") || "";
  const templateKey = searchParams.get("template") || "";
  const slotParam = searchParams.get("slot") || "";
  const selectedSlotIndex = Number.parseInt(slotParam, 10);
  const hasSlotContext = Number.isInteger(selectedSlotIndex) && selectedSlotIndex >= 0 && selectedSlotIndex < 4;
  const templateDraftScope = hasSlotContext ? `slot-${selectedSlotIndex}` : "guild";
  const { templateKey: lockedTemplateKey } = useGuildTemplateDraft(guildId, templateKey, templateDraftScope);
  const effectiveTemplateKey = lockedTemplateKey || templateKey;

  useEffect(() => {
    if (!guildId || templateKey === lockedTemplateKey) {
      return;
    }

    if (!lockedTemplateKey) {
      router.replace(
        hasSlotContext
          ? buildFocusedBotsHref(guildId, undefined, selectedSlotIndex)
          : buildSetupHref(guildId),
      );
      return;
    }

    router.replace(buildProvisionHref(guildId, lockedTemplateKey, hasSlotContext ? selectedSlotIndex : undefined));
  }, [guildId, hasSlotContext, lockedTemplateKey, router, selectedSlotIndex, templateKey]);

  const targetGuild = useMemo(
    () => (guildId && bootstrap ? bootstrap.manageableGuilds.find(guild => guild.id === guildId) || null : null),
    [bootstrap, guildId],
  );
  const template = useMemo(
    () => (effectiveTemplateKey && bootstrap ? getTemplateDefinition(bootstrap.templates, effectiveTemplateKey) : null),
    [bootstrap, effectiveTemplateKey],
  );

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader eyebrow="Provision canvas" title="Loading provision canvas" />
      </section>
    );
  }

  if (error || !bootstrap || !targetGuild || !template) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Provision unavailable" description={error || "Provision data is not ready yet."} />
      </section>
    );
  }

  const backToSetupHref =
    template.key === "full-suite"
      ? buildSetupHref(guildId, effectiveTemplateKey || undefined)
      : buildFocusedBotsHref(guildId, effectiveTemplateKey || undefined, hasSlotContext ? selectedSlotIndex : undefined);
  const templateEntities = getEnabledModuleEntities(template);
  const secondaryBots = findSecondaryBots(bootstrap.bots, targetGuild);
  const selectedSecondaryBot =
    template.key === "full-suite"
      ? null
      : hasSlotContext
        ? secondaryBots[selectedSlotIndex] || null
        : secondaryBots.find(bot => bot.templateKey === template.key) || null;
  const targetBot = template.key === "full-suite" ? findPrimaryBot(bootstrap.bots, targetGuild) : selectedSecondaryBot;
  const enabledModuleCards = targetBot ? getEnabledModuleCards(bootstrap.templates, targetBot, guildId || undefined) : [];
  const enabledModuleCardMap = new Map(enabledModuleCards.map(card => [card.id, card]));

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Provision canvas"
          title={template.name}
          description={template.description || undefined}
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>{template.key === "full-suite" ? "Full Suite" : "Focused template"}</span>
          {hasSlotContext && template.key !== "full-suite" ? <span className={styles.chip}>Slot {selectedSlotIndex + 1}</span> : null}
          <span className={styles.chip}>{templateEntities.length} functions</span>
        </div>
        {!targetBot ? (
          <div className={styles.callout}>
            {template.key === "full-suite"
              ? "Install the Full Suite bot first."
              : "Link the focused bot first."}
          </div>
        ) : null}
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow={template.key === "full-suite" ? "Functions" : "Included systems"}
          title={targetBot ? "Open controls" : "Template systems"}
        />
        <div className={styles.setupSystemGrid}>
          {templateEntities.map(entity => {
            const moduleCard = enabledModuleCardMap.get(entity.id);
            return (
              <article key={entity.id} className={`${styles.card} ${styles.setupSystemCard}`}>
                <div className={styles.setupSystemHeader}>
                  <h3 className={styles.cardTitle}>{entity.label}</h3>
                  <LuBoxes className={styles.setupSidebarItemIcon} />
                </div>
                <div className={styles.setupSystemBody}>
                  <p className={styles.cardText}>
                    {moduleCard
                      ? "Open this module in the bot workspace."
                      : "This function is available once the bot is linked to the server."}
                  </p>
                  <div className={styles.cardActions}>
                    {moduleCard ? (
                      <Link href={moduleCard.href} className={styles.buttonSecondary}>
                        Open controls
                      </Link>
                    ) : (
                      <Link href={backToSetupHref} className={styles.buttonSecondary}>
                        {template.key === "full-suite" ? "Install bot first" : "Link bot first"}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default function ProvisionPage() {
  return (
    <Suspense
      fallback={
        <section className={styles.pageSurface}>
          <EmptyState title="Loading provision" description="Preparing template and module data." />
        </section>
      }
    >
      <ProvisionPageContent />
    </Suspense>
  );
}

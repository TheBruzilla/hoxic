"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LuBoxes,
  LuLayoutDashboard,
  LuPanelLeft,
  LuSparkles,
  LuWandSparkles,
} from "react-icons/lu";
import { EmptyState, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { getEnabledModuleCards, getEnabledModuleEntities, getEnabledModuleLabels, getTemplateDefinition } from "@/lib/console";
import { useGuildTemplateDraft } from "@/lib/templateDraft";
import {
  buildFocusedBotsHref,
  buildSetupHref,
  buildTemplateSelectorHref,
  findPrimaryBot,
  findSecondaryBots,
} from "@/app/app/setup/setup-helpers";
import styles from "@/components/console/console.module.scss";

function ProvisionPageContent() {
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
      <div className={styles.provisionShell}>
        <aside className={`${styles.setupSidebar} ${styles.provisionSidebar}`}>
          <div className={styles.setupSidebarHeader}>
            <div className={styles.setupSidebarIdentity}>
              <div className={styles.setupSidebarAvatar}>H</div>
              <div className={styles.setupSidebarIdentityText}>
                <span className={styles.setupSidebarEyebrow}>Provision</span>
                <h2 className={styles.setupSidebarName}>Loading…</h2>
              </div>
            </div>
          </div>
        </aside>
        <div className={styles.provisionMain}>
          <section className={styles.pageSurface}>
            <SectionHeader eyebrow="Provision canvas" title="Loading provision canvas" />
          </section>
        </div>
      </div>
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
  const templateSelectorHref = buildTemplateSelectorHref(backToSetupHref, effectiveTemplateKey || undefined);
  const currentProvisionHref = `/app/provision?guild=${encodeURIComponent(guildId)}${effectiveTemplateKey ? `&template=${encodeURIComponent(effectiveTemplateKey)}` : ""}${hasSlotContext ? `&slot=${selectedSlotIndex}` : ""}`;
  const enabledTemplateEntities = getEnabledModuleLabels(template);
  const templateEntities = enabledTemplateEntities.length > 0 ? enabledTemplateEntities : ["No systems mapped"];
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
  const sidebarSections = [
    {
      label: "Flow",
      items: [
        {
          id: "overview",
          label: "Server overview",
          icon: LuLayoutDashboard,
          href: backToSetupHref,
          active: false,
          external: false,
        },
        {
          id: "template-library",
          label: "Template library",
          icon: LuWandSparkles,
          href: templateSelectorHref,
          active: false,
          external: false,
        },
        {
          id: "provision-canvas",
          label: "Provision canvas",
          icon: LuPanelLeft,
          href: currentProvisionHref,
          active: true,
          external: false,
        },
      ],
    },
    {
      label: "Template",
      items: [
        {
          id: "selected-template",
          label: template.name,
          icon: LuWandSparkles,
          href: currentProvisionHref,
          active: true,
          external: false,
        },
        {
          id: "change-template",
          label: "Change template",
          icon: LuSparkles,
          href: templateSelectorHref,
          active: false,
          external: false,
        },
      ],
    },
    {
      label: template.key === "full-suite" ? "Functions" : "Included Systems",
      items: templateEntities.map(entity => ({
        id: `template-${entity.toLowerCase().replace(/\s+/g, "-")}`,
        label: entity,
        icon: LuBoxes,
        href: currentProvisionHref,
        active: false,
        external: false,
      })),
    },
  ];

  return (
    <div className={styles.provisionShell}>
      <aside className={`${styles.setupSidebar} ${styles.provisionSidebar}`}>
        <div
          className={styles.setupSidebarHeader}
          style={targetGuild.iconUrl ? { backgroundImage: `linear-gradient(180deg, rgba(5, 7, 13, 0.28), rgba(5, 7, 13, 0.82)), url(${targetGuild.iconUrl})` } : undefined}
        >
          <div className={styles.setupSidebarIdentity}>
            <div className={styles.setupSidebarAvatar}>
              {targetGuild.iconUrl ? (
                <span
                  className={styles.setupSidebarAvatarImage}
                  role="img"
                  aria-label={targetGuild.name}
                  style={{ backgroundImage: `url(${targetGuild.iconUrl})` }}
                />
              ) : (
                targetGuild.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(part => part.charAt(0).toUpperCase())
                  .join("") || "S"
              )}
            </div>
            <div className={styles.setupSidebarIdentityText}>
              <span className={styles.setupSidebarEyebrow}>Provision</span>
              <h2 className={styles.setupSidebarName}>{targetGuild.name}</h2>
            </div>
          </div>
        </div>

        <div className={styles.setupSidebarNav}>
          {sidebarSections.map(section => (
            <div key={section.label} className={styles.setupSidebarGroup}>
              <div className={styles.setupSidebarGroupTitle}>{section.label}</div>
              <div className={styles.setupSidebarItems}>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const className = `${styles.setupSidebarItem} ${item.active ? styles.setupSidebarItemActive : ""}`.trim();
                  return (
                    <Link key={item.id} href={item.href} className={className} aria-current={item.active ? "page" : undefined}>
                      <Icon className={styles.setupSidebarItemIcon} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className={styles.provisionMain}>
        <section className={styles.pageSurface}>
          <SectionHeader
            eyebrow="Provision canvas"
            title={template.name}
            actions={
              <>
                <Link href={templateSelectorHref} className={styles.buttonSecondary}>
                  <LuSparkles />
                  Change template
                </Link>
                <Link href={backToSetupHref} className={styles.buttonSecondary}>
                  <LuLayoutDashboard />
                  {template.key === "full-suite" ? "Back to setup" : "Back to focused setup"}
                </Link>
              </>
            }
          />
          <div className={styles.inlineMeta}>
            <span className={styles.chip}>{template.key === "full-suite" ? "Full Suite" : "Focused template"}</span>
            {hasSlotContext && template.key !== "full-suite" ? <span className={styles.chip}>Slot {selectedSlotIndex + 1}</span> : null}
            <span className={styles.chip}>{templateEntities.length} systems</span>
          </div>
          {template.description ? <p className={styles.cardText}>{template.description}</p> : null}
          {!targetBot ? (
            <div className={styles.callout}>
              {template.key === "full-suite"
                ? "Install the Full Suite bot first. The canvas below shows what this template will enable."
                : "Pick a template per slot, validate the bot token, then come back here to open template controls."}
            </div>
          ) : null}
        </section>

        <section className={styles.pageSurface}>
          <SectionHeader
            eyebrow={template.key === "full-suite" ? "Functions" : "Included systems"}
            title={targetBot ? "Open controls" : "Template systems"}
          />
          <div className={styles.setupSystemGrid}>
            {getEnabledModuleEntities(template).map(entity => {
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
                        : "Included in this template. Link or install the bot to configure its controls."}
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
      </div>
    </div>
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

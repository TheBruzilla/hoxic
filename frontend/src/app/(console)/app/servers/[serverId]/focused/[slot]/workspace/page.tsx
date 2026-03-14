"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findFocusedBotsForServer, findServerRecord, parseFocusedSlot, slotToIndex } from "@/features/flow/server-flow";
import { canonicalModuleLabelMap, getCanonicalTemplate, getCanonicalTemplateModules, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function FocusedWorkspaceOverviewPage() {
  const params = useParams<{ serverId: string; slot: string }>();
  const searchParams = useSearchParams();
  const serverId = String(params?.serverId || "");
  const slot = parseFocusedSlot(String(params?.slot || ""));
  const templateKey = String(searchParams.get("template") || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);

  if (!slot) {
    return (
      <GlassPanel>
        <EmptyState title="Invalid slot" description="Slot must be in the range 1 through 4." />
      </GlassPanel>
    );
  }

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Focused workspace unavailable" description="Server context was not found." />
      </GlassPanel>
    );
  }

  const focusedBots = findFocusedBotsForServer(bootstrap, server);
  const slotBot = focusedBots[slotToIndex(slot)] || null;
  const effectiveTemplateKey = isCanonicalTemplateKey(templateKey)
    ? templateKey
    : isCanonicalTemplateKey(slotBot?.templateKey || "")
      ? slotBot?.templateKey || ""
      : "";

  if (!effectiveTemplateKey) {
    return (
      <GlassPanel>
        <SectionHeader
          eyebrow={`Focused Slot ${slot}`}
          title="Dormant until provisioned"
          description="Choose a focused template and provision this slot before opening module placeholders."
        />
        <div className={styles.cardActions}>
          <Link href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/templates`} className={styles.button}>
            Choose Focused Template
          </Link>
        </div>
      </GlassPanel>
    );
  }

  const template = getCanonicalTemplate(effectiveTemplateKey);
  const modules = getCanonicalTemplateModules(effectiveTemplateKey);

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow={`Focused Bot Workspace · Slot ${slot}`}
          title={slotBot?.name || `Focused slot ${slot}`}
          description={`Template-scoped workspace for ${template?.name || effectiveTemplateKey}.`}
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>Template: {template?.name || effectiveTemplateKey}</span>
          <span className={styles.chip}>{modules.length} modules scoped</span>
        </div>
      </GlassPanel>
      <section className={styles.cardGrid}>
        {modules.map(moduleId => (
          <GlassCard key={moduleId}>
            <div className={styles.eyebrow}>Module Slot</div>
            <h2 className={styles.cardTitle}>{canonicalModuleLabelMap[moduleId] || moduleId}</h2>
            <p className={styles.cardText}>Focused module placeholder is preserved for later implementation.</p>
            <div className={styles.cardActions}>
              <Link
                href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/workspace/modules/${encodeURIComponent(moduleId)}?template=${encodeURIComponent(effectiveTemplateKey)}`}
                className={styles.buttonSecondary}
              >
                Open Module Placeholder
              </Link>
            </div>
          </GlassCard>
        ))}
      </section>
    </>
  );
}

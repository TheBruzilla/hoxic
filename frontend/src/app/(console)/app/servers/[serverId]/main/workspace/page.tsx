"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { findMainBotForServer, findServerRecord } from "@/features/flow/server-flow";
import { canonicalModuleLabelMap, getCanonicalTemplate, getCanonicalTemplateModules, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function MainWorkspaceOverviewPage() {
  const params = useParams<{ serverId: string }>();
  const searchParams = useSearchParams();
  const serverId = String(params?.serverId || "");
  const templateKey = String(searchParams.get("template") || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);
  const mainBot = findMainBotForServer(bootstrap, server);

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Main workspace unavailable" description="Server context was not found." />
      </GlassPanel>
    );
  }

  if (!isCanonicalTemplateKey(templateKey)) {
    return (
      <GlassPanel>
        <SectionHeader
          eyebrow="Main Workspace"
          title="Dormant until provisioned"
          description="A template must be selected and provisioned before the main workspace becomes active."
        />
        <div className={styles.cardActions}>
          <Link href={`/app/servers/${encodeURIComponent(serverId)}/main/templates`} className={styles.button}>
            Open Template Library
          </Link>
        </div>
      </GlassPanel>
    );
  }

  const template = getCanonicalTemplate(templateKey);
  const modules = getCanonicalTemplateModules(templateKey);

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Main Bot Workspace"
          title={mainBot?.name || "Main bot workspace"}
          description={`Template-scoped workspace for ${template?.name || templateKey}.`}
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>Template: {template?.name || templateKey}</span>
          <span className={styles.chip}>{modules.length} modules scoped</span>
        </div>
      </GlassPanel>
      <section className={styles.cardGrid}>
        {modules.map(moduleId => (
          <GlassCard key={moduleId}>
            <div className={styles.eyebrow}>Module Slot</div>
            <h2 className={styles.cardTitle}>{canonicalModuleLabelMap[moduleId] || moduleId}</h2>
            <p className={styles.cardText}>Placeholder route ready for later module implementation.</p>
            <div className={styles.cardActions}>
              <Link
                href={`/app/servers/${encodeURIComponent(serverId)}/main/workspace/modules/${encodeURIComponent(moduleId)}?template=${encodeURIComponent(templateKey)}`}
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

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { canonicalTemplates } from "@/lib/catalog/template-catalog";
import { findServerRecord } from "@/features/flow/server-flow";
import styles from "@/components/console/console.module.scss";

export default function MainTemplateLibraryPage() {
  const params = useParams<{ serverId: string }>();
  const serverId = String(params?.serverId || "");
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);

  if (!bootstrap || !server) {
    return (
      <GlassPanel>
        <EmptyState title="Template library unavailable" description="Server context not found." />
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Template Library"
          title={`Main templates for ${server.name}`}
          description="This route intentionally remains no-sidebar. Selecting a template opens provisioning flow."
        />
      </GlassPanel>
      <section className={styles.cardGrid}>
        {canonicalTemplates.map(template => (
          <GlassCard key={template.key}>
            <div className={styles.eyebrow}>{template.key === "full-suite" ? "Main candidate" : "Template option"}</div>
            <h2 className={styles.cardTitle}>{template.name}</h2>
            <p className={styles.cardText}>{template.description}</p>
            <div className={styles.inlineMeta}>
              <span className={styles.chip}>{template.moduleIds.length} modules</span>
            </div>
            <div className={styles.cardActions}>
              <Link
                href={`/app/servers/${encodeURIComponent(serverId)}/main/templates/${encodeURIComponent(template.key)}`}
                className={styles.button}
              >
                Choose Template
              </Link>
            </div>
          </GlassCard>
        ))}
      </section>
    </>
  );
}

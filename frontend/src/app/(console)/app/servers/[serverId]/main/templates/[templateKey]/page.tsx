"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { canonicalModuleLabelMap, getCanonicalTemplate, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function MainTemplateProvisionPage() {
  const params = useParams<{ serverId: string; templateKey: string }>();
  const serverId = String(params?.serverId || "");
  const templateKey = String(params?.templateKey || "");

  if (!isCanonicalTemplateKey(templateKey)) {
    return (
      <GlassPanel>
        <EmptyState title="Unknown template" description={`Template '${templateKey}' is not in canonical catalog.`} />
      </GlassPanel>
    );
  }

  const template = getCanonicalTemplate(templateKey);
  if (!template) {
    return (
      <GlassPanel>
        <EmptyState title="Template unavailable" description="Template lookup returned no record." />
      </GlassPanel>
    );
  }

  const provisionSuccessHref = `/app/servers/${encodeURIComponent(serverId)}/main/templates/${encodeURIComponent(template.key)}/provision-success`;
  const dormantHref = `/app/servers/${encodeURIComponent(serverId)}/main/templates/${encodeURIComponent(template.key)}/dormant`;

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow="Provisioning Modal"
          title={`Main template: ${template.name}`}
          description="This page represents controlled provisioning state; implementation remains flow-first."
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>Template key: {template.key}</span>
          <span className={styles.chip}>{template.moduleIds.length} module slots</span>
        </div>
      </GlassPanel>
      <section className={styles.cardGrid}>
        <GlassCard>
          <div className={styles.eyebrow}>Provision main bot</div>
          <h2 className={styles.cardTitle}>Activate workspace with this template</h2>
          <p className={styles.cardText}>
            Provisioning marks this main bot flow as active. Invite state alone does not activate modules.
          </p>
          <div className={styles.cardActions}>
            <Link href={provisionSuccessHref} className={styles.button}>Provision Main Bot</Link>
            <Link href={dormantHref} className={styles.buttonSecondary}>Unprovision / Dormant</Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.eyebrow}>Template-scoped modules</div>
          <h2 className={styles.cardTitle}>Module slots preserved</h2>
          <div className={styles.list}>
            {template.moduleIds.map(moduleId => (
              <span key={moduleId} className={styles.chip}>
                {canonicalModuleLabelMap[moduleId] || moduleId}
              </span>
            ))}
          </div>
        </GlassCard>
      </section>
    </>
  );
}

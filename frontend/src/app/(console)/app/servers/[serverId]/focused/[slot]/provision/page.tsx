"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { parseFocusedSlot } from "@/features/flow/server-flow";
import { canonicalModuleLabelMap, getCanonicalTemplate, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function FocusedProvisionPage() {
  const params = useParams<{ serverId: string; slot: string }>();
  const searchParams = useSearchParams();
  const serverId = String(params?.serverId || "");
  const slot = parseFocusedSlot(String(params?.slot || ""));
  const templateKey = String(searchParams.get("template") || "");

  if (!slot) {
    return (
      <GlassPanel>
        <EmptyState title="Invalid slot" description="Slot must be in the range 1 through 4." />
      </GlassPanel>
    );
  }

  if (!isCanonicalTemplateKey(templateKey) || templateKey === "full-suite") {
    return (
      <GlassPanel>
        <EmptyState
          title="Template required"
          description="Focused provisioning requires a non-full-suite template."
          action={
            <Link
              href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/templates`}
              className={styles.buttonSecondary}
            >
              Choose template
            </Link>
          }
        />
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

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow={`Focused Slot ${slot}`}
          title={`Provision ${template.name}`}
          description="Provisioning activates the focused workspace for this slot."
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>Template key: {template.key}</span>
          <span className={styles.chip}>Slot: {slot}</span>
        </div>
      </GlassPanel>
      <section className={styles.cardGrid}>
        <GlassCard>
          <div className={styles.eyebrow}>Provision focused bot</div>
          <h2 className={styles.cardTitle}>Activate slot workspace</h2>
          <p className={styles.cardText}>Until provisioned, the slot remains dormant.</p>
          <div className={styles.cardActions}>
            <Link
              href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/provision-success?template=${encodeURIComponent(template.key)}`}
              className={styles.button}
            >
              Provision Slot
            </Link>
            <Link
              href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/dormant?template=${encodeURIComponent(template.key)}`}
              className={styles.buttonSecondary}
            >
              Keep Dormant
            </Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.eyebrow}>Template module scope</div>
          <h2 className={styles.cardTitle}>Focused module set</h2>
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

import Link from "next/link";
import { EmptyState, GlassCard, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { parseFocusedSlot } from "@/features/flow/server-flow";
import { canonicalTemplates } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default async function FocusedSlotTemplatesPage({
  params,
}: {
  params: Promise<{ serverId: string; slot: string }>;
}) {
  const { serverId, slot: slotParam } = await params;
  const slot = parseFocusedSlot(slotParam);

  if (!slot) {
    return (
      <GlassPanel>
        <EmptyState title="Invalid slot" description="Slot must be in the range 1 through 4." />
      </GlassPanel>
    );
  }

  const focusedTemplates = canonicalTemplates.filter(template => template.key !== "full-suite");

  return (
    <>
      <GlassPanel>
        <SectionHeader
          eyebrow={`Focused Slot ${slot}`}
          title="Choose focused template"
          description="Focused slots cannot use the full-suite template."
        />
      </GlassPanel>
      <section className={styles.cardGrid}>
        {focusedTemplates.map(template => (
          <GlassCard key={template.key}>
            <div className={styles.eyebrow}>Focused template</div>
            <h2 className={styles.cardTitle}>{template.name}</h2>
            <p className={styles.cardText}>{template.description}</p>
            <div className={styles.inlineMeta}>
              <span className={styles.chip}>{template.moduleIds.length} modules</span>
            </div>
            <div className={styles.cardActions}>
              <Link
                href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/provision?template=${encodeURIComponent(template.key)}`}
                className={styles.button}
              >
                Provision Focused Bot
              </Link>
            </div>
          </GlassCard>
        ))}
      </section>
    </>
  );
}

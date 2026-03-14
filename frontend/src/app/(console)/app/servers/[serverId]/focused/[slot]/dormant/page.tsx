"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { parseFocusedSlot } from "@/features/flow/server-flow";
import { isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function FocusedDormantPage() {
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

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow={`Focused Slot ${slot}`}
        title="Slot remains dormant"
        description="Unprovisioned focused slots are preserved and intentionally dormant."
      />
      <div className={styles.callout}>
        {isCanonicalTemplateKey(templateKey)
          ? `Template ${templateKey} was selected but not activated.`
          : "No focused template is active for this slot."}
      </div>
      <div className={styles.cardActions}>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/templates`} className={styles.button}>
          Select Template
        </Link>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}/focused`} className={styles.buttonSecondary}>
          Back to Slot Board
        </Link>
      </div>
    </GlassPanel>
  );
}

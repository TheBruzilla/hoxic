"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { parseFocusedSlot } from "@/features/flow/server-flow";
import { isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default function FocusedProvisionSuccessPage() {
  const params = useParams<{ serverId: string; slot: string }>();
  const searchParams = useSearchParams();
  const serverId = String(params?.serverId || "");
  const slot = parseFocusedSlot(String(params?.slot || ""));
  const templateKey = String(searchParams.get("template") || "");

  if (!slot || !isCanonicalTemplateKey(templateKey) || templateKey === "full-suite") {
    return (
      <GlassPanel>
        <EmptyState title="Provision state invalid" description="Focused slot success requires a valid focused template." />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow={`Focused Slot ${slot}`}
        title="Provision success"
        description={`Template ${templateKey} is now active for this focused slot workspace.`}
      />
      <div className={styles.cardActions}>
        <Link
          href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/workspace?template=${encodeURIComponent(templateKey)}`}
          className={styles.button}
        >
          Open Focused Workspace
        </Link>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}/focused`} className={styles.buttonSecondary}>
          Back to Focused Slot Board
        </Link>
      </div>
    </GlassPanel>
  );
}

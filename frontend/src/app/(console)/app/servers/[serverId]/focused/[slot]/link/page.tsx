import Link from "next/link";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { parseFocusedSlot } from "@/features/flow/server-flow";
import styles from "@/components/console/console.module.scss";

export default async function FocusedSlotLinkPage({
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

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow={`Focused Slot ${slot}`}
        title="Link custom bot"
        description="Token validation and deep bot linking remain backend contract driven. This page owns route and flow structure."
      />
      <div className={styles.callout}>
        Slot {slot} is structurally reserved. Continue to template selection to provision this focused workspace.
      </div>
      <div className={styles.cardActions}>
        <Link
          href={`/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/templates`}
          className={styles.button}
        >
          Choose Focused Template
        </Link>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}/focused`} className={styles.buttonSecondary}>
          Back to Slot Board
        </Link>
      </div>
    </GlassPanel>
  );
}

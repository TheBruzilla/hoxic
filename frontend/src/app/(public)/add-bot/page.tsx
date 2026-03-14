import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";
import flowStyles from "@/features/flow/rewrite-flow.module.scss";

export default function AddBotPage() {
  return (
    <GlassCard>
      <SectionHeader
        eyebrow="Add Bot"
        title="Bot linking and invitation are separate from activation"
        description="Invite means present in server. Provisioned template means active workspace."
      />
      <div className={flowStyles.pillRow}>
        <span className={flowStyles.summaryChip}>Invite != Active</span>
        <span className={flowStyles.summaryChip}>Provisioned = Active</span>
        <span className={flowStyles.summaryChip}>Unprovisioned = Dormant</span>
      </div>
      <div className={styles.cardActions}>
        <Link href="/login" className={styles.button}>Login to continue</Link>
        <Link href="/app/servers" className={styles.buttonSecondary}>Open Server Directory</Link>
      </div>
    </GlassCard>
  );
}

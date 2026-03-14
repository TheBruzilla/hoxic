import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";

export default function AddBotPage() {
  return (
    <GlassCard>
      <SectionHeader
        eyebrow="Add Bot"
        title="Bot linking and invitation are separate from activation"
        description="Invite means present in server. Provisioned template means active workspace."
      />
      <div className={styles.cardActions}>
        <Link href="/login" className={styles.button}>Login to continue</Link>
        <Link href="/app/servers" className={styles.buttonSecondary}>Open Server Directory</Link>
      </div>
    </GlassCard>
  );
}

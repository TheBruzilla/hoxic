import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";
import flowStyles from "@/features/flow/rewrite-flow.module.scss";

export default function LoginPage() {
  return (
    <GlassCard>
      <SectionHeader
        eyebrow="Login"
        title="Continue with Discord OAuth"
        description="Authentication is handled by backend contracts. Successful login lands in the new server directory flow."
      />
      <div className={flowStyles.summaryRow}>
        <span className={flowStyles.summaryChip}>OAuth Entry</span>
        <span className={flowStyles.summaryChip}>Session Bootstrap</span>
        <span className={flowStyles.summaryChip}>Server Directory Landing</span>
      </div>
      <div className={styles.cardActions}>
        <a href="/auth/login" className={styles.button}>Sign in with Discord</a>
        <Link href="/app/servers" className={styles.buttonSecondary}>Go to server directory</Link>
      </div>
    </GlassCard>
  );
}

import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";

export default function PublicHomePage() {
  return (
    <>
      <GlassCard>
        <SectionHeader
          eyebrow="Homepage"
          title="Controlled frontend rewrite program"
          description="Frontend flow has been redefined around server directory, overview hub, template-scoped workspaces, and dormant module placeholders."
        />
        <div className={styles.inlineMeta}>
          <span className={styles.chip}>Batch-based</span>
          <span className={styles.chip}>Ledger-tracked</span>
          <span className={styles.chip}>Anti-drift</span>
          <span className={styles.chip}>Template-scoped workspaces</span>
        </div>
        <div className={styles.cardActions}>
          <Link href="/docs" className={styles.buttonSecondary}>Docs</Link>
          <Link href="/pricing" className={styles.buttonSecondary}>Pricing</Link>
          <Link href="/add-bot" className={styles.buttonSecondary}>Add Bot</Link>
          <Link href="/login" className={styles.button}>Login</Link>
        </div>
      </GlassCard>
      <GlassCard>
        <SectionHeader
          eyebrow="Product flow"
          title="Homepage -> Login -> Server Directory -> Overview Hub -> Workspace"
          description="The dashboard no longer uses the previous mixed module dump. Main bot and focused bots are explicitly separated."
        />
      </GlassCard>
    </>
  );
}

import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";
import flowStyles from "@/features/flow/rewrite-flow.module.scss";

export default function PublicDocsPage() {
  return (
    <GlassCard>
      <SectionHeader
        eyebrow="Docs"
        title="Frontend rewrite governance"
        description="Canonical source of module and template truth remains in frontend/shared/template-catalog.json and architecture docs."
      />
      <p className={styles.cardText}>
        The rewrite follows backend-style execution discipline with FR batches, anti-drift ledger notes, and compatibility wrappers.
      </p>
      <div className={flowStyles.summaryRow}>
        <span className={flowStyles.summaryChip}>Canonical Catalog</span>
        <span className={flowStyles.summaryChip}>Batch Ledger</span>
        <span className={flowStyles.summaryChip}>Route Ownership</span>
      </div>
      <div className={styles.cardActions}>
        <Link href="/login" className={styles.button}>
          Continue to Login
        </Link>
      </div>
    </GlassCard>
  );
}

import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";
import flowStyles from "@/features/flow/rewrite-flow.module.scss";

export default function PublicHomePage() {
  return (
    <div className={flowStyles.heroStack}>
      <section className={flowStyles.heroPanel}>
        <div className={flowStyles.summaryRow}>
          <span className={flowStyles.summaryChip}>Controlled Rewrite</span>
          <span className={flowStyles.summaryChip}>Frontend FR0-FR7</span>
          <span className={flowStyles.summaryChip}>Anti-Drift</span>
        </div>
        <h1 className={flowStyles.heroTitle}>A deliberate dashboard system, not a route patch pass.</h1>
        <p className={flowStyles.heroSubline}>
          The frontend now follows a product-owned flow from homepage and login to server directory, overview hub,
          template provisioning, and workspace-scoped modules with explicit dormant placeholder states.
        </p>
        <div className={styles.cardActions}>
          <Link href="/docs" className={styles.buttonSecondary}>Docs</Link>
          <Link href="/pricing" className={styles.buttonSecondary}>Pricing</Link>
          <Link href="/add-bot" className={styles.buttonSecondary}>Add Bot</Link>
          <Link href="/login" className={styles.button}>Login</Link>
        </div>
      </section>
      <GlassCard>
        <SectionHeader eyebrow="Flow Highlights" title="Product-owned route chain" />
        <div className={flowStyles.flowGrid}>
          <article className={flowStyles.flowCard}>
            <h3 className={flowStyles.flowCardTitle}>Public Entry</h3>
            <p className={flowStyles.flowCardText}>Homepage, docs, pricing, add-bot, and login live in a no-sidebar public shell.</p>
          </article>
          <article className={flowStyles.flowCard}>
            <h3 className={flowStyles.flowCardTitle}>Server Control</h3>
            <p className={flowStyles.flowCardText}>Server directory and overview hub separate main bot and focused bot ownership from the start.</p>
          </article>
          <article className={flowStyles.flowCard}>
            <h3 className={flowStyles.flowCardTitle}>Workspace Scope</h3>
            <p className={flowStyles.flowCardText}>Sidebar appears only in main/focused workspaces and module routes, never in pre-workspace flows.</p>
          </article>
        </div>
      </GlassCard>
      <GlassCard>
        <SectionHeader eyebrow="State Model" title="Explicit provisioning semantics" />
        <div className={flowStyles.flowGrid}>
          <div className={flowStyles.metricPanel}>
            <p className={flowStyles.metricLabel}>Invite</p>
            <p className={flowStyles.metricValue}>Present</p>
          </div>
          <div className={flowStyles.metricPanel}>
            <p className={flowStyles.metricLabel}>Provisioned</p>
            <p className={flowStyles.metricValue}>Active</p>
          </div>
          <div className={flowStyles.metricPanel}>
            <p className={flowStyles.metricLabel}>Unprovisioned</p>
            <p className={flowStyles.metricValue}>Dormant</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

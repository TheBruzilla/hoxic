import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";

export default function PricingPage() {
  return (
    <GlassCard>
      <SectionHeader
        eyebrow="Pricing"
        title="Premium gating remains template and entitlement aware"
        description="Pricing and premium controls are scoped for later module implementation. Frontend flow ownership is finalized first."
      />
      <div className={styles.inlineMeta}>
        <span className={styles.chip}>Main bot and focused bot separation</span>
        <span className={styles.chip}>No mixed module dump</span>
      </div>
      <div className={styles.cardActions}>
        <Link href="/add-bot" className={styles.buttonSecondary}>Add Bot</Link>
        <Link href="/login" className={styles.button}>Login</Link>
      </div>
    </GlassCard>
  );
}

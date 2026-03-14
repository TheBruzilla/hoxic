import Link from "next/link";
import { GlassCard, SectionHeader } from "@/components/console/ConsolePrimitives";
import styles from "@/components/console/console.module.scss";

export default function LoginPage() {
  return (
    <GlassCard>
      <SectionHeader
        eyebrow="Login"
        title="Continue with Discord OAuth"
        description="Authentication is handled by backend contracts. Successful login lands in the new server directory flow."
      />
      <div className={styles.cardActions}>
        <a href="/auth/login" className={styles.button}>Sign in with Discord</a>
        <Link href="/app/servers" className={styles.buttonSecondary}>Go to server directory</Link>
      </div>
    </GlassCard>
  );
}

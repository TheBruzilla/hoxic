"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./rewrite-shells.module.scss";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  function getLinkClass(href: string) {
    return pathname === href ? styles.navLinkActive : styles.navLink;
  }

  return (
    <div className={styles.publicRoot}>
      <header className={styles.publicHeader}>
        <div className={styles.publicHeaderInner}>
          <div className={styles.brandBlock}>
            <p className={styles.brandKicker}>Public Experience</p>
            <p className={styles.brandName}>HOXiq</p>
            <p className={styles.brandMeta}>Controlled SaaS bot management flow</p>
            <div className={styles.statusRow}>
              <span className={styles.statusPill}>Rewrite Active</span>
              <span className={`${styles.statusPill} ${styles.statusPillStrong}`}>FR Program</span>
            </div>
          </div>
          <nav className={styles.navRow} aria-label="Public navigation">
            <Link href="/" className={getLinkClass("/")}>Home</Link>
            <Link href="/docs" className={getLinkClass("/docs")}>Docs</Link>
            <Link href="/pricing" className={getLinkClass("/pricing")}>Pricing</Link>
            <Link href="/add-bot" className={getLinkClass("/add-bot")}>Add Bot</Link>
            <Link href="/login" className={getLinkClass("/login")}>Login</Link>
          </nav>
        </div>
      </header>
      <main className={styles.publicMain}>{children}</main>
      <footer className={styles.publicFooter}>
        <div className={styles.publicFooterInner}>
          Frontend rewrite contract enforced. Flow-first architecture and template-scoped placeholders are active.
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./rewrite-shells.module.scss";

export function ConsoleFlowShell({
  children,
  serverId,
}: {
  children: React.ReactNode;
  serverId?: string;
}) {
  const pathname = usePathname() ?? "";

  const linkRows: Array<{ href: string; label: string }> = serverId
    ? [
        { href: "/app/servers", label: "Server Directory" },
        { href: `/app/servers/${encodeURIComponent(serverId)}`, label: "Overview Hub" },
        { href: `/app/servers/${encodeURIComponent(serverId)}/main/templates`, label: "Template Library" },
        { href: `/app/servers/${encodeURIComponent(serverId)}/focused`, label: "Focused Slot Board" },
      ]
    : [{ href: "/app/servers", label: "Server Directory" }];

  return (
    <div className={styles.consoleRoot}>
      <header className={styles.consoleHeader}>
        <div className={styles.consoleHeaderInner}>
          <div className={styles.brandBlock}>
            <p className={styles.brandName}>HOXiq Console Flow</p>
            <p className={styles.brandMeta}>No-sidebar shell for directory, hub, and provisioning surfaces</p>
          </div>
          <nav className={styles.navRow} aria-label="Console flow navigation">
            {linkRows.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? styles.navLinkActive : styles.navLink}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.consoleMain}>{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useConsole } from "@/components/console/ConsoleProvider";
import { canonicalModuleLabelMap, getCanonicalTemplateModules } from "@/lib/catalog/template-catalog";
import { coerceTemplateKey, findFocusedBotsForServer, findMainBotForServer, findServerRecord, slotToIndex } from "@/features/flow/server-flow";
import styles from "./rewrite-shells.module.scss";

interface WorkspaceShellProps {
  children: React.ReactNode;
  serverId: string;
  scope: "main" | "focused";
  slot?: number;
}

function buildModuleHref(
  serverId: string,
  scope: "main" | "focused",
  moduleId: string,
  templateKey: string,
  slot?: number,
) {
  if (scope === "focused" && slot) {
    return `/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/workspace/modules/${encodeURIComponent(moduleId)}?template=${encodeURIComponent(templateKey)}`;
  }

  return `/app/servers/${encodeURIComponent(serverId)}/main/workspace/modules/${encodeURIComponent(moduleId)}?template=${encodeURIComponent(templateKey)}`;
}

export function WorkspaceShell({
  children,
  serverId,
  scope,
  slot,
}: WorkspaceShellProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { bootstrap } = useConsole();
  const server = findServerRecord(bootstrap, serverId);
  const templateFromQuery = coerceTemplateKey(searchParams.get("template"));
  const fallbackTemplateKey = (() => {
    if (!bootstrap || !server) {
      return "";
    }

    if (scope === "focused" && slot) {
      const focusedBots = findFocusedBotsForServer(bootstrap, server);
      const bot = focusedBots[slotToIndex(slot)] || null;
      return coerceTemplateKey(bot?.templateKey || "");
    }

    const mainBot = findMainBotForServer(bootstrap, server);
    return coerceTemplateKey(mainBot?.templateKey || "");
  })();
  const templateKey = templateFromQuery || fallbackTemplateKey;
  const scopedModules = templateKey ? getCanonicalTemplateModules(templateKey) : [];
  const overviewHref =
    scope === "focused" && slot
      ? `/app/servers/${encodeURIComponent(serverId)}/focused/${slot}/workspace${templateKey ? `?template=${encodeURIComponent(templateKey)}` : ""}`
      : `/app/servers/${encodeURIComponent(serverId)}/main/workspace${templateKey ? `?template=${encodeURIComponent(templateKey)}` : ""}`;
  const overviewPath = overviewHref.split("?")[0];

  return (
    <div className={styles.workspaceRoot}>
      <aside className={styles.workspaceSidebar}>
        <p className={styles.workspaceSidebarTitle}>
          {scope === "main" ? "Main Bot Workspace" : `Focused Bot Workspace · Slot ${slot}`}
        </p>
        <p className={styles.workspaceMeta}>Server: {server?.name || serverId}</p>
        <p className={styles.workspaceMeta}>Template: {templateKey || "Not selected"}</p>
        <nav className={styles.workspaceNav} aria-label="Workspace navigation">
          <Link href={overviewHref} className={pathname === overviewPath ? styles.navLinkActive : styles.navLink}>
            Workspace Overview
          </Link>
          {scopedModules.map(moduleId => {
            const href = buildModuleHref(serverId, scope, moduleId, templateKey, slot);
            const hrefPath = href.split("?")[0];
            return (
              <Link key={moduleId} href={href} className={pathname === hrefPath ? styles.navLinkActive : styles.navLink}>
                {canonicalModuleLabelMap[moduleId] || moduleId}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className={styles.workspaceMain}>{children}</main>
    </div>
  );
}

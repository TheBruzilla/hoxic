"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { BotWorkspacePayload, appNavSections, displayName, getSelectedBotNavSections, requestJson } from "@/lib/console";
import { buildFocusedBotsHref, buildSetupHref } from "@/app/app/setup/setup-helpers";
import { useConsole } from "./ConsoleProvider";
import { AuthGate, Badge } from "./ConsolePrimitives";
import styles from "./console.module.scss";

function buildReturnPath(returnTo: string, templateKey?: string) {
  try {
    const target = new URL(returnTo, "http://localhost");
    if (templateKey) {
      target.searchParams.set("template", templateKey);
    } else {
      target.searchParams.delete("template");
    }
    return `${target.pathname}${target.search}`;
  } catch {
    return "/app";
  }
}

export function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/app";
  const searchParams = useSearchParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [workspaceServerLabel, setWorkspaceServerLabel] = useState<string>("");
  const { bootstrap, unauthorized } = useConsole();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const user = bootstrap?.me ?? null;
  const userName = displayName(user);
  const currentBotId = pathname.startsWith("/app/bots/") ? pathname.split("/")[3] || "" : "";
  const focusedGuildId = searchParams.get("guild") || "";
  const returnTo = searchParams.get("returnTo") || "";
  const selectedTemplateKey = searchParams.get("template") || "";
  const templateSelectorGuildId = useMemo(() => {
    if (!returnTo) return "";
    try {
      return new URL(returnTo, "http://localhost").searchParams.get("guild") || "";
    } catch {
      return "";
    }
  }, [returnTo]);
  const focusedGuild = focusedGuildId
    ? bootstrap?.manageableGuilds?.find(guild => guild.id === focusedGuildId) || null
    : null;
  const templateSelectorGuild = templateSelectorGuildId
    ? bootstrap?.manageableGuilds?.find(guild => guild.id === templateSelectorGuildId) || null
    : null;
  const isServerDirectory = pathname === "/app";
  const isMainBotIndex = pathname === "/app/bots";
  const isBotWorkspace = pathname.startsWith("/app/bots/");
  const isGuildSetup = pathname === "/app/setup" && Boolean(focusedGuildId);
  const isFocusedSetup = pathname === "/app/setup/focused" && Boolean(focusedGuildId);
  const isProvisionPage = pathname === "/app/provision" && Boolean(focusedGuildId);
  const isHeaderlessRoute = false;
  const showSidebar = !(
    isServerDirectory ||
    isMainBotIndex ||
    isBotWorkspace ||
    isGuildSetup ||
    isFocusedSetup ||
    isProvisionPage
  );
  const currentBot = currentBotId ? bootstrap?.bots.find(item => item.id === currentBotId) || null : null;
  const currentHeartbeat = currentBot ? bootstrap?.heartbeats.find(item => item.botInstanceId === currentBot.id) || null : null;

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaceServerLabel() {
      if (!currentBotId) {
        setWorkspaceServerLabel("");
        return;
      }

      try {
        const payload = await requestJson<BotWorkspacePayload>(`/api/bots/${currentBotId}`);
        if (cancelled) return;

        if (focusedGuildId) {
          const focusedGuild = payload.guilds.find(guild => guild.id === focusedGuildId);
          if (focusedGuild) {
            setWorkspaceServerLabel(focusedGuild.name);
            return;
          }
        }

        const names = payload.guilds.map(guild => guild.name).filter(Boolean);
        if (names.length === 0) {
          setWorkspaceServerLabel("No server");
          return;
        }

        if (names.length === 1) {
          setWorkspaceServerLabel(names[0]);
          return;
        }

        const visible = names.slice(0, 2).join(", ");
        const remaining = names.length - 2;
        setWorkspaceServerLabel(remaining > 0 ? `${visible} +${remaining}` : visible);
      } catch {
        if (!cancelled) {
          setWorkspaceServerLabel(currentBot?.name ?? "Unknown server");
        }
      }
    }

    void loadWorkspaceServerLabel();

    return () => {
      cancelled = true;
    };
  }, [currentBot?.name, currentBotId, focusedGuildId]);
  const workspaceLabel = currentBot
    ? workspaceServerLabel || `${currentHeartbeat?.guildCount || 0} servers`
    : isServerDirectory
      ? "Server Directory"
      : isMainBotIndex
      ? templateSelectorGuild?.name || "Main Bot"
      : isProvisionPage
      ? focusedGuild?.name || "Provision"
      : isFocusedSetup
      ? focusedGuild?.name || "Focused Setup"
      : isGuildSetup
      ? focusedGuild?.name || "Server Setup"
      : pathname.startsWith("/app/bots")
      ? "Bot Fleet"
      : "Global Fleet";
  const navSections = useMemo(
    () => [...appNavSections, ...getSelectedBotNavSections(bootstrap?.templates || [], currentBot, focusedGuildId || undefined)],
    [bootstrap?.templates, currentBot, focusedGuildId],
  );
  const activeNavId = useMemo(() => {
    let activeId = "";
    let longestMatch = 0;

    for (const section of navSections) {
      for (const item of section.items) {
        const itemPath = item.href.split("?")[0] || item.href;
        const matches = item.exact
          ? pathname === itemPath
          : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
        if (matches && itemPath.length >= longestMatch) {
          activeId = item.id;
          longestMatch = itemPath.length;
        }
      }
    }

    return activeId;
  }, [navSections, pathname]);
  const pageBackLink = useMemo(() => {
    if (pathname === "/app/setup" && focusedGuildId) {
      return { href: "/app", label: "Back to servers" };
    }

    if (pathname === "/app/setup/focused" && focusedGuildId) {
      return {
        href: buildSetupHref(focusedGuildId, selectedTemplateKey || undefined),
        label: "Back to setup",
      };
    }

    if (pathname === "/app/provision" && focusedGuildId) {
      return {
        href:
          selectedTemplateKey === "full-suite"
            ? buildSetupHref(focusedGuildId, selectedTemplateKey || undefined)
            : buildFocusedBotsHref(focusedGuildId, selectedTemplateKey || undefined),
        label: "Back to setup",
      };
    }

    if (pathname === "/app/bots" && returnTo) {
      return { href: buildReturnPath(returnTo, selectedTemplateKey || undefined), label: "Back to setup" };
    }

    if (pathname === "/app/runtime" || pathname === "/app/operators" || pathname === "/app/plugins") {
      return { href: "/app", label: "Back to servers" };
    }

    return null;
  }, [focusedGuildId, pathname, returnTo, selectedTemplateKey]);

  if (unauthorized) {
    return <AuthGate />;
  }

  return (
    <div
      className={`${styles.shell} ${showSidebar ? "" : styles.shellNoSidebar} ${isProvisionPage ? styles.shellProvision : ""} ${isHeaderlessRoute ? styles.shellHeaderless : ""}`.trim()}
    >
      {!isHeaderlessRoute ? (
        <section className={styles.topbar}>
          <div className={styles.leftCluster}>
            {showSidebar ? (
              <div className={styles.mobileMenuSlot}>
                <button
                  type="button"
                  className={`${styles.buttonSecondary} ${styles.menuToggle}`}
                  aria-expanded={mobileNavOpen}
                  aria-controls="console-sidebar"
                  aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                  onClick={() => setMobileNavOpen(current => !current)}
                >
                  <span className={styles.menuToggleBars} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              </div>
            ) : null}
          </div>
          <div className={styles.brandLockup}>
            <span className={styles.brandIconWrap}>
              <Image src="/hoxic-icon.png" alt="HOXiq" width={54} height={54} className={styles.brandIcon} />
            </span>
            <div className={styles.brandText}>
              <div className={styles.brandWordmark} aria-label="HOXiq">
                <span className={styles.brandWordmarkStrong}>HOX</span>
                <span className={styles.brandWordmarkSoft}>iq</span>
              </div>
            </div>
          </div>
          <div className={styles.logoutPanel}>
            <button
              type="button"
              className={`${styles.buttonSecondary} ${styles.desktopLogout}`}
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                await fetch("/auth/logout", { method: "POST", credentials: "include" });
                window.location.href = "/";
              }}
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </section>
      ) : null}

      {showSidebar && mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className={styles.mobileNavScrim}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {showSidebar ? (
        <aside
          id="console-sidebar"
          className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ""}`}
        >
          <div className={styles.sidebarPanel}>
            <div className={styles.mobileDrawerMeta}>
              <div className={styles.operatorMeta}>
                <span className={styles.operatorLabel}>Server</span>
                <span className={styles.operatorValue}>{workspaceLabel}</span>
              </div>
              <div className={styles.operatorMeta}>
                <span className={styles.operatorLabel}>User</span>
                <span className={styles.operatorValue}>{userName}</span>
              </div>
            </div>
            <div className={styles.navScroll}>
              {navSections.map(section => (
                <div className={styles.navGroup} key={`${section.label || "nav"}-${section.items[0]?.id || "group"}`}>
                  {section.label ? <div className={styles.navGroupTitle}>{section.label}</div> : null}
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const active = activeNavId === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <Icon className={styles.navIcon} />
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge ? (
                          <Badge
                            label={item.badge}
                            tone={
                              item.badgeTone === "beta"
                                ? "beta"
                                : item.badgeTone === "premium"
                                  ? "premium"
                                  : item.badgeTone === "new"
                                    ? "new"
                                    : "soft"
                            }
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className={styles.mobileSidebarFooter}>
              <button
                type="button"
                className={styles.buttonSecondary}
                disabled={loggingOut}
                onClick={async () => {
                  setLoggingOut(true);
                  await fetch("/auth/logout", { method: "POST", credentials: "include" });
                  window.location.href = "/";
                }}
              >
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      <main className={styles.main}>
        {pageBackLink ? (
          <div className={styles.pageBackRow}>
            <Link href={pageBackLink.href} className={styles.backLink}>
              <LuArrowLeft className={styles.inlineIcon} />
              {pageBackLink.label}
            </Link>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

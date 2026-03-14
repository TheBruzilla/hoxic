"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuBoxes, LuLayoutDashboard, LuPanelLeft, LuWandSparkles } from "react-icons/lu";
import {
  BotWorkspacePayload,
  ConsoleNavItem,
  appNavSections,
  buildModulesHref,
  displayName,
  getBotWorkspaceHref,
  getEnabledModuleCards,
  getEnabledModuleEntities,
  getGuildTemplateKey,
  getSelectedBotNavSections,
  getTemplateDefinition,
  requestJson,
} from "@/lib/console";
import { useGuildTemplateDraft } from "@/lib/templateDraft";
import {
  buildFocusedBotsHref,
  buildProvisionHref,
  buildSetupHref,
  buildTemplateSelectorHref,
  findPrimaryBot,
  findSecondaryBots,
} from "@/app/app/setup/setup-helpers";
import { useConsole } from "./ConsoleProvider";
import { useGuildContext } from "./GuildContext";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [workspaceServerLabel, setWorkspaceServerLabel] = useState("");
  const [workspacePayload, setWorkspacePayload] = useState<BotWorkspacePayload | null>(null);
  const { bootstrap, unauthorized } = useConsole();
  const { selectedGuildId } = useGuildContext();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const user = bootstrap?.me ?? null;
  const userName = displayName(user);
  const currentBotId = pathname.startsWith("/app/bots/") ? pathname.split("/")[3] || "" : "";
  const focusedGuildId = searchParams.get("guild") || "";
  const returnTo = searchParams.get("returnTo") || "";
  const selectedTemplateKey = searchParams.get("template") || "";
  const slotParam = searchParams.get("slot") || "";
  const currentSlotIndex = slotParam ? Number.parseInt(slotParam, 10) : null;
  const returnTarget = useMemo(() => {
    if (!returnTo) {
      return null;
    }

    try {
      return new URL(returnTo, "http://localhost");
    } catch {
      return null;
    }
  }, [returnTo]);
  const templateSelectorGuildId = returnTarget?.searchParams.get("guild") || "";
  const returnSlotValue = returnTarget?.searchParams.get("slot") || "";
  const templateSelectorSlotIndex = returnSlotValue ? Number.parseInt(returnSlotValue, 10) : null;
  const pathnameParts = pathname.split("/").filter(Boolean);
  const routeModuleGuildId = pathnameParts.length >= 3 && pathnameParts[0] === "app" && pathnameParts[2] === "modules"
    ? pathnameParts[1] || ""
    : "";
  const flowGuildId = focusedGuildId || templateSelectorGuildId;
  const contextualGuildId = routeModuleGuildId || flowGuildId || selectedGuildId;
  const isServerDirectory = pathname === "/app";
  const isMainBotIndex = pathname === "/app/bots";
  const isBotWorkspace = pathname.startsWith("/app/bots/");
  const isModuleCenter = pathname === "/app/plugins" || (pathnameParts.length >= 3 && pathnameParts[0] === "app" && pathnameParts[2] === "modules");
  const isGuildSetup = pathname === "/app/setup" && Boolean(focusedGuildId);
  const isFocusedSetup = pathname === "/app/setup/focused" && Boolean(focusedGuildId);
  const isProvisionPage = pathname === "/app/provision" && Boolean(focusedGuildId);
  const isTemplateSelectorInFlow = isMainBotIndex && Boolean(returnTo) && Boolean(templateSelectorGuildId);
  const isHeaderlessRoute = false;
  const isFlowRoute = isGuildSetup || isFocusedSetup || isProvisionPage || isTemplateSelectorInFlow || (isBotWorkspace && Boolean(flowGuildId));
  const showSidebar = !(isServerDirectory || (isMainBotIndex && !isTemplateSelectorInFlow));
  const currentBot = currentBotId ? bootstrap?.bots.find(item => item.id === currentBotId) || null : null;
  const currentHeartbeat = currentBot ? bootstrap?.heartbeats.find(item => item.botInstanceId === currentBot.id) || null : null;
  const flowGuild = flowGuildId
    ? bootstrap?.manageableGuilds?.find(guild => guild.id === flowGuildId) || null
    : null;
  const moduleCenterGuild = contextualGuildId
    ? bootstrap?.manageableGuilds?.find(guild => guild.id === contextualGuildId) || null
    : null;
  const flowDraftScope = (() => {
    if (isTemplateSelectorInFlow && Number.isInteger(templateSelectorSlotIndex)) {
      return `slot-${templateSelectorSlotIndex}`;
    }
    if ((isFocusedSetup || isProvisionPage) && Number.isInteger(currentSlotIndex)) {
      return `slot-${currentSlotIndex}`;
    }
    return "guild";
  })();
  const flowQueryTemplateKey = isTemplateSelectorInFlow ? selectedTemplateKey : searchParams.get("template") || "";
  const { templateKey: flowDraftTemplateKey } = useGuildTemplateDraft(flowGuildId, flowQueryTemplateKey, flowDraftScope);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaceContext() {
      if (!currentBotId) {
        setWorkspacePayload(null);
        setWorkspaceServerLabel("");
        return;
      }

      try {
        const payload = await requestJson<BotWorkspacePayload>(`/api/bots/${currentBotId}`);
        if (cancelled) {
          return;
        }

        setWorkspacePayload(payload);

        if (focusedGuildId) {
          const matchedGuild = payload.guilds.find(guild => guild.id === focusedGuildId);
          if (matchedGuild) {
            setWorkspaceServerLabel(matchedGuild.name);
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
          setWorkspacePayload(null);
          setWorkspaceServerLabel(currentBot?.name ?? "Unknown server");
        }
      }
    }

    void loadWorkspaceContext();

    return () => {
      cancelled = true;
    };
  }, [currentBot?.name, currentBotId, focusedGuildId]);

  const focusedGuildConfig = workspacePayload?.guildConfigs.find(configRecord => configRecord.guildId === focusedGuildId) || null;
  const focusedGuildTemplateKey = getGuildTemplateKey(focusedGuildConfig?.overrides);
  const flowPrimaryBot = flowGuild && bootstrap ? findPrimaryBot(bootstrap.bots, flowGuild) : null;
  const flowSecondaryBots = flowGuild && bootstrap ? findSecondaryBots(bootstrap.bots, flowGuild) : [];
  const requestedSlotIndex = isTemplateSelectorInFlow ? templateSelectorSlotIndex : currentSlotIndex;
  const flowTemplateKey = isBotWorkspace
    ? focusedGuildTemplateKey || currentBot?.templateKey || ""
    : flowDraftTemplateKey || flowQueryTemplateKey;
  const selectedSecondaryBot = typeof requestedSlotIndex === "number"
    ? flowSecondaryBots[requestedSlotIndex] || null
    : flowTemplateKey
      ? flowSecondaryBots.find(bot => bot.templateKey === flowTemplateKey) || null
      : null;
  const flowTargetBot = isBotWorkspace
    ? currentBot
    : flowTemplateKey === "full-suite"
      ? flowPrimaryBot
      : selectedSecondaryBot || (isGuildSetup ? flowPrimaryBot : null);
  const resolvedSlotIndex = flowTargetBot?.role === "secondary"
    ? flowSecondaryBots.findIndex(bot => bot.id === flowTargetBot.id)
    : -1;
  const effectiveFlowSlotIndex = Number.isInteger(requestedSlotIndex) ? requestedSlotIndex : resolvedSlotIndex >= 0 ? resolvedSlotIndex : null;
  const flowTemplate = flowTemplateKey
    ? getTemplateDefinition(bootstrap?.templates || [], flowTemplateKey)
    : flowTargetBot
      ? getTemplateDefinition(bootstrap?.templates || [], flowTargetBot.templateKey)
      : null;
  const isFocusedFlow = Boolean(
    (flowTemplateKey && flowTemplateKey !== "full-suite") ||
    (flowTargetBot?.role === "secondary") ||
    isFocusedSetup ||
    (isTemplateSelectorInFlow && returnTarget?.pathname === "/app/setup/focused"),
  );
  const flowOverviewHref = flowGuildId
    ? isFocusedFlow
      ? buildFocusedBotsHref(flowGuildId, flowTemplateKey || undefined, effectiveFlowSlotIndex)
      : buildSetupHref(flowGuildId, flowTemplateKey === "full-suite" ? flowTemplateKey : undefined)
    : "";
  const flowTemplateLibraryHref = flowOverviewHref
    ? buildTemplateSelectorHref(flowOverviewHref, flowTemplateKey || undefined)
    : "";
  const flowProvisionHref = flowGuildId && flowTemplateKey
    ? buildProvisionHref(flowGuildId, flowTemplateKey, isFocusedFlow ? effectiveFlowSlotIndex : undefined)
    : "";
  const flowWorkspaceHref = flowTargetBot
    ? getBotWorkspaceHref(flowTargetBot.id, "overview", flowGuildId || undefined)
    : "";
  const flowEnabledModuleItems = useMemo(() => {
    if (!bootstrap || !flowTemplate) {
      return [] as ConsoleNavItem[];
    }

    if (flowTargetBot) {
      return getEnabledModuleCards(
        bootstrap.templates,
        flowTargetBot,
        flowGuildId || undefined,
        isBotWorkspace ? focusedGuildConfig?.overrides : undefined,
      ).map(card => ({
        id: `flow-module-${card.id}`,
        label: card.label,
        href: card.href,
        icon: card.icon,
        exact: true,
      }));
    }

    const moduleFallbackHref = flowProvisionHref || flowOverviewHref || flowTemplateLibraryHref;
    return getEnabledModuleEntities(flowTemplate).map(entity => ({
      id: `flow-module-${entity.id}`,
      label: entity.label,
      href: moduleFallbackHref,
      icon: LuBoxes,
      exact: false,
    }));
  }, [
    bootstrap,
    flowGuildId,
    flowOverviewHref,
    flowProvisionHref,
    flowTargetBot,
    flowTemplate,
    flowTemplateLibraryHref,
    focusedGuildConfig?.overrides,
    isBotWorkspace,
  ]);
  const workspaceLabel = currentBot
    ? workspaceServerLabel || `${currentHeartbeat?.guildCount || 0} servers`
    : isServerDirectory
      ? "Server Directory"
      : isMainBotIndex
        ? flowGuild?.name || "Main Bot"
        : isModuleCenter
          ? moduleCenterGuild?.name || "Modules"
        : isProvisionPage
          ? flowGuild?.name || "Provision"
          : isFocusedSetup
            ? flowGuild?.name || "Focused Setup"
            : isGuildSetup
              ? flowGuild?.name || "Server Setup"
              : pathname.startsWith("/app/bots")
                ? "Bot Fleet"
                : "Global Fleet";
  const flowNavSections = useMemo(() => {
    if (!isFlowRoute || !flowGuildId || !flowOverviewHref) {
      return [] as Array<{ label?: string; items: ConsoleNavItem[] }>;
    }

    const sections: Array<{ label?: string; items: ConsoleNavItem[] }> = [
      {
        label: "Overview",
        items: [
          {
            id: "flow-overview",
            label: flowGuild?.name || "Server overview",
            href: flowOverviewHref,
            icon: LuLayoutDashboard,
            exact: true,
          },
        ],
      },
    ];

    if (flowTemplateLibraryHref) {
      sections.push({
        label: "Template Library",
        items: [
          {
            id: "flow-template-library",
            label: flowTemplate?.name || "Choose template",
            href: flowTemplateLibraryHref,
            icon: LuWandSparkles,
            exact: true,
          },
        ],
      });
    }

    if (flowProvisionHref) {
      sections.push({
        label: "Provision",
        items: [
          {
            id: "flow-provision",
            label: "Provision canvas",
            href: flowProvisionHref,
            icon: LuPanelLeft,
            exact: true,
          },
        ],
      });
    }

    if (flowWorkspaceHref) {
      sections.push({
        label: "Workspace",
        items: [
          {
            id: "flow-workspace",
            label: flowTargetBot?.name || "Workspace",
            href: flowWorkspaceHref,
            icon: LuLayoutDashboard,
            exact: true,
          },
        ],
      });
    }

    if (flowEnabledModuleItems.length > 0) {
      sections.push({
        label: "Enabled Modules",
        items: flowEnabledModuleItems,
      });
    }

    return sections;
  }, [
    flowEnabledModuleItems,
    flowGuild?.name,
    flowGuildId,
    flowOverviewHref,
    flowProvisionHref,
    isFlowRoute,
    flowTargetBot?.name,
    flowTemplate?.name,
    flowTemplateLibraryHref,
    flowWorkspaceHref,
  ]);
  const navSections = useMemo(() => {
    if (isFlowRoute) {
      return flowNavSections;
    }

    const baseSections = appNavSections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id !== "plugins") {
          return item;
        }

        return {
          ...item,
          href: buildModulesHref(contextualGuildId || undefined),
          exact: !contextualGuildId,
        };
      }),
    }));

    return [...baseSections, ...getSelectedBotNavSections(bootstrap?.templates || [], currentBot, focusedGuildId || undefined)];
  }, [bootstrap?.templates, contextualGuildId, currentBot, flowNavSections, focusedGuildId, isFlowRoute]);
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
  const pageBackAction = useMemo(() => {
    if (pathname === "/app/setup" && focusedGuildId) {
      return { fallbackHref: "/app", label: "Back to servers" };
    }

    if (pathname === "/app/setup/focused" && focusedGuildId) {
      return {
        fallbackHref: buildSetupHref(focusedGuildId, selectedTemplateKey || undefined),
        label: "Back to setup",
      };
    }

    if (pathname === "/app/provision" && focusedGuildId) {
      return {
        fallbackHref:
          selectedTemplateKey === "full-suite"
            ? buildSetupHref(focusedGuildId, selectedTemplateKey || undefined)
            : buildFocusedBotsHref(focusedGuildId, selectedTemplateKey || undefined, Number.isInteger(currentSlotIndex) ? currentSlotIndex : undefined),
        label: "Back to setup",
      };
    }

    if (pathname === "/app/bots" && returnTo) {
      return { fallbackHref: buildReturnPath(returnTo, selectedTemplateKey || undefined), label: "Back to setup" };
    }

    if (pathname === "/app/runtime" || pathname === "/app/operators" || pathname === "/app/plugins" || isModuleCenter) {
      return { fallbackHref: "/app", label: "Back to servers" };
    }

    return null;
  }, [currentSlotIndex, focusedGuildId, isModuleCenter, pathname, returnTo, selectedTemplateKey]);

  if (unauthorized) {
    return <AuthGate />;
  }

  return (
    <div
      className={`${styles.shell} ${showSidebar ? "" : styles.shellNoSidebar} ${isHeaderlessRoute ? styles.shellHeaderless : ""}`.trim()}
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
        {pageBackAction ? (
          <div className={styles.pageBackRow}>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                  return;
                }

                router.replace(pageBackAction.fallbackHref);
              }}
            >
              <LuArrowLeft className={styles.inlineIcon} />
              {pageBackAction.label}
            </button>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, EmptyState, SectionHeader, StatusBadge } from "@/components/console/ConsolePrimitives";
import { pluginCatalog, pluginGroups } from "@/lib/console";
import styles from "@/components/console/console.module.scss";

function PluginsScreen() {
  const searchParams = useSearchParams();
  const selectedGroup = searchParams.get("group") || "all";
  const focusedPlugin = searchParams.get("focus") || "";

  const visiblePlugins = useMemo(() => {
    return selectedGroup === "all"
      ? pluginCatalog
      : pluginCatalog.filter(plugin => plugin.category === selectedGroup);
  }, [selectedGroup]);

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          title="Plugin Library"
        />
        <div className={styles.tabRow}>
          {pluginGroups.map(group => (
            <Link
              key={group.key}
              href={group.key === "all" ? "/app/plugins" : `/app/plugins?group=${group.key}`}
              className={`${styles.tab} ${selectedGroup === group.key ? styles.tabActive : ""}`}
            >
              {group.label}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Modules"
          title={pluginGroups.find(group => group.key === selectedGroup)?.label || "All Plugins"}
        />
        {visiblePlugins.length ? (
          <div className={`${styles.pluginGrid} ${styles.pluginLibraryGrid}`}>
            {visiblePlugins.map(plugin => {
              const Icon = plugin.icon;
              const isFocused = plugin.id === focusedPlugin;
              return (
                <article
                  key={plugin.id}
                  className={`${styles.card} ${styles.pluginLibraryCard}`}
                  style={isFocused ? { borderColor: "rgba(87, 173, 197, 0.34)" } : undefined}
                >
                  <div className={styles.splitHeader}>
                    <div className={styles.inlineMeta}>
                      <span className={styles.pluginIconWrap}>
                        <Icon className={styles.pluginIcon} />
                      </span>
                      <div>
                        <h3 className={`${styles.cardTitle} ${styles.pluginLibraryTitle}`}>{plugin.title}</h3>
                      </div>
                    </div>
                    <div className={`${styles.inlineMeta} ${styles.pluginLibraryMeta}`}>
                      {plugin.popular ? <Badge label="Popular" tone="soft" /> : null}
                      {plugin.status === "Premium" ? (
                        <Badge label="Premium" tone="premium" />
                      ) : plugin.status === "New" ? (
                        <Badge label="New" tone="new" />
                      ) : plugin.status === "Beta" ? (
                        <Badge label="Beta" tone="beta" />
                      ) : (
                        <StatusBadge status={plugin.status} />
                      )}
                      <details className={styles.infoDisclosure}>
                        <summary className={styles.infoSummary} aria-label={`${plugin.title} info`}>
                          i
                        </summary>
                        <div className={styles.infoPanel}>
                          <strong>{plugin.title}</strong>
                          <span>{plugin.description}</span>
                        </div>
                      </details>
                    </div>
                  </div>
                  <div className={`${styles.inlineMeta} ${styles.pluginLibraryMeta}`}>
                    <span className={`${styles.chip} ${styles.pluginLibraryChip}`}>
                      {pluginGroups.find(group => group.key === plugin.category)?.label || plugin.category}
                    </span>
                  </div>
                  <div className={`${styles.cardActions} ${styles.pluginLibraryActions}`}>
                    <Link href={plugin.href} className={`${styles.button} ${styles.pluginLibraryAction}`}>
                      Open module
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No plugins in this group" description="Choose another category from the tabs above." />
        )}
      </section>
    </>
  );
}

export default function PluginsPage() {
  return (
    <Suspense fallback={<section className={styles.pageSurface}><SectionHeader title="Loading plugins" description="Preparing the plugin library." /></section>}>
      <PluginsScreen />
    </Suspense>
  );
}

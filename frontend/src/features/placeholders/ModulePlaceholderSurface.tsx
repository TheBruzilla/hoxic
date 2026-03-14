"use client";

import { Badge, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { DORMANT_STATES, DORMANT_STATE_COPY, DormantState } from "@/features/contracts/dormant-states";
import { canonicalModuleLabelMap, isCanonicalModuleId } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export function resolveDormantState({
  isProvisioned,
  moduleInTemplate,
}: {
  isProvisioned: boolean;
  moduleInTemplate: boolean;
}): DormantState {
  if (!isProvisioned) {
    return DORMANT_STATES.DORMANT_UNPROVISIONED;
  }

  if (!moduleInTemplate) {
    return DORMANT_STATES.DORMANT_NOT_IN_TEMPLATE;
  }

  return DORMANT_STATES.DORMANT_NOT_IMPLEMENTED;
}

export function ModulePlaceholderSurface({
  moduleId,
  templateKey,
  scopeLabel,
  isProvisioned,
  moduleInTemplate,
}: {
  moduleId: string;
  templateKey: string;
  scopeLabel: string;
  isProvisioned: boolean;
  moduleInTemplate: boolean;
}) {
  const dormantState = resolveDormantState({ isProvisioned, moduleInTemplate });
  const copy = DORMANT_STATE_COPY[dormantState];
  const isKnownModule = isCanonicalModuleId(moduleId);

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Template-scoped module placeholder"
        title={isKnownModule ? canonicalModuleLabelMap[moduleId] : moduleId}
        description={copy.description}
      />
      <div className={styles.inlineMeta}>
        <Badge label={dormantState.replace("DORMANT_", "")} tone="soft" />
        <span className={styles.chip}>Scope: {scopeLabel}</span>
        <span className={styles.chip}>Template: {templateKey || "None"}</span>
        <span className={styles.chip}>Module: {moduleId}</span>
      </div>
      <div className={styles.callout}>
        <strong>{copy.title}</strong>
        <p className={styles.pageText}>
          This page is intentionally dormant in FR rewrite mode so implementation can be added later without
          changing route or shell ownership.
        </p>
      </div>
      {!isKnownModule ? (
        <div className={styles.callout}>
          Unknown module id for canonical catalog. Keep the route placeholder, then align with template catalog truth.
        </div>
      ) : null}
    </GlassPanel>
  );
}

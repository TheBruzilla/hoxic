"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ModulePlaceholderSurface } from "@/features/placeholders/ModulePlaceholderSurface";
import { getCanonicalTemplateModules, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import { parseFocusedSlot } from "@/features/flow/server-flow";

export default function FocusedWorkspaceModulePlaceholderPage() {
  const params = useParams<{ slot: string; moduleId: string }>();
  const searchParams = useSearchParams();
  const slot = parseFocusedSlot(String(params?.slot || ""));
  const moduleId = String(params?.moduleId || "");
  const templateKey = String(searchParams.get("template") || "");
  const moduleIds = isCanonicalTemplateKey(templateKey) ? getCanonicalTemplateModules(templateKey) : [];
  const moduleInTemplate = moduleIds.includes(moduleId);
  const isProvisioned = isCanonicalTemplateKey(templateKey) && Boolean(slot);

  return (
    <ModulePlaceholderSurface
      moduleId={moduleId}
      templateKey={templateKey}
      scopeLabel={slot ? `focused workspace slot ${slot}` : "focused workspace"}
      isProvisioned={isProvisioned}
      moduleInTemplate={moduleInTemplate}
    />
  );
}

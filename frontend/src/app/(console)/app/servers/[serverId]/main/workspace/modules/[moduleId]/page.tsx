"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ModulePlaceholderSurface } from "@/features/placeholders/ModulePlaceholderSurface";
import { getCanonicalTemplateModules, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";

export default function MainWorkspaceModulePlaceholderPage() {
  const params = useParams<{ serverId: string; moduleId: string }>();
  const searchParams = useSearchParams();
  const moduleId = String(params?.moduleId || "");
  const templateKey = String(searchParams.get("template") || "");
  const moduleIds = isCanonicalTemplateKey(templateKey) ? getCanonicalTemplateModules(templateKey) : [];
  const moduleInTemplate = moduleIds.includes(moduleId);
  const isProvisioned = isCanonicalTemplateKey(templateKey);

  return (
    <ModulePlaceholderSurface
      moduleId={moduleId}
      templateKey={templateKey}
      scopeLabel="main workspace"
      isProvisioned={isProvisioned}
      moduleInTemplate={moduleInTemplate}
    />
  );
}

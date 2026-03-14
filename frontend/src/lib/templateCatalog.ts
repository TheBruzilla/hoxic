// Batch FR rewrite note:
// Keep this file as a compatibility facade while the new catalog home lives in src/lib/catalog.
// This preserves legacy imports without creating a second source of truth.

import {
  canonicalModuleIds,
  canonicalModuleLabelMap,
  canonicalModules,
  canonicalTemplateCatalog,
  canonicalTemplates,
  getCanonicalTemplate,
  getCanonicalTemplateModules,
} from "@/lib/catalog/template-catalog";

export const templateCatalog = canonicalTemplateCatalog;
export const templateCatalogModules = canonicalModules;
export const templateCatalogTemplates = canonicalTemplates;
export const moduleDisplayOrder = canonicalModuleIds;
export const moduleEntityLabels = canonicalModuleLabelMap;

export function getTemplateCatalogTemplate(templateKey: string) {
  return getCanonicalTemplate(templateKey);
}

export function getEnabledModulesForTemplateKey(templateKey: string) {
  return getCanonicalTemplateModules(templateKey);
}

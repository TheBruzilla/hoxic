import templateCatalogData from "../../../shared/template-catalog.json";

export interface CanonicalModuleRecord {
  id: string;
  label: string;
}

export interface CanonicalTemplateRecord {
  key: string;
  name: string;
  description: string;
  moduleIds: string[];
}

interface CanonicalTemplateCatalog {
  modules: CanonicalModuleRecord[];
  templates: CanonicalTemplateRecord[];
}

export const canonicalTemplateCatalog = templateCatalogData as CanonicalTemplateCatalog;
export const canonicalModules = canonicalTemplateCatalog.modules;
export const canonicalTemplates = canonicalTemplateCatalog.templates;
export const canonicalModuleIds = canonicalModules.map(moduleRecord => moduleRecord.id);
export const canonicalTemplateKeys = canonicalTemplates.map(template => template.key);
export const canonicalModuleLabelMap = Object.fromEntries(
  canonicalModules.map(moduleRecord => [moduleRecord.id, moduleRecord.label]),
) as Record<string, string>;

export function getCanonicalTemplate(templateKey: string) {
  return canonicalTemplates.find(template => template.key === templateKey) || null;
}

export function getCanonicalModule(moduleId: string) {
  return canonicalModules.find(moduleRecord => moduleRecord.id === moduleId) || null;
}

export function getCanonicalTemplateModules(templateKey: string) {
  return getCanonicalTemplate(templateKey)?.moduleIds || [];
}

export function isCanonicalTemplateKey(templateKey: string) {
  return canonicalTemplateKeys.includes(templateKey);
}

export function isCanonicalModuleId(moduleId: string) {
  return canonicalModuleIds.includes(moduleId);
}

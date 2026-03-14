import templateCatalogData from "../../shared/template-catalog.json";

// Batch 0A freeze: frontend/shared/template-catalog.json is the canonical runtime registry.
// Planning artifacts (for example template-builder exports) must be converted before use here.

interface TemplateCatalogModule {
  id: string;
  label: string;
}

interface TemplateCatalogTemplate {
  key: string;
  name: string;
  description: string;
  moduleIds: string[];
}

interface TemplateCatalogFile {
  modules: TemplateCatalogModule[];
  templates: TemplateCatalogTemplate[];
}

export const templateCatalog = templateCatalogData as TemplateCatalogFile;
export const templateCatalogModules = templateCatalog.modules;
export const templateCatalogTemplates = templateCatalog.templates;
export const moduleDisplayOrder = templateCatalogModules.map(module => module.id);
export const moduleEntityLabels = Object.fromEntries(
  templateCatalogModules.map(module => [module.id, module.label]),
) as Record<string, string>;

export function getTemplateCatalogTemplate(templateKey: string) {
  return templateCatalogTemplates.find(template => template.key === templateKey) || null;
}

export function getEnabledModulesForTemplateKey(templateKey: string) {
  return getTemplateCatalogTemplate(templateKey)?.moduleIds || [];
}

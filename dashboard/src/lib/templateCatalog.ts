import templateCatalogData from "../../../shared/template-catalog.json";

interface TemplateCatalogModule {
  id: string;
  label: string;
}

interface TemplateCatalogTemplate {
  key: string;
  name: string;
  description: string;
  enabledModules: Record<string, boolean>;
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

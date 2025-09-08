import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import glob from "glob";
import { promisify } from "util";
import { join, relative, dirname } from "path";
import { readJSON } from "fs-extra";

const globAsync = promisify(glob);

export interface TemplatePlugin {
  id: string;
  name: string;
  preview: string;
  description: string;
}

const loadPlugin = async (
  path: string,
): Promise<
  (JSON & { name: string; _resourceType: unknown; description?: string }) | null
> => {
  try {
    const template = await readJSON(path);
    if (!template.name) {
      throw new Error("Template is missing name");
    }
    if (!template._resourceType || template._resourceType !== "project") {
      throw new Error('Invalid _resourceType in template, should be "project"');
    }
    return template;
  } catch (e) {
    console.error("Unable to load template", e);
  }
  return null;
};

export class TemplateManager {
  pluginTemplates: Record<string, TemplatePlugin>;

  constructor() {
    this.pluginTemplates = {};
  }

  async loadPlugins() {
    this.pluginTemplates = {};
    const globalPluginsPath = getGlobalPluginsPath();
    const pluginPaths = await globAsync(
      join(globalPluginsPath, "**/project.gbsproj"),
    );
    for (const path of pluginPaths) {
      const template = await loadPlugin(path);
      if (template) {
        const id = relative(globalPluginsPath, path);
        this.pluginTemplates[id] = {
          id,
          name: template.name,
          preview: `gbs://global-plugin/${dirname(id)}/thumbnail.png`,
          description: template.description ?? "",
        };
      }
    }
  }

  async loadPlugin(path: string) {
    const globalPluginsPath = getGlobalPluginsPath();
    const template = await loadPlugin(path);
    if (template) {
      const id = relative(globalPluginsPath, path);
      this.pluginTemplates[id] = {
        id,
        name: template.name,
        preview: `gbs://global-plugin/${dirname(id)}/thumbnail.png`,
        description: template.description ?? "",
      };
      return this.pluginTemplates[id];
    }
  }

  getTemplate(templateId: string) {
    const pluginTemplate = this.pluginTemplates[templateId];
    if (pluginTemplate) {
      return pluginTemplate;
    }
    return undefined;
  }

  getPluginTemplates(): TemplatePlugin[] {
    return Object.entries(this.pluginTemplates).map(([id, template]) => {
      return {
        id,
        name: template.name,
        preview: `gbs://global-plugin/${dirname(id)}/thumbnail.png`,
        description: template.description,
      };
    });
  }
}

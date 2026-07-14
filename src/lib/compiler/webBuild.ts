import fs from "fs-extra";
import Path from "path";
import { glob } from "lib/helpers/glob";
import { binjgbWasmRoot, defaultWebTemplateRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import { pathToPosix } from "shared/lib/helpers/path";
import type { ProjectResources } from "shared/lib/resources/types";
import type { WebTemplateInfo } from "shared/lib/webTemplates/types";

export const DEFAULT_WEB_TEMPLATE = "";
export const DEFAULT_WEB_TEMPLATE_NAME = "Default (Binjgb)";

type WebTemplateManifest = {
  version: 1;
  name: string;
  romPath: string;
  configPath: string;
};
const manifestFilename = "gbstudio.web-template.json";
const defaultManifestPaths = {
  romPath: "rom/{{romFilename}}",
  configPath: "gbstudio.json",
};

const webTemplatesRoot = (projectRoot: string) =>
  Path.join(projectRoot, "assets", "web");

const isDefaultWebTemplate = (templateRoot: string): boolean =>
  Path.resolve(templateRoot) === Path.resolve(defaultWebTemplateRoot);

const copyBinjgbRuntime = async (destination: string): Promise<void> =>
  copy(binjgbWasmRoot, Path.join(destination, "js"));

const resolveProjectWebTemplate = (
  projectRoot: string,
  template: string,
): string | undefined => {
  const trimmedTemplate = template.trim();
  if (!trimmedTemplate) {
    return undefined;
  }

  const templatesRoot = webTemplatesRoot(projectRoot);
  const templatePath = Path.resolve(templatesRoot, trimmedTemplate);
  const relativeTemplatePath = Path.relative(templatesRoot, templatePath);
  if (
    relativeTemplatePath.startsWith("..") ||
    Path.isAbsolute(relativeTemplatePath)
  ) {
    return undefined;
  }

  return templatePath;
};

const resolvePluginWebTemplate = (
  projectRoot: string,
  template: string,
): string | undefined => {
  const trimmedTemplate = template.trim();
  if (!trimmedTemplate.startsWith("plugins/")) {
    return undefined;
  }

  if (trimmedTemplate.includes("/assets/web/")) {
    const projectPath = Path.resolve(projectRoot, trimmedTemplate);
    const relativeProjectPath = Path.relative(projectRoot, projectPath);
    if (
      relativeProjectPath.startsWith("..") ||
      Path.isAbsolute(relativeProjectPath)
    ) {
      return undefined;
    }

    return projectPath;
  }

  const templatePathParts = trimmedTemplate.split("/");
  const templateName = templatePathParts.pop();
  if (!templateName || templatePathParts.length < 2) {
    return undefined;
  }

  const pluginPathParts = templatePathParts.slice(1);
  const projectPath = Path.resolve(
    projectRoot,
    "plugins",
    ...pluginPathParts,
    "assets",
    "web",
    templateName,
  );
  const relativeProjectPath = Path.relative(projectRoot, projectPath);
  if (
    relativeProjectPath.startsWith("..") ||
    Path.isAbsolute(relativeProjectPath)
  ) {
    return undefined;
  }

  return projectPath;
};

const readWebTemplateManifest = async (
  templatePath: string,
): Promise<WebTemplateManifest | undefined> => {
  const manifestPath = Path.join(templatePath, manifestFilename);
  const manifest = await fs.readJSON(manifestPath).catch(() => undefined);
  if (
    !manifest ||
    manifest.version !== 1 ||
    typeof manifest.name !== "string"
  ) {
    return undefined;
  }

  return {
    version: 1,
    name: manifest.name,
    romPath:
      typeof manifest.romPath === "string"
        ? manifest.romPath
        : defaultManifestPaths.romPath,
    configPath:
      typeof manifest.configPath === "string"
        ? manifest.configPath
        : defaultManifestPaths.configPath,
  };
};

const resolveOutputPath = (
  destination: string,
  templatePath: string,
  romFilename: string,
): string | undefined => {
  const relativePath = templatePath.replace(/{{romFilename}}/g, romFilename);
  const outputPath = Path.resolve(destination, relativePath);
  const relativeOutputPath = Path.relative(destination, outputPath);
  if (
    !relativePath ||
    relativeOutputPath.startsWith("..") ||
    Path.isAbsolute(relativeOutputPath)
  ) {
    return undefined;
  }
  return outputPath;
};

const makeWebBuildConfig = (project: ProjectResources, romPath: string) => ({
  version: 1,
  rom: romPath,
  project: {
    name: project.metadata.name,
    author: project.metadata.author,
  },
  colorCorrection: project.settings.colorCorrection,
  customControls: {
    up: project.settings.customControlsUp,
    down: project.settings.customControlsDown,
    left: project.settings.customControlsLeft,
    right: project.settings.customControlsRight,
    a: project.settings.customControlsA,
    b: project.settings.customControlsB,
    start: project.settings.customControlsStart,
    select: project.settings.customControlsSelect,
  },
});

export const listProjectWebTemplates = async (
  projectRoot: string,
): Promise<WebTemplateInfo[]> => {
  const templatesRoot = webTemplatesRoot(projectRoot);
  const projectTemplates = (await fs.pathExists(templatesRoot))
    ? (
        await Promise.all(
          (await fs.readdir(templatesRoot, { withFileTypes: true }))
            .filter((entry) => entry.isDirectory())
            .map(async (entry) => {
              const manifest = await readWebTemplateManifest(
                Path.join(templatesRoot, entry.name),
              );
              return manifest
                ? { id: entry.name, name: manifest.name }
                : undefined;
            }),
        )
      ).filter((template): template is WebTemplateInfo => Boolean(template))
    : [];

  const pluginTemplatePaths = await glob("plugins/**/assets/web/*", {
    cwd: projectRoot,
    absolute: true,
  });
  const pluginTemplates = (
    await Promise.all(
      pluginTemplatePaths.map(async (templatePath) => {
        const stat = await fs.stat(templatePath).catch(() => undefined);
        if (!stat?.isDirectory()) {
          return undefined;
        }
        const manifest = await readWebTemplateManifest(templatePath);
        if (!manifest) {
          return undefined;
        }
        const relativeTemplatePath = pathToPosix(
          Path.relative(projectRoot, templatePath),
        );
        return {
          id: relativeTemplatePath.replace("/assets/web/", "/"),
          name: manifest.name,
        };
      }),
    )
  ).filter((template): template is WebTemplateInfo => Boolean(template));

  return [...projectTemplates, ...pluginTemplates].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
};

export const ejectDefaultWebTemplate = async (
  projectRoot: string,
): Promise<string> => {
  const templateName = "binjgb";
  const outputPath = Path.join(webTemplatesRoot(projectRoot), templateName);
  await fs.remove(outputPath);
  await copy(defaultWebTemplateRoot, outputPath);
  await copyBinjgbRuntime(outputPath);
  return templateName;
};

export const getWebTemplateRoot = async (
  projectRoot: string,
  template: string,
  warnings: (msg: string) => void,
): Promise<string> => {
  const templatePath =
    resolvePluginWebTemplate(projectRoot, template) ||
    resolveProjectWebTemplate(projectRoot, template);
  if (!templatePath) {
    if (template.trim()) {
      warnings(`Invalid web template "${template}", using default template.`);
    }
    return defaultWebTemplateRoot;
  }

  const stat = await fs.stat(templatePath).catch(() => undefined);
  if (!stat?.isDirectory()) {
    warnings(`Web template "${template}" not found, using default template.`);
    return defaultWebTemplateRoot;
  }

  if (!(await readWebTemplateManifest(templatePath))) {
    warnings(
      `Web template "${template}" is missing a valid ${manifestFilename}, using default template.`,
    );
    return defaultWebTemplateRoot;
  }

  return templatePath;
};

export const exportWebBuild = async ({
  project,
  projectRoot,
  destination,
  romFilename,
  romPath,
  webTemplate,
  warnings,
}: {
  project: ProjectResources;
  projectRoot: string;
  destination: string;
  romFilename: string;
  romPath: string;
  webTemplate?: string;
  warnings: (msg: string) => void;
}) => {
  const templateRoot = await getWebTemplateRoot(
    projectRoot,
    webTemplate ?? project.settings.webTemplate ?? DEFAULT_WEB_TEMPLATE,
    warnings,
  );
  const manifest =
    (await readWebTemplateManifest(templateRoot)) ||
    (await readWebTemplateManifest(defaultWebTemplateRoot));
  if (!manifest) {
    throw new Error(`Default web template is missing ${manifestFilename}`);
  }

  const romOutputPath = resolveOutputPath(
    destination,
    manifest.romPath,
    romFilename,
  );
  const configOutputPath = resolveOutputPath(
    destination,
    manifest.configPath,
    romFilename,
  );
  if (!romOutputPath || !configOutputPath) {
    warnings(
      `Web template "${manifest.name}" contains unsafe output paths, using default template.`,
    );
    const defaultManifest = await readWebTemplateManifest(
      defaultWebTemplateRoot,
    );
    if (!defaultManifest) {
      throw new Error(`Default web template is missing ${manifestFilename}`);
    }
    await exportWebBuild({
      project,
      projectRoot,
      destination,
      romFilename,
      romPath,
      webTemplate: DEFAULT_WEB_TEMPLATE,
      warnings,
    });
    return;
  }

  const templateManifestPath = Path.join(templateRoot, manifestFilename);
  await copy(templateRoot, destination, {
    ignore: (sourcePath) =>
      Path.resolve(sourcePath) === Path.resolve(templateManifestPath),
  });
  if (isDefaultWebTemplate(templateRoot)) {
    await copyBinjgbRuntime(destination);
  }
  await copy(romPath, romOutputPath);

  const sanitize = (s: string) => String(s || "").replace(/["<>]/g, "");
  const projectName = sanitize(project.metadata.name);
  const author = sanitize(project.metadata.author);
  const colorsHead =
    project.settings.colorMode !== "mono"
      ? `<style type="text/css"> body { background-color:#${project.settings.customColorsBlack}; }</style>`
      : "";
  const customHead = project.settings.customHead || "";

  const htmlPath = Path.join(destination, "index.html");
  const romConfigPath = pathToPosix(Path.relative(destination, romOutputPath));

  const html = (await fs.readFile(htmlPath, "utf8"))
    .replace(/___PROJECT_NAME___/g, projectName)
    .replace(/___AUTHOR___/g, author)
    .replace(/___COLORS_HEAD___/g, colorsHead)
    .replace(/___PROJECT_HEAD___/g, customHead);

  await fs.writeFile(htmlPath, html);
  await fs.ensureDir(Path.dirname(configOutputPath));
  await fs.writeJSON(
    configOutputPath,
    makeWebBuildConfig(project, romConfigPath),
    { spaces: 2 },
  );
};

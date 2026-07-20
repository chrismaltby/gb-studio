import fs from "fs-extra";
import path from "path";
import os from "os";
import stripInvalidFilenameCharacters from "shared/lib/helpers/stripInvalidFilenameCharacters";
import { ERR_PROJECT_EXISTS, projectTemplatesRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import { Value } from "@sinclair/typebox/value";
import { ProjectMetadataResource } from "shared/lib/resources/types";

export interface CreateProjectInput {
  name: string;
  template: string;
  path: string;
}

export const shouldIgnoreTemplatePath =
  (templatePath: string) =>
  (filepath: string): boolean => {
    const relativePath = path.relative(templatePath, filepath);
    const normalizedRelativePath = relativePath.toLowerCase();
    const isRootPluginThumbnail = normalizedRelativePath === "thumbnail.png";
    const isRootPluginMetadata = normalizedRelativePath === "plugin.json";
    const isBackupPath = path.basename(normalizedRelativePath).endsWith(".bak");
    return isRootPluginThumbnail || isRootPluginMetadata || isBackupPath;
  };

const createProject = async (options: CreateProjectInput) => {
  const projectFolderName = stripInvalidFilenameCharacters(options.name);
  const projectPath = path.join(options.path, projectFolderName);
  const globalPluginsPath = getGlobalPluginsPath();
  const isPlugin = path.basename(options.template) === "project.gbsproj";
  const templatePath = isPlugin
    ? path.join(globalPluginsPath, path.dirname(options.template))
    : path.join(projectTemplatesRoot, options.template);
  const projectTmpDataPath = `${projectPath}/project.gbsproj`;
  const projectDataPath = `${projectPath}/${projectFolderName}.gbsproj`;
  const templateDataPath = path.join(templatePath, "project.gbsproj");

  const { username } = os.userInfo();

  if (fs.existsSync(projectPath)) {
    throw ERR_PROJECT_EXISTS;
  }

  const projectMetadata = (await fs.readJSON(templateDataPath)) as unknown;
  if (!Value.Check(ProjectMetadataResource, projectMetadata)) {
    throw new Error("Template project.gbsproj is invalid");
  }

  projectMetadata.name = projectFolderName;
  projectMetadata.author = username;

  await fs.ensureDir(projectPath);
  await copy(templatePath, projectPath, {
    ignore: shouldIgnoreTemplatePath(templatePath),
  });

  await fs.unlink(projectTmpDataPath);
  await fs.writeJSON(projectDataPath, projectMetadata, { spaces: 2 });
  return projectDataPath;
};

export default createProject;

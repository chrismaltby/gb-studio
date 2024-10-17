import fs from "fs-extra";
import path from "path";
import os from "os";
import stripInvalidFilenameCharacters from "shared/lib/helpers/stripInvalidFilenameCharacters";
import { ERR_PROJECT_EXISTS, projectTemplatesRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";

export interface CreateProjectInput {
  name: string;
  template: string;
  path: string;
}

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
  const { username } = os.userInfo();

  if (fs.existsSync(projectPath)) {
    throw ERR_PROJECT_EXISTS;
  }

  await fs.ensureDir(projectPath);
  await copy(templatePath, projectPath);

  // Replace placeholders in data file
  const dataFile = (await fs.readFile(projectTmpDataPath, "utf8"))
    .replace(/___PROJECT_NAME___/g, projectFolderName)
    .replace(/___AUTHOR___/g, username);

  await fs.writeFile(projectDataPath, dataFile);
  await fs.unlink(projectTmpDataPath);
  return projectDataPath;
};

export default createProject;

export { ERR_PROJECT_EXISTS };

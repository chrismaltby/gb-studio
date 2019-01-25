import fs from "fs-extra";
import path from "path";
import stripInvalidFilenameCharacters from "./stripInvalidFilenameCharacters";

const ERR_PROJECT_EXISTS = "ERR_PROJECT_EXISTS";

const createProject = async options => {
  const projectFolderName = stripInvalidFilenameCharacters(options.name);
  const projectPath = path.join(options.path, projectFolderName);
  const templatePath = `${__dirname}/../data/templates/${options.target}`;
  console.log({ projectPath, templatePath });

  if (fs.existsSync(projectPath)) {
    throw ERR_PROJECT_EXISTS;
  }

  await fs.ensureDir(projectPath);
  await fs.copy(templatePath, projectPath);
};

export default createProject;

export { ERR_PROJECT_EXISTS };

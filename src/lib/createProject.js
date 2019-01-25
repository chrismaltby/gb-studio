import fs from "fs-extra";
import path from "path";
import stripInvalidFilenameCharacters from "./stripInvalidFilenameCharacters";

const ERR_PROJECT_EXISTS = "ERR_PROJECT_EXISTS";

const createProject = async options => {
  const projectFolderName = stripInvalidFilenameCharacters(options.name);
  const projectPath = path.join(options.path, projectFolderName);
  const templatePath = `${__dirname}/../data/templates/${options.target}`;
  const projectDataPath = `${projectPath}/project.json`;

  if (fs.existsSync(projectPath)) {
    throw ERR_PROJECT_EXISTS;
  }

  await fs.ensureDir(projectPath);
  await fs.copy(templatePath, projectPath);

  // Replace placeholders in data file
  let dataFile = await fs.readFile(projectDataPath, "utf8");
  dataFile = dataFile.replace(/___PROJECT_NAME___/g, projectFolderName);
  await fs.writeFile(projectDataPath, dataFile);

  return projectPath;
};

export default createProject;

export { ERR_PROJECT_EXISTS };

import fs from "fs-extra";

const saveProjectData = async (projectPath, project) => {
  fs.writeFileSync(projectPath, JSON.stringify(project, null, 4));
};

export default saveProjectData;

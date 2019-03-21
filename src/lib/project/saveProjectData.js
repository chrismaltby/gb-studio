import fs from "fs-extra";
import path from "path";

const saveProjectData = async (projectPath, project) => {
  console.log("SAVING PROJECT TO ", projectPath);
  await fs.writeFile(projectPath, JSON.stringify(project, null, 4));
  console.log("WROTE TO ", projectPath);
};

export default saveProjectData;

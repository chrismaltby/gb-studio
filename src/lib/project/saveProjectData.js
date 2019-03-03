import fs from "fs-extra";
import path from "path";

const saveProjectData = async (projectPath, project) => {
  console.log("SAVING PROJECT TO ", projectPath);
  await fs.writeJson(projectPath, project);
  console.log("WROTE TO ", projectPath);
};

export default saveProjectData;

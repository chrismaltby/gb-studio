import Path from "path";
import { copy } from "fs-extra";
import { writeFileAndFlushAsync } from "../helpers/fs/writeFileAndFlush";

const saveAsProjectData = async (projectPath, newProjectPath, project) => {
  await copy(
    Path.join(Path.dirname(projectPath), "assets"),
    Path.join(Path.dirname(newProjectPath), "assets")
  );
  await copy(projectPath, newProjectPath);
  await writeFileAndFlushAsync(
    newProjectPath,
    JSON.stringify(project, null, 4)
  );
};

export default saveAsProjectData;

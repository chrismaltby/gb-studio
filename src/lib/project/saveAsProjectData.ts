import Path from "path";
import { copy } from "fs-extra";
import { writeFileAndFlushAsync } from "lib/helpers/fs/writeFileAndFlush";
import type { ProjectData } from "store/features/project/projectActions";

const saveAsProjectData = async (
  projectPath: string,
  newProjectPath: string,
  project: ProjectData
) => {
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

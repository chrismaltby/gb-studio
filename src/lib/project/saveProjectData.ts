import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import type { ProjectData } from "store/features/project/projectActions";

const saveProjectData = async (projectPath: string, project: ProjectData) => {
  await writeFileWithBackupAsync(projectPath, JSON.stringify(project, null, 4));
};

export default saveProjectData;

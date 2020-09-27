import { CompressedProjectData, compressProject } from "../helpers/compression";
import { writeFileWithBackupAsync } from "../helpers/fs/writeFileWithBackup";

const saveProjectData = async (projectPath: string, project: CompressedProjectData) => {
  await writeFileWithBackupAsync(projectPath, JSON.stringify(project, null, 4));
};

export default saveProjectData;

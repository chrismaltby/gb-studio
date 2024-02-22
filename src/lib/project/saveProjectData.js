import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";

const saveProjectData = async (projectPath, project) => {
  await writeFileWithBackupAsync(projectPath, JSON.stringify(project, null, 4));
};

export default saveProjectData;

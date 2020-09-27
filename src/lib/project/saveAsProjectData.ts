import Path from "path";
import { copy, move } from "fs-extra";
import {writeFileAndFlushAsync} from "../helpers/fs/writeFileAndFlush";
import { CompressedProjectData } from "../helpers/compression";

const saveAsProjectData = async (projectPath: string, newProjectPath: string, project: CompressedProjectData) => {
    await copy(Path.join(Path.dirname(projectPath), "assets"), Path.join(Path.dirname(newProjectPath), "assets"));
    await copy(projectPath, newProjectPath);
    await writeFileAndFlushAsync(newProjectPath, JSON.stringify(project, null, 4));
};

export default saveAsProjectData;

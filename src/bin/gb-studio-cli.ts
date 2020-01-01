import { readFile, copy } from "fs-extra";
import buildProject from "../lib/compiler/buildProject";
import Path from "path";
import uuid from "uuid";
import os from "os";

const compile = async (projectFile: string, buildType: string = "rom") => {
    const buildUUID = uuid();
    const projectRoot = Path.dirname(projectFile);
    const project = JSON.parse(await readFile(projectFile, "utf8"));
    const outputRoot = Path.normalize(`${os.tmpdir()}/${buildUUID}`);

    await buildProject(project, {
        projectRoot,
        buildType,
        outputRoot,
        tmpPath: os.tmpdir()
    });

    await copy(
        `${outputRoot}/build/${buildType}`,
        `${projectRoot}/build/${buildType}`
    );
}

const command = process.argv[2];

if (command === "compile") {
    const projectFile = process.argv[3];
    compile(projectFile)
}

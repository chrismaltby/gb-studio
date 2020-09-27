import { readFile, copy } from "fs-extra";
import buildProject from "../lib/compiler/buildProject";
import Path from "path";
import os from "os";
import makeId from "../lib/helpers/makeId";

const usage = () => {
    console.log("usage: gb-studio-cli <command> [<args>]");
    console.log("");
    console.log("These are the valid commands available:");
    console.log("");
    console.log("   compile    Compile a .gbsproj project");
    process.exit(1);    
}

const compile = async (projectFile: string, buildType: string = "rom") => {
    console.log(projectFile);
    const buildUUID = makeId();
    const projectRoot = Path.resolve(Path.dirname(projectFile));
    const project = JSON.parse(await readFile(projectFile, "utf8"));
    const outputRoot = process.env.GBS_OUTPUT_ROOT || Path.normalize(`${os.tmpdir()}/${buildUUID}`);

    await buildProject(project, {
        projectRoot,
        buildType,
        outputRoot,
        tmpPath: os.tmpdir(),
        progress: (message: string) => {
            console.log(message);
        },
        warnings: (message: string) => {
            console.warn(message);
        }        
    });

    await copy(
        `${outputRoot}/build/${buildType}`,
        `${projectRoot}/build/${buildType}`
    );
}

const command = process.argv[2];

if (command === "compile") {
    const projectFile = process.argv[3];
    if(!projectFile) {
        console.error("Missing .gbsproj file path");
        console.error("");
        usage();
    }
    compile(projectFile)
    .catch((e) => {
        console.error("ERROR");
        console.error(e);
        usage();
    })
} else {
    usage();
}

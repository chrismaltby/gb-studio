import { readJSON } from "fs-extra";
import Path from "path";
import os from "os";
import { engineRoot } from "../consts";
import { EngineFieldSchema } from "../store/features/engine/engineState";

interface EngineData {
  fields?: EngineFieldSchema[];
}

const usage = () => {
  console.log("usage: gb-studio-cli <command> [<args>]");
  console.log("");
  console.log("These are the valid commands available:");
  console.log("");
  console.log("   compile    Compile a .gbsproj project");
  process.exit(1);
};

const cmdEject = async (projectFile: string, outputRoot: string) => {
  const projectRoot = Path.resolve(Path.dirname(projectFile));
  const project = await readJSON(projectFile);

  const defaultEngineJsonPath = Path.join(engineRoot, "gb", "engine.json");
  const localEngineJsonPath = Path.join(
    Path.dirname(projectRoot),
    "assets",
    "engine",
    "engine.json"
  );

  let defaultEngine: EngineData = {};
  let localEngine: EngineData = {};

  try {
    localEngine = await readJSON(localEngineJsonPath);
  } catch (e) {
    defaultEngine = await readJSON(defaultEngineJsonPath);
  }

  let fields: EngineFieldSchema[] = [];

  if (localEngine && localEngine.fields) {
    fields = localEngine.fields;
  } else if (defaultEngine && defaultEngine.fields) {
    fields = defaultEngine.fields;
  }

  (global as any).window = {
    location: {
      search: "?path=" + projectFile,
    },
  };

  const compileData = await import("../lib/compiler/compileData").then(
    (module) => module.default
  );

  const ejectBuild = await import("../lib/compiler/ejectBuild").then(
    (module) => module.default
  );

  const compileMusic = await import("../lib/compiler/compileMusic").then(
    (module) => module.default
  );

  const engineFields = fields;
  const tmpPath = os.tmpdir();
  const progress = (message: string) => {
    console.log(message);
  };
  const warnings = (message: string) => {
    console.warn(message);
  };

  const compiledData = await compileData(project, {
    projectRoot,
    engineFields,
    tmpPath,
    progress,
    warnings,
  });
  await ejectBuild({
    projectRoot,
    outputRoot,
    compiledData,
    progress,
    warnings,
  });
  await compileMusic({
    music: compiledData.music,
    musicBanks: compiledData.musicBanks,
    projectRoot,
    buildRoot: outputRoot,
    progress,
    warnings,
  });
};

const command = process.argv[2];

if (command === "eject") {
  const projectFile = process.argv[3];
  if (!projectFile) {
    console.error("Missing .gbsproj file path");
    console.error("");
    usage();
  }
  const outputPath = process.argv[4];
  if (!outputPath) {
    console.error("Missing output path");
    console.error("");
    usage();
  }
  cmdEject(projectFile, outputPath).catch((e) => {
    console.error("ERROR");
    console.error(e);
    usage();
  });
} else {
  usage();
}

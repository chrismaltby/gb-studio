import fs from "fs-extra";
import compile, { EVENT_DATA_COMPILE_PROGRESS } from "./compileData";
import ejectBuild from "./ejectBuild";
import makeBuild from "./makeBuild";

const buildProject = async (
  data,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    outputRoot = "/tmp/testing",
    progress = () => {},
    warnings = () => {}
  } = {}
) => {
  const compiledData = await compile(data, {
    projectRoot,
    tmpPath,
    progress,
    warnings
  });
  await ejectBuild({
    outputRoot,
    compiledData,
    progress,
    warnings
  });
  await makeBuild({
    buildRoot: outputRoot,
    buildType,
    progress,
    warnings
  });
  if (buildType === "web") {
    await fs.copy(
      `${__dirname}/../../data/js-emulator`,
      `${outputRoot}/build/web`
    );
    await fs.copy(
      `${outputRoot}/build/rom/game.gb`,
      `${outputRoot}/build/web/rom/game.gb`
    );
  }
};

export default buildProject;

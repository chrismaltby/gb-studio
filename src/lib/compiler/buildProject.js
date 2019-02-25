import compile, { EVENT_DATA_COMPILE_PROGRESS } from "./compileData";
import ejectBuild from "./ejectBuild";
import makeBuild from "./makeBuild";

const buildProject = async (
  data,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    outputRoot = "/tmp/testing",
    progress = () => {},
    warnings = () => {}
  } = {}
) => {
  const compiledData = await compile(data, {
    projectRoot,
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
};

export default buildProject;

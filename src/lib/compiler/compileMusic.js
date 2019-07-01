import childProcess from "child_process";
import fs from "fs-extra";
import ensureBuildTools from "./ensureBuildTools";
import { assetFilename } from "../helpers/gbstudio";

const filterLogs = str => {
  return str.replace(/.*[/|\\]([^/|\\]*.mod)/g, "$1");
};

const compileMusic = async ({
  music = [],
  buildRoot = "/tmp",
  projectRoot,
  progress = () => {},
  warnings = () => {}
} = {}) => {
  const buildToolsPath = await ensureBuildTools();

  for (let i = 0; i < music.length; i++) {
    const track = music[i];
    await compileTrack(track, {
      buildRoot,
      buildToolsPath,
      projectRoot,
      progress,
      warnings
    });
  }
};

const compileTrack = async (
  track,
  {
    buildRoot = "/tmp",
    buildToolsPath,
    projectRoot,
    progress = () => {},
    warnings = () => {}
  }
) => {
  const env = Object.create(process.env);

  env.PATH = [`${buildToolsPath}/mod2gbt`, env.PATH].join(":");
  const command =
    process.platform === "win32"
      ? `"${buildToolsPath}\\mod2gbt\\mod2gbt.exe"`
      : "mod2gbt";

  const modPath = assetFilename(projectRoot, "music", track);
  const outputFile = process.platform === "win32" ? "output.c" : "music.c";
  const args = [`"${modPath}"`, track.dataName, "-c", track.bank];

  const options = {
    cwd: buildRoot,
    env,
    shell: true
  };

  await new Promise(async (resolve, reject) => {
    const child = childProcess.spawn(command, args, options, {
      encoding: "utf8"
    });

    child.on("error", err => {
      warnings(err.toString());
    });

    child.stdout.on("data", data => {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        progress(filterLogs(line));
      });
    });

    child.stderr.on("data", data => {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        warnings(line);
      });
    });

    child.on("close", code => {
      if (code === 0) resolve();
      else reject(code);
    });
  });

  await fs.move(
    `${buildRoot}/${outputFile}`,
    `${buildRoot}/src/music/${track.dataName}.c`
  );
};

export default compileMusic;

import childProcess from "child_process";

import path from "path";
import { remote } from "electron";
import fs from "fs-extra";
import ensureBuildTools from "./ensureBuildTools";

const filterLogs = str => {
  return str.replace(/.*[\/|\\]([^\/|\\]*.mod)/g, "$1");
};

const compileMusic = async ({
  music = [],
  buildRoot = "/tmp",
  projectRoot,
  progress = () => {},
  warnings = () => {}
} = {}) => {
  const buildToolsPath = await ensureBuildTools();

  console.log("ABOUT TO COMPILE", music);

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

  console.log("DONE WITH MUSIC");
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

  console.log("ABOUT TO COMPILE TRACK", track);
  console.log(buildRoot);

  env.PATH = [`${buildToolsPath}/mod2gbt`, env.PATH].join(":");
  const command =
    process.platform === "win32"
      ? `"${buildToolsPath}\\mod2gbt\\mod2gbt.exe"`
      : "mod2gbt";

  const modPath = `"${projectRoot}/assets/music/${track.filename}"`;
  const outputFile = process.platform === "win32" ? "output.c" : "music.c";
  const args = [modPath, track.dataName, "-c", track.bank];

  const options = {
    cwd: buildRoot,
    env,
    shell: true
  };

  await new Promise(async (resolve, reject) => {
    const child = childProcess.spawn(command, args, options, {
      encoding: "utf8"
    });

    child.on("error", function(err) {
      warnings(err.toString());
    });

    child.stdout.on("data", function(data) {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        progress(filterLogs(line));
      });
    });

    child.stderr.on("data", function(data) {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        warnings(line);
      });
    });

    child.on("close", function(code) {
      if (code == 0) resolve();
      else reject(code);
    });
  });

  await fs.move(
    `${buildRoot}/${outputFile}`,
    `${buildRoot}/src/music/${track.dataName}.c`
  );
};

export default compileMusic;

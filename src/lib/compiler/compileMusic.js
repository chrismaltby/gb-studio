import childProcess from "child_process";

import path from "path";
import { remote } from "electron";
import fs from "fs-extra";
import ensureBuildTools from "./ensureBuildTools";

const compileMusic = async ({
  music = [],
  buildRoot = "/tmp",
  projectRoot,
  progress = () => {},
  warnings = () => {}
} = {}) => {
  const buildToolsPath = await ensureBuildTools();

  console.log("ABOUT TO COMPILE", music);

  for (var i = 0; i < music.length; i++) {
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
  await new Promise(async (resolve, reject) => {
    let env = Object.create(process.env);

    console.log("ABOUT TO COMPILE TRACK", track);
    console.log(buildRoot);

    env.PATH = [`${buildToolsPath}/mod2gbt`, env.PATH].join(":");
    const command = process.platform === "win32" ? "mod2gbt.exe" : "mod2gbt";

    const modPath = `"${projectRoot}/assets/music/${track.filename}"`;

    const args = [modPath, track.dataName, "-c", track.bank];

    const options = {
      cwd: buildRoot,
      env,
      shell: true
    };

    let child = childProcess.spawn(command, args, options, {
      encoding: "utf8"
    });

    child.on("error", function(err) {
      warnings(err.toString());
    });

    child.stdout.on("data", function(data) {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        progress(line);
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
    `${buildRoot}/music.c`,
    `${buildRoot}/src/music/${track.dataName}.c`
  );
};

export default compileMusic;

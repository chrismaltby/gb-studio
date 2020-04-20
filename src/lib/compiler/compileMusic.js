import childProcess from "child_process";
import fs from "fs-extra";
import ensureBuildTools from "./ensureBuildTools";
import { assetFilename } from "../helpers/gbstudio";
import { GB_MAX_BANK_SIZE } from "./bankedData";

const filterLogs = str => {
  return str.replace(/.*[/|\\]([^/|\\]*.mod)/g, "$1");
};

const compileMusic = async ({
  music = [],
  musicBanks = [],
  buildRoot = "/tmp",
  projectRoot,
  progress = () => {},
  warnings = () => {}
} = {}) => {
  const buildToolsPath = await ensureBuildTools();
  var banksize = [];

  for (let i = 0; i < music.length; i++) {
    const track = music[i];
    await compileTrack(track, {
      buildRoot,
      buildToolsPath,
      projectRoot,
      progress,
      warnings
    });
    // Modify Music_Track_x.c to improve bank allocation
    // TODO Recursive bank allocation.
    let musicTrackTemp = await fs.readFile(`${buildRoot}/src/music/${track.dataName}.c`, "utf8");

    // Approximate data size by dividing file lenth, over estimates, better than underestimate.
    var musicSize = Math.floor(musicTrackTemp.length/5.5);
    progress(track.dataName + ' aprox size in bytes: ' + musicSize);

    if (musicSize + banksize[banksize.length-1] < GB_MAX_BANK_SIZE) {
      // Fill bank
      banksize[banksize.length-1] = (banksize[banksize.length - 1] + musicSize);
    } else {
      // New bank
      banksize.push(musicSize);
    }
    // Replaces bank=8 with current bank
    music[i].bank = (musicBanks[banksize.length-1]); // MBC1 compliance
    musicTrackTemp = musicTrackTemp.replace('#pragma bank=8', '#pragma bank='+ music[i].bank);
    progress('Put ' + track.dataName + ' in bank '+ music[i].bank);
    await fs.writeFile(`${buildRoot}/src/music/${track.dataName}.c`, musicTrackTemp, "utf8");
  }

  // Modify data_ptrs for new music banks
  let dataptrTemp = await fs.readFile(`${buildRoot}/src/data/data_ptrs.c`, "utf8");
  dataptrTemp = dataptrTemp.replace(`const unsigned char music_banks[] = {\n`, 
    `const unsigned char music_banks[] = {\n${music.map(track => track.bank).join(", ") || "0"}, 0`);
  await fs.writeFile(`${buildRoot}/src/data/data_ptrs.c`, dataptrTemp, "utf8");
  // Great for debugging build errors
  progress('Approximate Music bank sizes: ' + banksize);
  progress(`Music bank for each track: ${music.map(track => track.bank).join(", ") || "0"}`);
  progress('data_ptrs.c rewritten with new song banks\n\n');
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
  const args = [`"${modPath}"`, track.dataName, "-c", 8]; // Replace bank 8 later
  progress(`Convert "${modPath}" to "${track.dataName}"`);

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

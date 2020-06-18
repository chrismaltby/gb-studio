import childProcess from "child_process";
import fs from "fs-extra";
import ensureBuildTools from "./ensureBuildTools";
import { assetFilename } from "../helpers/gbstudio";
import { GB_MAX_BANK_SIZE } from "./bankedData";
import { decHex16 } from "../helpers/8bit";

const filterLogs = (str) => {
  return str.replace(/.*[/|\\]([^/|\\]*.mod)/g, "$1");
};

const trackBuildCache = {};

const compileMusic = async ({
  music = [],
  musicBanks = [],
  buildRoot = "/tmp",
  projectRoot,
  progress = () => {},
  warnings = () => {},
} = {}) => {
  const buildToolsPath = await ensureBuildTools();
  await fs.ensureDir(`${buildRoot}/src/music`);

  // Raw music track data organised into banks
  const bankedData = [
    {
      bank: musicBanks[0],
      size: 0,
      tracks: [],
    },
  ];

  for (let i = 0; i < music.length; i++) {
    const track = music[i];

    const trackModifiedTime = await getTrackModifiedTime(track, { projectRoot });

    let musicData;
    if(trackBuildCache[track.id] && trackBuildCache[track.id].timestamp >= trackModifiedTime) {
      musicData = trackBuildCache[track.id].data;
      musicData.name = track.dataName;
    } else {
      // Compile track using mod2gbt
      await compileTrack(track, {
        buildRoot,
        buildToolsPath,
        projectRoot,
        progress,
        warnings,
      });

      // Read track's compiled C data
      let musicTrackTemp = await fs.readFile(
        `${buildRoot}/src/music/${track.dataName}.c`,
        "utf8"
      );

      // Parse C data into raw pattern and order data
      musicData = {
        name: track.dataName,
        ...parseMusicFile(musicTrackTemp),
      };

      trackBuildCache[track.id] = {
        data: musicData,
        timestamp: trackModifiedTime
      }

      // Delete mod2gbt compile track, no longer needed
      await fs.unlink(`${buildRoot}/src/music/${track.dataName}.c`);
    }

    progress(`${track.dataName} approx size in bytes: ${musicData.size}`);

    if (
      musicData.size + bankedData[bankedData.length - 1].size <
      GB_MAX_BANK_SIZE
    ) {
      // If current track fits into the current bank then store it
      bankedData[bankedData.length - 1].size += musicData.size;
      bankedData[bankedData.length - 1].tracks.push(musicData);
      track.bank = bankedData[bankedData.length - 1].bank;
    } else {
      // Otherwise switch to new bank
      bankedData.push({
        bank: musicBanks[bankedData.length],
        size: musicData.size,
        tracks: [musicData],
      });
      track.bank = musicBanks[bankedData.length];
    }
  }

  // Array of tracks containing bank number and memory offset
  const trackPtrs = [];

  for (let i = 0; i < bankedData.length; i++) {
    const musicBank = bankedData[i];

    if (musicBank.size === 0) {
      continue;
    }

    // Build music bank file with combined data for all
    // tracks in this bank
    let fileData =
      `#pragma bank=${musicBank.bank}\n\n` +
      `const unsigned char bank_${musicBank.bank}_data[] = {\n` +
      musicBank.tracks.map((track) => track.patterns.join(",")).join(",") +
      `};\n\n`;

    let maxOffset = 0x4000; // Banked memory start address
    const patternOffsets = [];
    for (let t = 0; t < musicBank.tracks.length; t++) {
      const track = musicBank.tracks[t];

      // Calculate memory offsets in bank for each pattern
      let trackPatternOffsets = [];
      for (let p = 0; p < track.patterns.length; p++) {
        trackPatternOffsets[p] = maxOffset;
        maxOffset += track.patterns[p].length;
      }
      // patternOffsets.push(trackPatternOffsets);

      const orderedTrackPatternOffsets = [];
      // Build pointers to patterns based on calculated memory offsets
      fileData += `const unsigned int ${track.name}_Data[] = {\n`;
      for (let o = 0; o < track.order.length; o++) {
        fileData += decHex16(trackPatternOffsets[track.order[o]]) + ",";
        orderedTrackPatternOffsets.push(trackPatternOffsets[track.order[o]]);
      }
      patternOffsets.push(orderedTrackPatternOffsets);

      fileData += `0x0000\n};\n\n`;
    }

    // Calculate memory pointers for each track in bank to
    // rebuild data_ptrs later
    for (let t = 0; t < musicBank.tracks.length; t++) {
      const track = musicBank.tracks[t];
      trackPtrs.push({
        bank: musicBank.bank,
        offset: maxOffset,
      });
      maxOffset += (track.order.length + 1) * 2;
    }

    await fs.writeFile(
      `${buildRoot}/src/music/music_bank_${musicBank.bank}.c`,
      fileData,
      "utf8"
    );

  }

  // Modify data_ptrs for new music banks
  let dataptrTemp = await fs.readFile(
    `${buildRoot}/src/data/data_ptrs.c`,
    "utf8"
  );

  // Set music_banks array to track banks
  dataptrTemp = dataptrTemp.replace(
    `const unsigned char music_banks[] = {\n`,
    `const unsigned char music_banks[] = {\n${
      trackPtrs.map((track) => track.bank).join(", ") || "0"
    }, 0`
  );

  // Set music_tracks array to track memory addresses
  dataptrTemp = dataptrTemp.replace(
    /const unsigned int music_tracks\[\] = {[^}]*}/g,
    `const unsigned int music_tracks[] = {\n${
      trackPtrs.map((track) => decHex16(track.offset)).join(", ") || "0"
    }, 0\n}`
  );

  await fs.writeFile(`${buildRoot}/src/data/data_ptrs.c`, dataptrTemp, "utf8");

  // Great for debugging build errors
  progress("Approximate Music bank sizes: " + bankedData.length);
  progress(
    `Music bank for each track: ${
      trackPtrs.map((track) => track.bank).join(", ") || "0"
    }`
  );
  progress("data_ptrs.c rewritten with new song banks\n\n");
};

const parseMusicFile = (string) => {
  const patternStrings = string.match(
    /const unsigned char music_track_[0-9]+_[0-9]+\[\] = {[^}]*}/g
  );
  const patterns = patternStrings.map((patternString) => {
    return patternString
      .replace(/[^{]*{[^0]*/g, "")
      .replace(/}/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter((i) => i)
      .map((s) => parseInt(s, 16))
  });
  const patternsSize = patterns.reduce((memo, pattern) => {
    return memo + pattern.length;
  }, 0);
  const order = string
    .replace(/[\S\s]*music_track_[0-9]+__Data\[\] = {/g, "")
    .replace(/}.*/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter((i) => i && i.indexOf && i.indexOf("music_track") > -1)
    .map((s) => parseInt(s.replace(/.*_/, ""), 10));
  return {
    patterns,
    order,
    patternsSize,
    size: patternsSize + (order.length + 1) * 2,
  };
};

const getTrackModifiedTime = async (track, {
    projectRoot,
}) => {
  const modPath = assetFilename(projectRoot, "music", track, true);
  return (await fs.stat(modPath)).mtimeMs;
}

const compileTrack = async (
  track,
  {
    buildRoot = "/tmp",
    buildToolsPath,
    projectRoot,
    progress = () => {},
    warnings = () => {},
  }
) => {
  const env = Object.create(process.env);

  env.PATH = [`${buildToolsPath}/mod2gbt`, env.PATH].join(":");
  const command =
    process.platform === "win32"
      ? `"${buildToolsPath}\\mod2gbt\\mod2gbt.exe"`
      : "mod2gbt";

  const modPath = assetFilename(projectRoot, "music", track, true);
  const outputFile = process.platform === "win32" ? "output.c" : "music.c";
  const args = [`"${modPath}"`, track.dataName, "-c", 8]; // Replace bank 8 later
  progress(`Convert "${modPath}" to "${track.dataName}"`);

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  await new Promise(async (resolve, reject) => {
    const child = childProcess.spawn(command, args, options, {
      encoding: "utf8",
    });

    child.on("error", (err) => {
      warnings(err.toString());
    });

    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        progress(filterLogs(line));
      });
    });

    child.stderr.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        warnings(line);
      });
    });

    child.on("close", (code) => {
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

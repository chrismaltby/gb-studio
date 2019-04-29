import fs from "fs-extra";
import Path from "path";

export default async (buildRoot, { CART_TYPE }) => {
  let cmds = [];
  let buildFiles = [];
  let objFiles = [];
  let musicFiles = [];

  const CC = `..\\_gbs\\gbdk\\bin\\lcc -Wa-l -Wl-m -Wl-j -Wl-yt${CART_TYPE} -Iinclude`;
  const CFLAGS = `-DUSE_SFR_FOR_REG -Wl-yo64 -Wl-ya4`;

  const srcRoot = `${buildRoot}/src`;
  const dataRoot = `${buildRoot}/src/data`;
  const musicRoot = `${buildRoot}/src/music`;
  const srcFiles = await fs.readdir(srcRoot);
  const dataFiles = await fs.readdir(dataRoot);
  try {
    musicFiles = await fs.readdir(musicRoot);
  } catch (e) {}

  for (let file of srcFiles) {
    const fileStat = await fs.lstat(`${srcRoot}/${file}`);
    const ext = Path.extname(file);
    if (fileStat.isFile() && [".c", ".s"].indexOf(ext) > -1) {
      buildFiles.push(`src/${file}`);
    }
  }

  for (let file of dataFiles) {
    const fileStat = await fs.lstat(`${dataRoot}/${file}`);
    const ext = Path.extname(file);
    if (fileStat.isFile() && [".c", ".s"].indexOf(ext) > -1) {
      buildFiles.push(`src/data/${file}`);
    }
  }

  for (let file of musicFiles) {
    const fileStat = await fs.lstat(`${musicRoot}/${file}`);
    const ext = Path.extname(file);
    if (fileStat.isFile() && [".c", ".s"].indexOf(ext) > -1) {
      buildFiles.push(`src/music/${file}`);
    }
  }

  for (let file of buildFiles) {
    const objFile = file.replace(/^src/, "obj").replace(/\.[cs]$/, "") + ".o";
    cmds.push(`${CC} -c -o ${objFile} ${file}`);
    objFiles.push(objFile);
  }

  cmds.push(`${CC} ${CFLAGS} -o build/rom/game.gb ${objFiles.join(" ")}`);

  return cmds.join("\n");
};

import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import { createReadStream } from "fs-extra";
import { stat } from "fs";
import { PNG } from "pngjs";

import parseAssetPath from "../helpers/path/parseAssetPath";

export interface FontAssetData {
  id: string;
  plugin: string | undefined;
  name: string;
  width: number;
  height: number;
  filename: string;
  inode: string;
  _v: number;
}

const globAsync = promisify(glob);
const statAsync = promisify(stat);

const sizeOfAsync = (
  filename: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    createReadStream(filename)
      .pipe(new PNG())
      .on("metadata", resolve)
      .on("error", reject);
  });
};

const loadFontData = (projectRoot: string) => async (
  filename: string
): Promise<FontAssetData | null> => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, "fonts");
  try {
    const size = await sizeOfAsync(filename);
    const fileStat = await statAsync(filename, { bigint: true });
    const inode = fileStat.ino.toString();
    return {
      id: uuid(),
      plugin,
      name: file.replace(/.png/i, ""),
      width: size.width,
      height: size.height,
      filename: file,
      inode,
      _v: Date.now(),
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

const loadAllFontData = async (
  projectRoot: string
): Promise<FontAssetData[]> => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/fonts/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/fonts/**/@(*.png|*.PNG)`
  );
  const imageData = (
    await Promise.all(
      ([] as Promise<FontAssetData | null>[]).concat(
        imagePaths.map(loadFontData(projectRoot)),
        pluginPaths.map(loadFontData(projectRoot))
      )
    )
  ).filter((i) => i);
  return imageData as FontAssetData[];
};

export default loadAllFontData;
export { loadFontData };

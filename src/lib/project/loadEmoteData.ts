import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import { createReadStream } from "fs-extra";
import { stat } from "fs";
import { PNG } from "pngjs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { EmoteResource, EmoteResourceAsset } from "shared/lib/resources/types";
import { getAssetResource } from "./assets";

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

const loadEmoteData =
  (projectRoot: string) =>
  async (filename: string): Promise<EmoteResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "emotes");
    const resource = await getAssetResource(EmoteResource, filename);
    try {
      const size = await sizeOfAsync(filename);
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      const name = file.replace(/.png/i, "");
      return {
        _resourceType: "emote",
        id: uuid(),
        plugin,
        name,
        symbol: toValidSymbol(`emote_${name}`),
        width: size.width,
        height: size.height,
        _v: Date.now(),
        ...resource,
        filename: file,
        inode,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllEmoteData = async (
  projectRoot: string
): Promise<EmoteResourceAsset[]> => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/emotes/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/emotes/**/@(*.png|*.PNG)`
  );
  const imageData = (
    await Promise.all(
      ([] as Promise<EmoteResourceAsset | null>[]).concat(
        imagePaths.map(loadEmoteData(projectRoot)),
        pluginPaths.map(loadEmoteData(projectRoot))
      )
    )
  ).filter((i) => i);
  return imageData as EmoteResourceAsset[];
};

export default loadAllEmoteData;
export { loadEmoteData };

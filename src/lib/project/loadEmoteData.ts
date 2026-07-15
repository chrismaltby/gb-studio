import { glob } from "lib/helpers/glob";
import { promisify } from "util";
import { v4 as uuid } from "uuid";
import { stat } from "fs";
import pngSize from "lib/helpers/pngSize";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { EmoteResource, EmoteResourceAsset } from "shared/lib/resources/types";
import { getAssetResource } from "./assets";
const statAsync = promisify(stat);

const loadEmoteData =
  (projectRoot: string) =>
  async (filename: string): Promise<EmoteResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "emotes");
    const resource = await getAssetResource(EmoteResource, filename);
    try {
      const size = await pngSize(filename);
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
  projectRoot: string,
): Promise<EmoteResourceAsset[]> => {
  const imagePaths = await glob("assets/emotes/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const pluginPaths = await glob("plugins/*/**/emotes/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const imageData = (
    await Promise.all(
      ([] as Promise<EmoteResourceAsset | null>[]).concat(
        imagePaths.map(loadEmoteData(projectRoot)),
        pluginPaths.map(loadEmoteData(projectRoot)),
      ),
    )
  ).filter((i) => i);
  return imageData as EmoteResourceAsset[];
};

export default loadAllEmoteData;
export { loadEmoteData };

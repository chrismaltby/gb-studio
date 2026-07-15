import { glob } from "lib/helpers/glob";
import { promisify } from "util";
import { v4 as uuid } from "uuid";
import { stat } from "fs";
import pngSize from "lib/helpers/pngSize";

import parseAssetPath from "shared/lib/assets/parseAssetPath";
import {
  AvatarResource,
  AvatarResourceAsset,
} from "shared/lib/resources/types";
import { getAssetResource } from "./assets";
const statAsync = promisify(stat);

const loadAvatarData =
  (projectRoot: string) =>
  async (filename: string): Promise<AvatarResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "avatars");
    const resource = await getAssetResource(AvatarResource, filename);
    try {
      const size = await pngSize(filename);
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      return {
        _resourceType: "avatar",
        id: uuid(),
        plugin,
        name: file.replace(/.png/i, ""),
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

const loadAllAvatarData = async (
  projectRoot: string,
): Promise<AvatarResourceAsset[]> => {
  const imagePaths = await glob("assets/avatars/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const pluginPaths = await glob("plugins/*/**/avatars/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const imageData = (
    await Promise.all(
      ([] as Promise<AvatarResourceAsset | null>[]).concat(
        imagePaths.map(loadAvatarData(projectRoot)),
        pluginPaths.map(loadAvatarData(projectRoot)),
      ),
    )
  ).filter((i) => i);
  return imageData as AvatarResourceAsset[];
};

export default loadAllAvatarData;
export { loadAvatarData };

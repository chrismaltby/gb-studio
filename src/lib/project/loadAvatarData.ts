import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import { createReadStream } from "fs-extra";
import { stat } from "fs";
import { PNG } from "pngjs";

import parseAssetPath from "shared/lib/assets/parseAssetPath";
import {
  AvatarResource,
  AvatarResourceAsset,
} from "shared/lib/resources/types";
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

const loadAvatarData =
  (projectRoot: string) =>
  async (filename: string): Promise<AvatarResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "avatars");
    const resource = await getAssetResource(AvatarResource, filename);
    try {
      const size = await sizeOfAsync(filename);
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
  projectRoot: string
): Promise<AvatarResourceAsset[]> => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/avatars/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/avatars/**/@(*.png|*.PNG)`
  );
  const imageData = (
    await Promise.all(
      ([] as Promise<AvatarResourceAsset | null>[]).concat(
        imagePaths.map(loadAvatarData(projectRoot)),
        pluginPaths.map(loadAvatarData(projectRoot))
      )
    )
  ).filter((i) => i);
  return imageData as AvatarResourceAsset[];
};

export default loadAllAvatarData;
export { loadAvatarData };

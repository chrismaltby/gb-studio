import Path from "path";

export type Asset = {
  filename: string;
  plugin?: string;
};

export type AssetType =
  | "avatars"
  | "backgrounds"
  | "emotes"
  | "fonts"
  | "music"
  | "sounds"
  | "sprites"
  | "ui";

export const assetFilename = (
  projectRoot: string,
  assetType: AssetType,
  asset: Asset
) => {
  return (
    asset.plugin
      ? Path.join(
          projectRoot,
          "plugins",
          asset.plugin,
          assetType,
          asset.filename
        )
      : Path.join(projectRoot, "assets", assetType, asset.filename)
  ).replace(/\\/g, "/");
};

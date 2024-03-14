import Path from "path";

export type Asset = {
  filename: string;
  plugin?: string;
  _v?: number;
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

export const assetPath = (assetType: AssetType, asset: Asset) => {
  return (
    asset.plugin
      ? Path.join("plugins", asset.plugin, assetType, asset.filename)
      : Path.join("assets", assetType, asset.filename)
  ).replace(/\\/g, "/");
};

export const assetFilename = (
  projectRoot: string,
  assetType: AssetType,
  asset: Asset
) => {
  return Path.join(projectRoot, assetPath(assetType, asset));
};

export const assetURL = (assetType: AssetType, asset: Asset) => {
  return `gbs://project/${assetPath(assetType, asset)}?_v=${asset._v}`;
};

export const assetURLStyleProp = (assetType: AssetType, asset: Asset) => {
  return `url("gbs://project/${assetPath(assetType, asset)}?_v=${asset._v}")`;
};

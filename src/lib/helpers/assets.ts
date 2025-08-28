import path from "path";
import l10n from "shared/lib/lang/l10n";

const isAssetWithinProject = (assetPath: string, projectRoot: string) => {
  const absoluteParentPath = path.resolve(projectRoot);
  const absoluteChildPath = path.resolve(assetPath);

  if (absoluteParentPath === absoluteChildPath) {
    return true;
  }
  return absoluteChildPath.startsWith(absoluteParentPath);
};

export const guardAssetWithinProject = (
  assetPath: string,
  projectRoot: string,
) => {
  if (!isAssetWithinProject(assetPath, projectRoot)) {
    throw new Error(l10n("ERROR_ASSET_DOESNT_BELONG_TO_CURRENT_PROJECT"));
  }
};

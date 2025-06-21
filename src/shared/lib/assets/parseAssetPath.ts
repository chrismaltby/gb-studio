import { relative, sep } from "path";
import { pathToPosix } from "shared/lib/helpers/path";

const extractPluginPath = (relativePath: string, assetFolder: string) => {
  if (!relativePath.startsWith("plugins")) {
    return undefined;
  }

  const assetFolderIndex = relativePath.lastIndexOf(assetFolder);

  if (assetFolderIndex === -1) {
    return undefined;
  }

  const extractedPath = relativePath.substring(
    "plugins".length + 1,
    assetFolderIndex - 1,
  );
  return extractedPath.split(sep).join("/");
};

const parseAssetPath = (
  filename: string,
  projectRoot: string,
  assetFolder: string,
) => {
  const relativePath = relative(projectRoot, filename);
  const plugin = relativePath.startsWith("plugins")
    ? extractPluginPath(relativePath, assetFolder)
    : undefined;
  const file = pathToPosix(
    plugin
      ? relative(`plugins/${plugin}/${assetFolder}/`, relativePath)
      : relative(`assets/${assetFolder}/`, relativePath),
  );
  return {
    relativePath,
    plugin,
    file,
  };
};

export default parseAssetPath;

import Path from "path";

const parseAssetPath = (
  filename: string,
  projectRoot: string,
  assetFolder: string
) => {
  const relativePath = Path.relative(projectRoot, filename);
  const plugin = relativePath.startsWith("plugins")
    ? relativePath.split(Path.sep)[1]
    : undefined;
  const file = plugin
    ? Path.relative(`plugins/${plugin}/${assetFolder}/`, relativePath)
    : Path.relative(`assets/${assetFolder}/`, relativePath);
  return {
    relativePath,
    plugin,
    file,
  };
};

export default parseAssetPath;

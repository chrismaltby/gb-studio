import path from "path";

export const isFilePathWithinFolder = (
  filePath: string,
  folderPath: string,
) => {
  const absoluteParentPath = path.resolve(folderPath);
  const absoluteChildPath = path.resolve(filePath);

  if (absoluteParentPath === absoluteChildPath) {
    return true;
  }
  return absoluteChildPath.startsWith(absoluteParentPath);
};

type Asset = {
  id: string;
  filename: string;
};

export type FileSystemNavigatorItem<T> = {
  id: string;
  type: "file" | "folder";
  name: string;
  filename: string;
  nestLevel?: number;
  asset?: T;
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByFilename = (a: Asset, b: Asset) => {
  return collator.compare(a.filename, b.filename);
};

export const buildAssetNavigatorItems = <T extends Asset>(
  assets: T[],
  openFolders: string[]
): FileSystemNavigatorItem<T>[] => {
  const result: FileSystemNavigatorItem<T>[] = [];
  const uniqueFolders = new Set<string>();

  const isVisible = (filename: string, nestLevel?: number): boolean => {
    if (nestLevel === undefined || nestLevel === 0) return true;
    const pathSegments = filename.split(/[\\/]/);
    pathSegments.pop();
    let pathCheck = "";
    return pathSegments.every((segment, index) => {
      pathCheck += (index ? "/" : "") + segment;
      return openFolders.includes(pathCheck);
    });
  };

  assets
    .slice()
    .sort(sortByFilename)
    .forEach((asset) => {
      const path = asset.filename;
      const parts = path.split(/[\\/]/)
      let currentPath = "";

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath += (currentPath ? "/" : "") + part;
        if (isLast) {
          const nestLevel = parts.length > 1 ? parts.length - 1 : 0;
          if (!isVisible(currentPath, nestLevel)) {
            return;
          }
          result.push({
            id: asset.id,
            type: "file",
            name: currentPath.replace(/\.[^.]*$/, ""),
            filename: part,
            nestLevel,
            asset,
          });
        } else if (!uniqueFolders.has(currentPath)) {
          if (!isVisible(currentPath, index)) {
            return;
          }
          uniqueFolders.add(currentPath);
          result.push({
            id: currentPath,
            type: "folder",
            name: currentPath,
            filename: part,
            nestLevel: index,
          });
        }
      });
    });

  return result;
};

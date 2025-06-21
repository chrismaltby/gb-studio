import { join } from "path";

type Asset = {
  id: string;
  filename: string;
  plugin?: string;
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

const sortByName = <T>(
  a: FileSystemNavigatorItem<T>,
  b: FileSystemNavigatorItem<T>,
) => {
  return collator.compare(a.name, b.name);
};

export const buildAssetNavigatorItems = <T extends Asset>(
  assets: T[],
  openFolders: string[],
  searchTerm: string,
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

  if (searchTerm.length > 0) {
    const searchTermUpperCase = searchTerm.toLocaleUpperCase();
    assets
      .filter((asset) =>
        asset.filename.toLocaleUpperCase().includes(searchTermUpperCase),
      )
      .forEach((asset) => {
        result.push({
          id: asset.id,
          type: "file",
          name: asset.filename.replace(/\.[^.]*$/, ""),
          filename: asset.filename.replace(/.*[/\\]/, ""),
          nestLevel: 0,
          asset,
        });
      });
    return result;
  }

  assets.slice().forEach((asset) => {
    const path = asset.plugin
      ? join("plugins", asset.plugin, asset.filename)
      : asset.filename;
    const parts = path.split(/[\\/]/);
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

  return result.sort(sortByName);
};

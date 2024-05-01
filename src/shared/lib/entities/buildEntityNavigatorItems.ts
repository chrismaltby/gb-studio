type Entity = {
  id: string;
  name: string;
};

export type EntityNavigatorItem<T> = {
  id: string;
  type: "entity" | "folder";
  name: string;
  filename: string;
  nestLevel?: number;
  entity?: T;
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: Entity, b: Entity) => {
  return collator.compare(a.name, b.name);
};

export const buildEntityNavigatorItems = <T extends Entity>(
  entities: T[],
  openFolders: string[],
  customSort?: (a: T, b: T) => number
): EntityNavigatorItem<T>[] => {
  const result: EntityNavigatorItem<T>[] = [];
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

  entities
    .slice()
    .sort(customSort ?? sortByName)
    .forEach((entity) => {
      const path = entity.name;
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
            id: entity.id,
            type: "entity",
            name: currentPath,
            filename: part,
            nestLevel,
            entity,
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

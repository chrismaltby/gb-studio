export const normalizePath = (path: string): string =>
  path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/$/, "");

export const splitPath = (path: string): string[] =>
  normalizePath(path).split("/").filter(Boolean);

export const joinPath = (...segments: string[]): string =>
  normalizePath(segments.filter(Boolean).join("/"));

export const getBaseName = (path: string): string => {
  const norm = normalizePath(path);
  if (!norm) return "";

  const lastSlash = norm.lastIndexOf("/");
  return lastSlash === -1 ? norm : norm.slice(lastSlash + 1);
};

export const getParentPath = (path: string): string => {
  const norm = normalizePath(path);
  if (!norm) return "";

  const lastSlash = norm.lastIndexOf("/");
  return lastSlash === -1 ? "" : norm.slice(0, lastSlash);
};

export const isDescendantPath = (parent: string, child: string): boolean => {
  const parentNorm = normalizePath(parent);
  if (!parentNorm) return false;

  const childNorm = normalizePath(child);

  if (!childNorm.startsWith(parentNorm)) return false;

  const nextChar = childNorm[parentNorm.length];
  return nextChar === undefined || nextChar === "/";
};

export const reparentFolderPath = (
  originalPath: string,
  draggedPath: string,
  dropFolder: string,
): string | null => {
  const originalNorm = normalizePath(originalPath);
  const draggedNorm = normalizePath(draggedPath);
  const dropNorm = normalizePath(dropFolder);

  // Can't move a file, only a folder
  if (originalPath === draggedPath) {
    return null;
  }

  // Folder move
  if (isDescendantPath(draggedNorm, originalNorm)) {
    const relative = originalNorm.slice(draggedNorm.length);
    return joinPath(dropNorm, getBaseName(draggedNorm), relative);
  }

  return null;
};

export const reparentEntityPath = (
  originalPath: string,
  toPath: string,
): string => {
  const isUnnamed = originalPath.endsWith("/") || originalPath.endsWith("\\");

  const base = isUnnamed ? "" : getBaseName(originalPath);

  if (base) {
    return joinPath(toPath, base);
  }

  const normalized = normalizePath(toPath);
  return normalized ? normalized + "/" : "";
};

export const canMoveFolder = (
  draggedPath: string,
  dropFolder: string,
): boolean => {
  const draggedNorm = normalizePath(draggedPath);
  if (!draggedNorm) {
    return false;
  }
  return !isDescendantPath(draggedNorm, dropFolder);
};

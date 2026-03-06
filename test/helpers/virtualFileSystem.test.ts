import {
  normalizePath,
  splitPath,
  getBaseName,
  isDescendantPath,
  canMoveFolder,
  reparentFolderPath,
  joinPath,
  getParentPath,
  reparentEntityPath,
} from "shared/lib/helpers/virtualFilesystem";

describe("normalizePath", () => {
  test("should replace backslashes with forward slashes", () => {
    expect(normalizePath("folder\\subfolder\\file.txt")).toBe(
      "folder/subfolder/file.txt",
    );
  });

  test("should collapse duplicate slashes", () => {
    expect(normalizePath("folder//sub///file")).toBe("folder/sub/file");
  });

  test("should remove leading slashes", () => {
    expect(normalizePath("/folder/sub")).toBe("folder/sub");
    expect(normalizePath("///folder/sub")).toBe("folder/sub");
  });

  test("should remove trailing slash", () => {
    expect(normalizePath("folder/sub/")).toBe("folder/sub");
  });

  test("should handle mixed separators and duplicates", () => {
    expect(normalizePath("\\folder\\\\sub//file\\")).toBe("folder/sub/file");
  });

  test("should return empty string for root or empty input", () => {
    expect(normalizePath("")).toBe("");
    expect(normalizePath("/")).toBe("");
    expect(normalizePath("////")).toBe("");
  });
});

describe("splitPath", () => {
  test("should split normalized path into parts", () => {
    expect(splitPath("folder/sub/file")).toEqual(["folder", "sub", "file"]);
  });

  test("should normalize before splitting", () => {
    expect(splitPath("\\folder//sub\\file")).toEqual(["folder", "sub", "file"]);
  });

  test("should return empty array for empty path", () => {
    expect(splitPath("")).toEqual([]);
    expect(splitPath("/")).toEqual([]);
  });
});

describe("joinPath", () => {
  test("should join two simple segments", () => {
    expect(joinPath("a", "b")).toBe("a/b");
  });

  test("should join multiple segments", () => {
    expect(joinPath("a", "b", "c")).toBe("a/b/c");
  });

  test("should ignore empty segments", () => {
    expect(joinPath("a", "", "b")).toBe("a/b");
    expect(joinPath("", "a", "b")).toBe("a/b");
    expect(joinPath("a", "b", "")).toBe("a/b");
  });

  test("should return empty string if all segments are empty", () => {
    expect(joinPath("", "", "")).toBe("");
  });

  test("should normalize duplicate slashes", () => {
    expect(joinPath("a//", "///b")).toBe("a/b");
  });

  test("should normalize backslashes", () => {
    expect(joinPath("a\\", "b\\c")).toBe("a/b/c");
  });

  test("should remove leading slashes", () => {
    expect(joinPath("/a", "b")).toBe("a/b");
  });

  test("should remove trailing slash in result", () => {
    expect(joinPath("a", "b/")).toBe("a/b");
  });

  test("should handle root-like joins correctly", () => {
    expect(joinPath("", "file.txt")).toBe("file.txt");
    expect(joinPath("", "a", "file.txt")).toBe("a/file.txt");
  });

  test("should handle deeply nested segments", () => {
    expect(joinPath("a", "b/c", "d")).toBe("a/b/c/d");
  });

  test("should collapse complex mixed separators", () => {
    expect(joinPath("\\a//", "/b\\", "c//d\\")).toBe("a/b/c/d");
  });

  test("should work with single segment", () => {
    expect(joinPath("a")).toBe("a");
  });

  test("should work with no segments", () => {
    expect(joinPath()).toBe("");
  });
});

describe("getBaseName", () => {
  test("should return last segment of path", () => {
    expect(getBaseName("folder/sub/file")).toBe("file");
  });

  test("should normalize before getting base name", () => {
    expect(getBaseName("\\folder//sub\\file")).toBe("file");
  });

  test("should return single segment if no slashes", () => {
    expect(getBaseName("file")).toBe("file");
  });

  test("should return empty string for empty path", () => {
    expect(getBaseName("")).toBe("");
    expect(getBaseName("/")).toBe("");
  });
});

describe("getParentPath", () => {
  test("should return parent of nested path", () => {
    expect(getParentPath("a/b/c")).toBe("a/b");
  });

  test("should return parent of two-level path", () => {
    expect(getParentPath("a/b")).toBe("a");
  });

  test("should return empty string for single segment", () => {
    expect(getParentPath("a")).toBe("");
  });

  test("should return empty string for empty path", () => {
    expect(getParentPath("")).toBe("");
  });

  test("should return empty string for root-like path", () => {
    expect(getParentPath("/")).toBe("");
    expect(getParentPath("////")).toBe("");
  });

  test("should normalize before computing parent", () => {
    expect(getParentPath("\\a//b\\c")).toBe("a/b");
  });

  test("should remove trailing slash before computing parent", () => {
    expect(getParentPath("a/b/c/")).toBe("a/b");
  });

  test("should handle deeply nested paths", () => {
    expect(getParentPath("a/b/c/d/e")).toBe("a/b/c/d");
  });

  test("should not treat similar prefixes specially", () => {
    expect(getParentPath("folderA/file.txt")).toBe("folderA");
  });

  test("should handle double slashes correctly", () => {
    expect(getParentPath("a//b///c")).toBe("a/b");
  });
});

describe("isDescendantPath", () => {
  test("should return true when child is direct descendant", () => {
    expect(isDescendantPath("folder", "folder/sub")).toBe(true);
  });

  test("should return true when child is deep descendant", () => {
    expect(isDescendantPath("folder", "folder/sub/file")).toBe(true);
  });

  test("should return true when parent and child are identical", () => {
    expect(isDescendantPath("folder/sub", "folder/sub")).toBe(true);
  });

  test("should return false when parent is empty", () => {
    expect(isDescendantPath("", "folder/sub")).toBe(false);
  });

  test("should return false when child does not start with parent", () => {
    expect(isDescendantPath("folder", "other/sub")).toBe(false);
  });

  test("should not treat similar prefixes as descendants", () => {
    expect(isDescendantPath("folderA", "folderAB/sub")).toBe(false);
  });

  test("should handle normalization before comparison", () => {
    expect(isDescendantPath("\\folder//sub", "folder/sub/file")).toBe(true);
  });

  test("should return false when child is shorter and not equal", () => {
    expect(isDescendantPath("folder/sub", "folder")).toBe(false);
  });
});

describe("canMoveFolder", () => {
  test("should allow moving folder to a different top-level folder", () => {
    expect(canMoveFolder("a", "b")).toBe(true);
  });

  test("should allow moving folder into sibling folder", () => {
    expect(canMoveFolder("a", "b/c")).toBe(true);
  });

  test("should allow moving folder into deeper unrelated folder", () => {
    expect(canMoveFolder("a", "x/y/z")).toBe(true);
  });

  test("should NOT allow moving folder into itself", () => {
    expect(canMoveFolder("a/b", "a/b")).toBe(false);
  });

  test("should NOT allow moving folder into its direct descendant", () => {
    expect(canMoveFolder("a", "a/b")).toBe(false);
  });

  test("should NOT allow moving folder into deep descendant", () => {
    expect(canMoveFolder("a", "a/b/c/d")).toBe(false);
  });

  test("should NOT treat similar prefixes as descendants", () => {
    expect(canMoveFolder("folderA", "folderAB/sub")).toBe(true);
  });

  test("should normalize paths before comparison", () => {
    expect(canMoveFolder("\\a//b", "a/b/c")).toBe(false);
  });

  test("should allow moving nested folder to root (empty)", () => {
    expect(canMoveFolder("a/b", "")).toBe(true);
  });

  test("should NOT allow moving root folder into descendant", () => {
    expect(canMoveFolder("", "a/b")).toBe(false);
  });
});

describe("reparentFolderPath", () => {
  test("should not allow moving a single file to new folder", () => {
    expect(reparentFolderPath("a/file.txt", "a/file.txt", "b")).toBeNull();
  });

  test("should return null for non-matching single item", () => {
    expect(reparentFolderPath("a/other.txt", "a/file.txt", "b")).toBeNull();
  });

  test("should move direct child of folder", () => {
    expect(reparentFolderPath("a/file.txt", "a", "b")).toBe("b/a/file.txt");
  });

  test("should move deep descendant of folder", () => {
    expect(reparentFolderPath("a/sub/file.txt", "a", "b")).toBe(
      "b/a/sub/file.txt",
    );
  });

  test("should move deep nested structure correctly", () => {
    expect(reparentFolderPath("a/sub/inner/file.txt", "a", "b")).toBe(
      "b/a/sub/inner/file.txt",
    );
  });

  test("should move folder contents to root", () => {
    expect(reparentFolderPath("a/file.txt", "a", "")).toBe("a/file.txt");
  });

  test("should normalize paths before reparenting", () => {
    expect(reparentFolderPath("\\a//sub\\file.txt", "a", "b")).toBe(
      "b/a/sub/file.txt",
    );
  });

  test("should return null when original is not inside dragged folder", () => {
    expect(reparentFolderPath("x/file.txt", "a", "b")).toBeNull();
  });

  test("should not treat similar prefixes as descendants", () => {
    expect(reparentFolderPath("folderAB/file.txt", "folderA", "b")).toBeNull();
  });

  test("should handle moving folder into deep path", () => {
    expect(reparentFolderPath("a/file.txt", "a", "x/y/z")).toBe(
      "x/y/z/a/file.txt",
    );
  });

  test("should collapse duplicate slashes in result", () => {
    expect(reparentFolderPath("a/file.txt", "a", "b//c")).toBe(
      "b/c/a/file.txt",
    );
  });

  test("should return null when original path is empty and not matching", () => {
    expect(reparentFolderPath("", "a", "b")).toBeNull();
  });

  test("should handle moving root folder explicitly", () => {
    expect(reparentFolderPath("", "", "x")).toBeNull();
  });
});

describe("reparentEntityPath", () => {
  test("should move named entity to new folder", () => {
    expect(reparentEntityPath("a/file.txt", "b")).toBe("b/file.txt");
  });

  test("should move named entity to deep folder", () => {
    expect(reparentEntityPath("a/file.txt", "x/y/z")).toBe("x/y/z/file.txt");
  });

  test("should move named entity to root (empty path)", () => {
    expect(reparentEntityPath("a/file.txt", "")).toBe("file.txt");
  });

  test("should normalize original path before extracting basename", () => {
    expect(reparentEntityPath("\\a//sub\\file.txt", "b")).toBe("b/file.txt");
  });

  test("should normalize destination path before joining", () => {
    expect(reparentEntityPath("a/file.txt", "\\x//y\\")).toBe("x/y/file.txt");
  });

  test("should handle unnamed entity (trailing slash) into folder", () => {
    expect(reparentEntityPath("a/", "b")).toBe("b/");
  });

  test("should handle unnamed entity with backslash", () => {
    expect(reparentEntityPath("a\\", "b")).toBe("b/");
  });

  test("should handle unnamed entity moved to deep folder", () => {
    expect(reparentEntityPath("a/", "x/y")).toBe("x/y/");
  });

  test("should handle unnamed entity moved to root", () => {
    expect(reparentEntityPath("a/", "")).toBe("");
  });

  test("should handle already-root unnamed entity", () => {
    expect(reparentEntityPath("", "a/b")).toBe("a/b/");
  });

  test("should return empty string when both original and destination are root-like", () => {
    expect(reparentEntityPath("", "")).toBe("");
  });

  test("should collapse duplicate slashes in result", () => {
    expect(reparentEntityPath("a/file.txt", "b//c")).toBe("b/c/file.txt");
  });
});

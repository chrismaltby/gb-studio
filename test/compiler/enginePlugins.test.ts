import fs from "fs-extra";
import { applyPatch } from "diff";
import { PluginMetadata } from "lib/pluginManager/types";
import { isFilePathWithinFolder } from "lib/helpers/path";
import { pathToPosix } from "shared/lib/helpers/path";
import l10n from "shared/lib/lang/l10n";
import glob from "glob";
import {
  selectAlternateEngine,
  applyPatchToFile,
  isPatchFile,
  collectPatchFiles,
  applyPatches,
  warnOnPluginFileCollisions,
} from "lib/compiler/enginePlugins";
import { dummyPluginMetadata } from "../dummydata";

jest.mock("fs-extra");
jest.mock("diff");
jest.mock("lib/helpers/path");
jest.mock("shared/lib/helpers/path");
jest.mock("shared/lib/lang/l10n");
jest.mock("glob");

const mockedFs = fs as jest.Mocked<typeof fs> & {
  readFile: jest.Mock;
  writeFile: jest.Mock;
};
const mockedApplyPatch = applyPatch as jest.MockedFunction<typeof applyPatch>;
const mockedIsFilePathWithinFolder =
  isFilePathWithinFolder as jest.MockedFunction<typeof isFilePathWithinFolder>;
const mockedPathToPosix = pathToPosix as jest.MockedFunction<
  typeof pathToPosix
>;
const mockedL10n = l10n as jest.MockedFunction<typeof l10n>;
const mockedGlob = glob as jest.Mocked<typeof glob>;

describe("selectAlternateEngine", () => {
  const enginePluginPath = "/project/plugins/my-plugin/engine";
  const releaseVersion = "3.0.0";
  const expectedEngineVersion = "3.0.0";
  const posixRelativePluginPaths = ["plugin-a", "plugin-b"];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("It should return the original path when no engineAltRules exist", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: undefined,
    };

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: enginePluginPath,
    });
  });

  test("It should return the original path when no rules match", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^2.0.0",
          },
          use: "alt-engine-v2",
        },
      ],
    };

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: enginePluginPath,
    });
  });

  test("It should return alternate path when gbsVersion matches", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^3.0.0",
          },
          use: "alt-engine-v3",
        },
      ],
    };

    mockedIsFilePathWithinFolder.mockReturnValue(true);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: "/project/plugins/my-plugin/engineAlt/alt-engine-v3",
      altRuleMatched: "alt-engine-v3",
    });
  });

  test("It should return original path when gbsVersion does not match", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^4.0.0",
          },
          use: "alt-engine-v4",
        },
      ],
    };

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: enginePluginPath,
    });
  });

  test("It should return alternate path when engineVersion matches", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            engineVersion: "3.0.0",
          },
          use: "alt-engine",
        },
      ],
    };

    mockedIsFilePathWithinFolder.mockReturnValue(true);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: "/project/plugins/my-plugin/engineAlt/alt-engine",
      altRuleMatched: "alt-engine",
    });
  });

  test("It should return original path when engineVersion does not match", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            engineVersion: "2.5.0",
          },
          use: "alt-engine",
        },
      ],
    };

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: enginePluginPath,
    });
  });

  test("It should return alternate path when all additionalPlugins are present", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            additionalPlugins: ["plugin-a", "plugin-b"],
          },
          use: "alt-engine-combo",
        },
      ],
    };

    mockedPathToPosix.mockImplementation((path) => path);
    mockedIsFilePathWithinFolder.mockReturnValue(true);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: "/project/plugins/my-plugin/engineAlt/alt-engine-combo",
      altRuleMatched: "alt-engine-combo",
    });
  });

  test("It should return original path when required additionalPlugins are missing", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            additionalPlugins: ["plugin-c", "plugin-d"],
          },
          use: "alt-engine-combo",
        },
      ],
    };

    mockedPathToPosix.mockImplementation((path) => path);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: enginePluginPath,
    });
  });

  test("It should return alternate path when all conditions match", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^3.0.0",
            engineVersion: "3.0.0",
            additionalPlugins: ["plugin-a"],
          },
          use: "alt-engine-all",
        },
      ],
    };

    mockedPathToPosix.mockImplementation((path) => path);
    mockedIsFilePathWithinFolder.mockReturnValue(true);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: "/project/plugins/my-plugin/engineAlt/alt-engine-all",
      altRuleMatched: "alt-engine-all",
    });
  });

  test("It should throw when alternate path is outside allowed directory", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^3.0.0",
          },
          use: "../../../etc/passwd",
        },
      ],
    };

    mockedIsFilePathWithinFolder.mockReturnValue(false);

    expect(() =>
      selectAlternateEngine(
        pluginData,
        enginePluginPath,
        releaseVersion,
        expectedEngineVersion,
        posixRelativePluginPaths,
      ),
    ).toThrow("Engine alt path outside allowed directory");
  });

  test("It should use first matching rule when multiple rules match", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^3.0.0",
          },
          use: "first-match",
        },
        {
          when: {
            engineVersion: "3.0.0",
          },
          use: "second-match",
        },
      ],
    };

    mockedIsFilePathWithinFolder.mockReturnValue(true);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: "/project/plugins/my-plugin/engineAlt/first-match",
      altRuleMatched: "first-match",
    });
  });

  test("It should return original path when matching rule has no use", () => {
    const pluginData = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            gbsVersion: "^3.0.0",
          },
        },
      ],
    } as unknown as PluginMetadata;

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      posixRelativePluginPaths,
    );

    expect(result).toEqual({
      usedPath: enginePluginPath,
    });
  });

  test("It should match additional plugins using normalized paths", () => {
    const pluginData: PluginMetadata = {
      ...dummyPluginMetadata,
      engineAltRules: [
        {
          when: {
            additionalPlugins: ["nested\\plugin-a"],
          },
          use: "alt-engine-normalized",
        },
      ],
    };

    mockedPathToPosix.mockImplementation((path) => path.replace(/\\/g, "/"));
    mockedIsFilePathWithinFolder.mockReturnValue(true);

    const result = selectAlternateEngine(
      pluginData,
      enginePluginPath,
      releaseVersion,
      expectedEngineVersion,
      ["nested/plugin-a"],
    );

    expect(result).toEqual({
      usedPath: "/project/plugins/my-plugin/engineAlt/alt-engine-normalized",
      altRuleMatched: "alt-engine-normalized",
    });
  });
});

describe("applyPatchToFile", () => {
  const outputRoot = "/output";
  const patchInfo = {
    abs: "/project/plugins/my-plugin/engine/src/core.c.patch",
    rel: "src/core.c.patch",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("It should successfully apply a patch to a file", async () => {
    const originalContent = "line 1\nline 2\nline 3\n";
    const patchedContent = "line 1\nline 2 modified\nline 3\n";

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile
      .mockResolvedValueOnce(originalContent)
      .mockResolvedValueOnce("patch content");
    mockedApplyPatch.mockReturnValue(patchedContent);

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({ success: true });
    expect(mockedIsFilePathWithinFolder).toHaveBeenCalledWith(
      "/output/src/core.c",
      outputRoot,
    );
    expect(mockedFs.readFile).toHaveBeenCalledWith(
      "/output/src/core.c",
      "utf8",
    );
    expect(mockedFs.readFile).toHaveBeenCalledWith(patchInfo.abs, "utf8");
    expect(mockedApplyPatch).toHaveBeenCalledWith(
      originalContent,
      "patch content",
    );
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/output/src/core.c",
      patchedContent,
      "utf8",
    );
  });

  test("It should return error when file path is outside output root", async () => {
    mockedIsFilePathWithinFolder.mockReturnValue(false);

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({
      success: false,
      error: new Error("Path outside engine root"),
    });
    expect(mockedFs.readFile).not.toHaveBeenCalled();
  });

  test("It should return error when patch has conflicts", async () => {
    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile
      .mockResolvedValueOnce("original content")
      .mockResolvedValueOnce("patch content");
    mockedApplyPatch.mockReturnValue(false);

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({
      success: false,
      error: new Error("Patch conflict"),
    });
    expect(mockedFs.writeFile).not.toHaveBeenCalled();
  });

  test("It should return error when reading original file fails", async () => {
    const readError = new Error("File not found");

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockRejectedValueOnce(readError);

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({
      success: false,
      error: readError,
    });
  });

  test("It should return error when reading patch file fails", async () => {
    const readError = new Error("Patch file not found");

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile
      .mockResolvedValueOnce("original content")
      .mockRejectedValueOnce(readError);

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({
      success: false,
      error: readError,
    });
  });

  test("It should return error when writing patched file fails", async () => {
    const writeError = new Error("Write failed");

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile
      .mockResolvedValueOnce("original content")
      .mockResolvedValueOnce("patch content");
    mockedApplyPatch.mockReturnValue("patched content");

    mockedFs.writeFile.mockImplementationOnce(async () => {
      throw writeError;
    });

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({
      success: false,
      error: writeError,
    });
  });

  test("It should convert non-Error exceptions to Error objects", async () => {
    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockRejectedValueOnce("string error");

    const result = await applyPatchToFile(patchInfo, outputRoot);

    expect(result).toEqual({
      success: false,
      error: new Error("string error"),
    });
  });
});

describe("applyPatches", () => {
  const outputRoot = "/output";
  const projectRoot = "/project";
  const warnings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("It should apply all patches successfully without warnings", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin1/engine/file1.c.patch",
        rel: "file1.c.patch",
      },
      {
        abs: "/project/plugins/plugin1/engine/file2.c.patch",
        rel: "file2.c.patch",
      },
    ];

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue("content");
    mockedApplyPatch.mockReturnValue("patched content");
    mockedFs.writeFile.mockResolvedValue(undefined);

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(warnings).not.toHaveBeenCalled();
  });

  test("It should call warnings when patch is outside engine root", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin1/engine/file1.c.patch",
        rel: "file1.c.patch",
      },
    ];

    mockedIsFilePathWithinFolder.mockReturnValue(false);
    mockedL10n.mockReturnValue("Warning: modified outside engine root");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(warnings).toHaveBeenCalledWith(
      "Warning: modified outside engine root",
    );
    expect(mockedL10n).toHaveBeenCalledWith(
      "WARNING_PLUGIN_MODIFIED_OUTSIDE_ENGINE_ROOT",
      { filename: "plugins/plugin1/engine/file1.c.patch" },
    );
  });

  test("It should call warnings when patch has conflicts", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin1/engine/file1.c.patch",
        rel: "file1.c.patch",
      },
    ];

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue("content");
    mockedApplyPatch.mockReturnValue(false);
    mockedL10n.mockReturnValue("Warning: conflicting patch");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(warnings).toHaveBeenCalledWith("Warning: conflicting patch");
    expect(mockedL10n).toHaveBeenCalledWith("WARNING_FAILED_TO_APPLY_PATCH", {
      filename: "plugins/plugin1/engine/file1.c.patch",
    });
  });

  test("It should warn with collision message when conflicting file was written by another plugin", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin-a/engine/src/core.c.patch",
        rel: "src/core.c.patch",
        pluginName: "plugin-a",
      },
    ];

    const writtenByPlugin = new Map([["src/core.c", "plugin-b"]]);
    mockedPathToPosix.mockImplementation((path) => path.replace(/\\/g, "/"));
    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue("content");
    mockedApplyPatch.mockReturnValue(false);
    mockedL10n.mockReturnValue("Warning: overwritten by other plugin");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      writtenByPlugin,
      warnings,
    );

    expect(warnings).toHaveBeenCalledWith(
      "Warning: overwritten by other plugin",
    );
    expect(mockedL10n).toHaveBeenCalledWith(
      "WARNING_PLUGIN_PATCH_CONFLICT_OVERWRITTEN",
      {
        filename: "src/core.c",
        pluginName: "plugin-a",
        previousPlugin: "plugin-b",
      },
    );
  });

  test("It should use generic conflict warning when the file is not in writtenByPlugin", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin-a/engine/src/core.c.patch",
        rel: "src/core.c.patch",
        pluginName: "plugin-a",
      },
    ];

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue("content");
    mockedApplyPatch.mockReturnValue(false);
    mockedL10n.mockReturnValue("Warning: conflicting patch");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(mockedL10n).toHaveBeenCalledWith(
      "WARNING_FAILED_TO_APPLY_PATCH",
      expect.any(Object),
    );
    expect(mockedL10n).not.toHaveBeenCalledWith(
      "WARNING_PLUGIN_PATCH_CONFLICT_OVERWRITTEN",
      expect.any(Object),
    );
  });

  test("It should use generic conflict warning when the same plugin wrote the file", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin-a/engine/src/core.c.patch",
        rel: "src/core.c.patch",
        pluginName: "plugin-a",
      },
    ];

    // plugin-a both wrote and is trying to patch the same file (a plugin bug)
    const writtenByPlugin = new Map([["src/core.c", "plugin-a"]]);
    mockedPathToPosix.mockImplementation((path) => path.replace(/\\/g, "/"));
    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue("content");
    mockedApplyPatch.mockReturnValue(false);
    mockedL10n.mockReturnValue("Warning: conflicting patch");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      writtenByPlugin,
      warnings,
    );

    expect(mockedL10n).toHaveBeenCalledWith(
      "WARNING_FAILED_TO_APPLY_PATCH",
      expect.any(Object),
    );
    expect(mockedL10n).not.toHaveBeenCalledWith(
      "WARNING_PLUGIN_PATCH_CONFLICT_OVERWRITTEN",
      expect.any(Object),
    );
  });

  test("It should use generic conflict warning when conflicting file is not in writtenByPlugin", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin-a/engine/src/core.c.patch",
        rel: "src/core.c.patch",
        pluginName: "plugin-a",
      },
    ];

    const writtenByPlugin = new Map<string, string>(); // empty — no plugin wrote the file
    mockedPathToPosix.mockImplementation((path) => path.replace(/\\/g, "/"));
    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockResolvedValue("content");
    mockedApplyPatch.mockReturnValue(false);
    mockedL10n.mockReturnValue("Warning: conflicting patch");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      writtenByPlugin,
      warnings,
    );

    expect(mockedL10n).toHaveBeenCalledWith(
      "WARNING_FAILED_TO_APPLY_PATCH",
      expect.any(Object),
    );
    expect(mockedL10n).not.toHaveBeenCalledWith(
      "WARNING_PLUGIN_PATCH_CONFLICT_OVERWRITTEN",
      expect.any(Object),
    );
  });

  test("It should call warnings with error message when patch application fails", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin1/engine/file1.c.patch",
        rel: "file1.c.patch",
      },
    ];

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockRejectedValueOnce(new Error("Read failed"));
    mockedL10n.mockReturnValue("Warning: failed to apply patch");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(warnings).toHaveBeenCalledWith(
      "Warning: failed to apply patch (Read failed)",
    );
    expect(mockedL10n).toHaveBeenCalledWith("WARNING_FAILED_TO_APPLY_PATCH", {
      filename: "plugins/plugin1/engine/file1.c.patch",
    });
  });

  test("It should handle unknown error message gracefully", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin1/engine/file1.c.patch",
        rel: "file1.c.patch",
      },
    ];

    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.readFile.mockRejectedValueOnce(new Error());
    mockedL10n.mockReturnValue("Warning: failed to apply patch");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(warnings).toHaveBeenCalledWith(
      "Warning: failed to apply patch (Unknown error)",
    );
  });

  test("It should process multiple patches with mixed results", async () => {
    const patchPaths = [
      {
        abs: "/project/plugins/plugin1/engine/file1.c.patch",
        rel: "file1.c.patch",
      },
      {
        abs: "/project/plugins/plugin1/engine/file2.c.patch",
        rel: "file2.c.patch",
      },
      {
        abs: "/project/plugins/plugin1/engine/file3.c.patch",
        rel: "file3.c.patch",
      },
    ];

    mockedIsFilePathWithinFolder
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockedFs.readFile
      .mockResolvedValueOnce("content")
      .mockResolvedValueOnce("patch")
      .mockResolvedValueOnce("content")
      .mockResolvedValueOnce("patch");

    mockedApplyPatch.mockReturnValueOnce("patched").mockReturnValueOnce(false);

    mockedFs.writeFile.mockResolvedValue(undefined);
    mockedL10n
      .mockReturnValueOnce("Warning: outside root")
      .mockReturnValueOnce("Warning: conflict");

    await applyPatches(
      patchPaths,
      outputRoot,
      projectRoot,
      new Map(),
      warnings,
    );

    expect(warnings).toHaveBeenCalledTimes(2);
  });

  test("It should handle empty patch list", async () => {
    await applyPatches([], outputRoot, projectRoot, new Map(), warnings);

    expect(warnings).not.toHaveBeenCalled();
  });
});

describe("isPatchFile", () => {
  test("It should return true for .patch files", () => {
    expect(isPatchFile("file.c.patch")).toBe(true);
    expect(isPatchFile("src/core.c.patch")).toBe(true);
    expect(isPatchFile("/absolute/path/to/file.h.patch")).toBe(true);
  });

  test("It should return false for non-patch files", () => {
    expect(isPatchFile("file.c")).toBe(false);
    expect(isPatchFile("file.h")).toBe(false);
    expect(isPatchFile("file.patch.c")).toBe(false);
    expect(isPatchFile("patch")).toBe(false);
  });

  test("It should handle various file extensions", () => {
    expect(isPatchFile("file.s.patch")).toBe(true);
    expect(isPatchFile("Makefile.patch")).toBe(true);
    expect(isPatchFile(".patch")).toBe(true);
    expect(isPatchFile("file.c.PATCH")).toBe(false); // case sensitive
  });

  test("It should handle empty string", () => {
    expect(isPatchFile("")).toBe(false);
  });
});

describe("collectPatchFiles", () => {
  const usedEnginePluginPath = "/project/plugins/my-plugin/engine";
  const unusedFiles = ["src/unused.c", "include/unused.h"];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPathToPosix.mockImplementation((path) => path);
  });

  test("It should collect patch files from directory", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, [
          "/project/plugins/my-plugin/engine/src/core.c.patch",
          "/project/plugins/my-plugin/engine/src/utils.c.patch",
        ]);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, []);

    expect(mockedGlob).toHaveBeenCalledWith(
      "**/*.patch",
      {
        cwd: usedEnginePluginPath,
        absolute: true,
      },
      expect.any(Function),
    );
    expect(patches).toHaveLength(2);
    expect(patches[0]).toEqual({
      abs: "/project/plugins/my-plugin/engine/src/core.c.patch",
      rel: "src/core.c.patch",
    });
    expect(patches[1]).toEqual({
      abs: "/project/plugins/my-plugin/engine/src/utils.c.patch",
      rel: "src/utils.c.patch",
    });
  });

  test("It should exclude patches targeting unused files", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, [
          "/project/plugins/my-plugin/engine/src/used.c.patch",
          "/project/plugins/my-plugin/engine/src/unused.c.patch",
          "/project/plugins/my-plugin/engine/include/unused.h.patch",
        ]);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, unusedFiles);

    expect(patches).toHaveLength(1);
    expect(patches[0].rel).toBe("src/used.c.patch");
  });

  test("It should return empty array when no patches found", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, []);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, unusedFiles);

    expect(patches).toHaveLength(0);
  });

  test("It should handle nested patch files", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, [
          "/project/plugins/my-plugin/engine/src/deep/nested/file.h.patch",
          "/project/plugins/my-plugin/engine/src/subdir/nested.c.patch",
        ]);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, []);

    expect(patches).toHaveLength(2);
    expect(patches[0]).toEqual({
      abs: "/project/plugins/my-plugin/engine/src/deep/nested/file.h.patch",
      rel: "src/deep/nested/file.h.patch",
    });
    expect(patches[1]).toEqual({
      abs: "/project/plugins/my-plugin/engine/src/subdir/nested.c.patch",
      rel: "src/subdir/nested.c.patch",
    });
  });

  test("It should preserve absolute paths in collected patches", async () => {
    const absolutePath = "/project/plugins/my-plugin/engine/src/core.c.patch";
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, [absolutePath]);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, []);

    expect(patches[0].abs).toBe(absolutePath);
  });

  test("It should use pathToPosix for comparing with unused files", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, [
          "/project/plugins/my-plugin/engine/src\\windows\\path.c.patch",
        ]);
      },
    );
    mockedPathToPosix.mockReturnValue("src/windows/path.c");

    const patches = await collectPatchFiles(usedEnginePluginPath, [
      "src/windows/path.c",
    ]);

    expect(mockedPathToPosix).toHaveBeenCalled();
    expect(patches).toHaveLength(0);
  });

  test("It should handle empty unusedFiles list", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, ["/project/plugins/my-plugin/engine/src/file.c.patch"]);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, []);

    expect(patches).toHaveLength(1);
  });

  test("It should preserve the order returned by glob", async () => {
    // glob sorts by default; collectPatchFiles relies on that and preserves order
    const sortedPaths = [
      "/project/plugins/my-plugin/engine/src/a.c.patch",
      "/project/plugins/my-plugin/engine/src/m.c.patch",
      "/project/plugins/my-plugin/engine/src/z.c.patch",
    ];
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, sortedPaths);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, []);

    expect(patches).toHaveLength(3);
    expect(patches[0].rel).toBe("src/a.c.patch");
    expect(patches[1].rel).toBe("src/m.c.patch");
    expect(patches[2].rel).toBe("src/z.c.patch");
  });

  test("It should only exclude patches that exactly match unused files", async () => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, [
          "/project/plugins/my-plugin/engine/src/unused.c.patch",
          "/project/plugins/my-plugin/engine/src/unused_extra.c.patch",
        ]);
      },
    );

    const patches = await collectPatchFiles(usedEnginePluginPath, [
      "src/unused.c",
    ]);

    expect(patches).toHaveLength(1);
    expect(patches[0].rel).toBe("src/unused_extra.c.patch");
  });
});

describe("applyPatchToFile (integration)", () => {
  // Use the real applyPatch from 'diff' to confirm patch logic works correctly
  const { applyPatch: realApplyPatch } =
    jest.requireActual<typeof import("diff")>("diff");

  const patchInfo = {
    abs: "/project/plugins/engine/src/core.c.patch",
    rel: "src/core.c.patch",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApplyPatch.mockImplementation(realApplyPatch);
    mockedIsFilePathWithinFolder.mockReturnValue(true);
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  test("It should correctly apply a patch that modifies a line", async () => {
    const originalContent = "line 1\nline 2\nline 3\n";
    const patchContent = [
      "--- a/src/core.c",
      "+++ b/src/core.c",
      "@@ -1,3 +1,3 @@",
      " line 1",
      "-line 2",
      "+line 2 modified",
      " line 3",
      "",
    ].join("\n");
    const expectedPatched = "line 1\nline 2 modified\nline 3\n";

    mockedFs.readFile
      .mockResolvedValueOnce(originalContent)
      .mockResolvedValueOnce(patchContent);

    const result = await applyPatchToFile(patchInfo, "/output");

    expect(result).toEqual({ success: true });
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/output/src/core.c",
      expectedPatched,
      "utf8",
    );
  });

  test("It should correctly apply a patch that adds a line", async () => {
    const originalContent = "line 1\nline 3\n";
    const patchContent = [
      "--- a/src/core.c",
      "+++ b/src/core.c",
      "@@ -1,2 +1,3 @@",
      " line 1",
      "+line 2",
      " line 3",
      "",
    ].join("\n");
    const expectedPatched = "line 1\nline 2\nline 3\n";

    mockedFs.readFile
      .mockResolvedValueOnce(originalContent)
      .mockResolvedValueOnce(patchContent);

    const result = await applyPatchToFile(patchInfo, "/output");

    expect(result).toEqual({ success: true });
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/output/src/core.c",
      expectedPatched,
      "utf8",
    );
  });

  test("It should correctly apply a patch that removes a line", async () => {
    const originalContent = "line 1\nline 2\nline 3\n";
    const patchContent = [
      "--- a/src/core.c",
      "+++ b/src/core.c",
      "@@ -1,3 +1,2 @@",
      " line 1",
      "-line 2",
      " line 3",
      "",
    ].join("\n");
    const expectedPatched = "line 1\nline 3\n";

    mockedFs.readFile
      .mockResolvedValueOnce(originalContent)
      .mockResolvedValueOnce(patchContent);

    const result = await applyPatchToFile(patchInfo, "/output");

    expect(result).toEqual({ success: true });
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/output/src/core.c",
      expectedPatched,
      "utf8",
    );
  });

  test("It should return a conflict error when the patch does not match the file content", async () => {
    const originalContent = "line 1\nline 2\nline 3\n";
    // Patch expects different context lines that don't exist in the file
    const conflictingPatch = [
      "--- a/src/core.c",
      "+++ b/src/core.c",
      "@@ -1,3 +1,3 @@",
      " completely",
      "-different",
      "+changed",
      " content",
      "",
    ].join("\n");

    mockedFs.readFile
      .mockResolvedValueOnce(originalContent)
      .mockResolvedValueOnce(conflictingPatch);

    const result = await applyPatchToFile(patchInfo, "/output");

    expect(result).toEqual({
      success: false,
      error: new Error("Patch conflict"),
    });
    expect(mockedFs.writeFile).not.toHaveBeenCalled();
  });

  test("It should apply a patch with multiple hunks correctly", async () => {
    const originalContent =
      "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\n";
    const patchContent = [
      "--- a/src/core.c",
      "+++ b/src/core.c",
      "@@ -1,3 +1,3 @@",
      " line 1",
      "-line 2",
      "+line 2 modified",
      " line 3",
      "@@ -5,3 +5,3 @@",
      " line 5",
      "-line 6",
      "+line 6 modified",
      " line 7",
      "",
    ].join("\n");
    const expectedPatched =
      "line 1\nline 2 modified\nline 3\nline 4\nline 5\nline 6 modified\nline 7\n";

    mockedFs.readFile
      .mockResolvedValueOnce(originalContent)
      .mockResolvedValueOnce(patchContent);

    const result = await applyPatchToFile(patchInfo, "/output");

    expect(result).toEqual({ success: true });
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/output/src/core.c",
      expectedPatched,
      "utf8",
    );
  });
});

describe("warnOnPluginFileCollisions", () => {
  const usedEnginePluginPath = "/project/plugins/my-plugin/engine";
  const warnings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPathToPosix.mockImplementation((path) => path);
    mockedL10n.mockImplementation(
      (key, vars) => `${key}:${JSON.stringify(vars)}`,
    );
  });

  const mockGlobFiles = (files: string[]) => {
    (mockedGlob as unknown as jest.Mock).mockImplementation(
      (pattern, options, callback) => {
        callback(null, files);
      },
    );
  };

  test("It should not warn when no files have been written yet", async () => {
    mockGlobFiles(["src/core.c", "src/utils.c"]);
    const writtenByPlugin = new Map<string, string>();

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-a",
      writtenByPlugin,
      warnings,
    );

    expect(warnings).not.toHaveBeenCalled();
  });

  test("It should not warn when plugins write different files", async () => {
    mockGlobFiles(["src/plugin_b.c"]);
    const writtenByPlugin = new Map([["src/core.c", "plugin-a"]]);

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-b",
      writtenByPlugin,
      warnings,
    );

    expect(warnings).not.toHaveBeenCalled();
  });

  test("It should warn when a second plugin overwrites a file from a first", async () => {
    mockGlobFiles(["src/core.c"]);
    const writtenByPlugin = new Map([["src/core.c", "plugin-a"]]);

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-b",
      writtenByPlugin,
      warnings,
    );

    expect(warnings).toHaveBeenCalledTimes(1);
    expect(mockedL10n).toHaveBeenCalledWith("WARNING_PLUGIN_OVERWROTE_FILE", {
      filename: "src/core.c",
      pluginName: "plugin-b",
      previousPlugin: "plugin-a",
    });
  });

  test("It should warn for each conflicting file", async () => {
    mockGlobFiles(["src/core.c", "include/header.h"]);
    const writtenByPlugin = new Map([
      ["src/core.c", "plugin-a"],
      ["include/header.h", "plugin-a"],
    ]);

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-b",
      writtenByPlugin,
      warnings,
    );

    expect(warnings).toHaveBeenCalledTimes(2);
  });

  test("It should skip patch files when checking for collisions", async () => {
    mockGlobFiles(["src/core.c.patch", "src/utils.c.patch"]);
    const writtenByPlugin = new Map([
      ["src/core.c.patch", "plugin-a"],
      ["src/utils.c.patch", "plugin-a"],
    ]);

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-b",
      writtenByPlugin,
      warnings,
    );

    expect(warnings).not.toHaveBeenCalled();
  });

  test("It should update writtenByPlugin with the current plugin's files", async () => {
    mockGlobFiles(["src/core.c", "src/utils.c"]);
    const writtenByPlugin = new Map<string, string>();

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-a",
      writtenByPlugin,
      warnings,
    );

    expect(writtenByPlugin.get("src/core.c")).toBe("plugin-a");
    expect(writtenByPlugin.get("src/utils.c")).toBe("plugin-a");
  });

  test("It should update writtenByPlugin to the latest plugin on collision", async () => {
    mockGlobFiles(["src/core.c"]);
    const writtenByPlugin = new Map([["src/core.c", "plugin-a"]]);

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-b",
      writtenByPlugin,
      warnings,
    );

    // plugin-b is now tracked as the owner after overwriting
    expect(writtenByPlugin.get("src/core.c")).toBe("plugin-b");
  });

  test("It should not add patch files to writtenByPlugin", async () => {
    mockGlobFiles(["src/core.c.patch"]);
    const writtenByPlugin = new Map<string, string>();

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-a",
      writtenByPlugin,
      warnings,
    );

    expect(writtenByPlugin.size).toBe(0);
  });

  test("It should use pathToPosix to normalize file paths in the map", async () => {
    mockedPathToPosix.mockReturnValue("src/normalized/path.c");
    mockGlobFiles(["src\\windows\\path.c"]);
    const writtenByPlugin = new Map<string, string>();

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      "plugin-a",
      writtenByPlugin,
      warnings,
    );

    expect(writtenByPlugin.has("src/normalized/path.c")).toBe(true);
  });
});

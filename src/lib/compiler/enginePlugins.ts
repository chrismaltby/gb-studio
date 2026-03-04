import fs, { readJSON } from "fs-extra";
import Path from "path";
import l10n from "shared/lib/lang/l10n";
import copy from "lib/helpers/fsCopy";
import { isFilePathWithinFolder } from "lib/helpers/path";
import { applyPatch } from "diff";
import { PluginMetadata } from "lib/pluginManager/types";
import { satisfies } from "semver";
import { pathToPosix } from "shared/lib/helpers/path";
import glob from "glob";
import { promisify } from "util";
import { Value } from "@sinclair/typebox/value";
import { readEngineVersion } from "lib/project/engine";
import { isKnownEngineVersion } from "lib/project/ejectEngineChangelog";

const globAsync = promisify(glob);

declare const RELEASE_VERSION: string;

type ApplyEnginePluginOptions = {
  outputRoot: string;
  projectRoot: string;
  expectedEngineVersion: string;
  unusedFiles: string[];
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

/**
 * Scans a plugin's engine files and warns if any would overwrite files already
 * written by a previously processed plugin. Updates writtenByPlugin in-place.
 */
export const warnOnPluginFileCollisions = async (
  usedEnginePluginPath: string,
  pluginName: string,
  writtenByPlugin: Map<string, string>,
  warnings: (msg: string) => void,
): Promise<void> => {
  const pluginFiles = await globAsync("**/*", {
    cwd: usedEnginePluginPath,
    nodir: true,
  });

  for (const relFile of pluginFiles) {
    if (isPatchFile(relFile) || isEngineManifestFile(relFile)) {
      continue;
    }
    const posixRel = pathToPosix(relFile);
    const previousPlugin = writtenByPlugin.get(posixRel);
    if (previousPlugin !== undefined) {
      warnings(
        l10n("WARNING_PLUGIN_OVERWROTE_FILE", {
          filename: posixRel,
          pluginName,
          previousPlugin,
        }),
      );
    }
    writtenByPlugin.set(posixRel, pluginName);
  }
};

export const applyEnginePlugins = async ({
  progress,
  warnings,
  expectedEngineVersion,
  unusedFiles,
  outputRoot,
  projectRoot,
}: ApplyEnginePluginOptions) => {
  const pluginsPath = Path.join(projectRoot, "plugins");

  progress(
    l10n("COMPILER_LOOKING_FOR_ENGINE_PLUGINS", { path: "plugins/*/engine" }),
  );

  const pluginPaths = await globAsync(`${pluginsPath}/**/plugin.json`);
  const posixRelativePluginPaths = pluginPaths.map((p) =>
    pathToPosix(Path.relative(pluginsPath, Path.dirname(p))),
  );
  const releaseVersion = RELEASE_VERSION.replace(/-rc.*/, "");
  const enginePlugins = await globAsync(`${pluginsPath}/**/engine`);

  // Track which relative paths have already been written and by which plugin
  const writtenByPlugin = new Map<string, string>();

  const allPatches: PatchInfo[] = [];

  for (const enginePluginPath of enginePlugins) {
    const enginePluginDir = Path.dirname(enginePluginPath);
    const pluginName = Path.relative(pluginsPath, enginePluginDir);

    progress(
      l10n("COMPILER_USING_ENGINE_PLUGIN", {
        path: pluginName,
      }),
    );
    const pluginJsonPath = Path.join(
      Path.dirname(enginePluginPath),
      "plugin.json",
    );

    let usedEnginePluginPath = enginePluginPath;

    try {
      const pluginJson = await readJSON(pluginJsonPath);
      const pluginData = Value.Cast(PluginMetadata, pluginJson);

      const altEngineResult = selectAlternateEngine(
        pluginData,
        enginePluginPath,
        releaseVersion,
        expectedEngineVersion,
        posixRelativePluginPaths,
      );

      usedEnginePluginPath = altEngineResult.usedPath;

      if (altEngineResult.altRuleMatched) {
        progress(
          `- ${l10n("COMPILER_USING_ENGINE_PLUGIN_VERSION", { path: altEngineResult.altRuleMatched })}`,
        );
      }
    } catch (e) {
      if (
        e instanceof Error &&
        e.message === "Engine alt path outside allowed directory"
      ) {
        warnings(
          l10n("WARNING_PLUGIN_MODIFIED_OUTSIDE_ENGINE_ROOT", {
            filename: Path.relative(projectRoot, enginePluginPath),
          }),
        );
      }
      // Invalid or missing plugin.json, ignore
    }

    try {
      const pluginEngineMetaPath = `${usedEnginePluginPath}/engine.json`;
      const pluginEngineVersion = await readEngineVersion(pluginEngineMetaPath);
      if (!pluginEngineVersion || !isKnownEngineVersion(pluginEngineVersion)) {
        throw new Error("Missing plugin engine version");
      }
      if (pluginEngineVersion !== expectedEngineVersion) {
        warnings(
          `${l10n("WARNING_ENGINE_PLUGIN_OUT_OF_DATE", {
            pluginName,
            pluginEngineVersion,
            expectedEngineVersion,
          })}`,
        );
      }
    } catch (e) {
      warnings(
        `${l10n("WARNING_ENGINE_PLUGIN_MISSING_MANIFEST", {
          pluginName,
          expectedEngineVersion,
        })}`,
      );
    }

    const patchPaths = await collectPatchFiles(
      usedEnginePluginPath,
      unusedFiles,
    );

    allPatches.push(...patchPaths.map((p) => ({ ...p, pluginName })));

    await warnOnPluginFileCollisions(
      usedEnginePluginPath,
      pluginName,
      writtenByPlugin,
      warnings,
    );

    await copy(usedEnginePluginPath, outputRoot, {
      ignore: isPatchFile,
    });
  }

  await applyPatches(
    allPatches,
    outputRoot,
    projectRoot,
    writtenByPlugin,
    warnings,
  );
};

/**
 * Determines which alternate engine path to use based on plugin rules
 */
export const selectAlternateEngine = (
  pluginData: PluginMetadata,
  enginePluginPath: string,
  releaseVersion: string,
  expectedEngineVersion: string,
  posixRelativePluginPaths: string[],
): {
  usedPath: string;
  altRuleMatched?: string;
} => {
  if (!pluginData.engineAltRules) {
    return { usedPath: enginePluginPath };
  }

  const altRule = pluginData.engineAltRules.find((rule) => {
    if (rule.when.gbsVersion) {
      if (!satisfies(releaseVersion, rule.when.gbsVersion)) {
        return false;
      }
    }
    if (rule.when.engineVersion) {
      if (rule.when.engineVersion !== expectedEngineVersion) {
        return false;
      }
    }
    if (rule.when.additionalPlugins) {
      const hasRequiredPlugins = rule.when.additionalPlugins.every(
        (requiredPlugin) =>
          posixRelativePluginPaths.some(
            (p) => pathToPosix(requiredPlugin) === p,
          ),
      );
      if (!hasRequiredPlugins) {
        return false;
      }
    }
    return true;
  });

  if (altRule && altRule.use) {
    const altEngineDir = Path.join(Path.dirname(enginePluginPath), "engineAlt");
    const altEnginePath = Path.join(altEngineDir, altRule.use);
    if (isFilePathWithinFolder(altEnginePath, altEngineDir)) {
      return {
        usedPath: altEnginePath,
        altRuleMatched: altRule.use,
      };
    }
    throw new Error("Engine alt path outside allowed directory");
  }

  return { usedPath: enginePluginPath };
};

type PatchInfo = { abs: string; rel: string; pluginName?: string };

/**
 * Applies a single patch file to a target file
 */
export const applyPatchToFile = async (
  patchInfo: PatchInfo,
  outputRoot: string,
): Promise<{ success: boolean; error?: Error }> => {
  try {
    const filePath = Path.join(
      outputRoot,
      patchInfo.rel.replace(/\.patch$/, ""),
    );
    if (!isFilePathWithinFolder(filePath, outputRoot)) {
      return {
        success: false,
        error: new Error("Path outside engine root"),
      };
    }
    const inFile = await fs.readFile(filePath, "utf8");
    const patchFile = await fs.readFile(patchInfo.abs, "utf8");
    const out = applyPatch(inFile, patchFile);
    if (out !== false) {
      await fs.writeFile(filePath, out, "utf8");
      return { success: true };
    } else {
      return {
        success: false,
        error: new Error("Patch conflict"),
      };
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
};

/**
 * Utility to check if a file is a patch file
 */
export const isPatchFile = (src: string): boolean => {
  return src.endsWith(".patch");
};

/**
 * Utility to check if a file is an engine.json file
 */
export const isEngineManifestFile = (src: string): boolean => {
  return src.endsWith("engine.json");
};

/**
 * Collects patch files for an engine plugin, excluding those that target unused files
 */
export const collectPatchFiles = async (
  usedEnginePluginPath: string,
  unusedFiles: string[],
): Promise<PatchInfo[]> => {
  const patchFiles = await globAsync("**/*.patch", {
    cwd: usedEnginePluginPath,
    absolute: true,
  });

  const unusedSet = new Set(unusedFiles);

  const patches: PatchInfo[] = [];

  for (const absPath of patchFiles) {
    const relPath = Path.relative(usedEnginePluginPath, absPath);
    const targetFile = pathToPosix(relPath.replace(/\.patch$/, ""));
    if (unusedSet.has(targetFile)) {
      continue;
    }

    patches.push({
      abs: absPath,
      rel: relPath,
    });
  }

  return patches;
};

/**
 * Applies multiple patches and returns results for each.
 * When pluginName and writtenByPlugin are provided, patch conflicts caused by
 * another plugin having overwritten the target file produce a richer warning.
 */
export const applyPatches = async (
  patchPaths: PatchInfo[],
  outputRoot: string,
  projectRoot: string,
  writtenByPlugin: Map<string, string>,
  warnings: (msg: string) => void,
): Promise<void> => {
  for (const patchPath of patchPaths) {
    const result = await applyPatchToFile(patchPath, outputRoot);
    if (!result.success) {
      const relPath = Path.relative(projectRoot, patchPath.abs);
      if (result.error?.message === "Path outside engine root") {
        warnings(
          l10n("WARNING_PLUGIN_MODIFIED_OUTSIDE_ENGINE_ROOT", {
            filename: relPath,
          }),
        );
      } else if (result.error?.message === "Patch conflict") {
        const posixRel = pathToPosix(patchPath.rel.replace(/\.patch$/, ""));
        const { pluginName } = patchPath;
        const previousPlugin = writtenByPlugin.get(posixRel);
        if (previousPlugin !== undefined && previousPlugin !== pluginName) {
          warnings(
            l10n("WARNING_PLUGIN_PATCH_CONFLICT_OVERWRITTEN", {
              filename: posixRel,
              pluginName: pluginName,
              previousPlugin,
            }),
          );
        } else {
          warnings(
            l10n("WARNING_FAILED_TO_APPLY_PATCH", {
              filename: relPath,
            }),
          );
        }
      } else {
        warnings(
          l10n("WARNING_FAILED_TO_APPLY_PATCH", {
            filename: relPath,
          }) + ` (${result.error?.message || "Unknown error"})`,
        );
      }
    }
  }
};

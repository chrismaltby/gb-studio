import fs from "fs-extra";
import Path from "path";
import l10n from "shared/lib/lang/l10n";
import type { CartType } from "shared/lib/resources/types";
import type { PluginFileAttribution } from "lib/compiler/enginePlugins";
import {
  analyzePluginUsage,
  formatPluginUsageReport,
} from "lib/compiler/pluginUsage";

type ReportPluginUsageOptions = {
  buildRoot: string;
  attribution: PluginFileAttribution;
  cartType: CartType;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

export const PLUGIN_USAGE_FILENAME = "plugin_usage.txt";

/**
 * Writes a breakdown of how much bank 0, WRAM and banked ROM each engine
 * plugin is using to build/rom/plugin_usage.txt. The breakdown is too long
 * for the build log, so only the file location is logged.
 *
 * Reporting must never fail a build that otherwise succeeded, so any error
 * here is downgraded to a warning.
 */
export const reportPluginUsage = async ({
  buildRoot,
  attribution,
  cartType,
  progress,
  warnings,
}: ReportPluginUsageOptions): Promise<void> => {
  try {
    const report = await analyzePluginUsage({
      buildRoot,
      attribution,
      cartType,
    });
    const lines = formatPluginUsageReport(report);

    const outputPath = Path.join(
      buildRoot,
      "build",
      "rom",
      PLUGIN_USAGE_FILENAME,
    );
    await fs.ensureDir(Path.dirname(outputPath));
    await fs.writeFile(outputPath, `${lines.join("\n")}\n`);

    progress(
      l10n("COMPILER_PLUGIN_USAGE_WRITTEN", {
        filename: `build/rom/${PLUGIN_USAGE_FILENAME}`,
      }),
    );
  } catch (e) {
    warnings(
      l10n("WARNING_PLUGIN_USAGE_FAILED", {
        error: e instanceof Error ? e.message : String(e),
      }),
    );
  }
};

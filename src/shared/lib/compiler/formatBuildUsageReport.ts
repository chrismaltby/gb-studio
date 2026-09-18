import type {
  BuildUsageOverview,
  BuildUsagePlugin,
  MemoryRegionUsage,
  UsageData,
} from "lib/compiler/buildUsage";
import type { RegionUsage } from "lib/compiler/buildArtifactParsers";
import l10n from "shared/lib/lang/l10n";
import { bytesToHumanReadable } from "shared/lib/helpers/formatBytes";
import type { ProjectResources } from "shared/lib/resources/types";
import {
  buildUsageAssetSourceTypeLabel,
  buildUsageItemEntitiesFromProject,
  buildUsageItems,
  buildUsageItemTypeLabel,
  type BuildUsageItem,
} from "./buildUsageItems";

const formatTable = (headers: string[], rows: string[][]) => {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? "").length)),
  );
  const formatRow = (row: string[]) =>
    row
      .map((cell, column) =>
        column === row.length - 1 ? cell : cell.padEnd(widths[column], " "),
      )
      .join("  ")
      .trimEnd();
  return [
    formatRow(headers),
    formatRow(widths.map((width) => "-".repeat(width))),
    ...rows.map(formatRow),
  ].join("\n");
};

const formatRegion = (usage: RegionUsage) => [
  bytesToHumanReadable(usage.bank0),
  bytesToHumanReadable(usage.wram),
  bytesToHumanReadable(usage.bankedRom),
];

const formatMemory = (label: string, usage: MemoryRegionUsage) => {
  const difference = usage.used - usage.size;
  const detail =
    difference > 0
      ? l10n("FIELD_MEMORY_USAGE_OVER", {
          overflow: bytesToHumanReadable(difference),
        })
      : l10n("FIELD_MEMORY_USAGE_FREE", {
          freeSpace: bytesToHumanReadable(-difference),
        });
  return `${label}: ${bytesToHumanReadable(usage.used)} / ${bytesToHumanReadable(usage.size)} (${detail})`;
};

const formatSummary = (usage: Extract<UsageData, { status: "complete" }>) => {
  const { rom } = usage.memory;
  const maxPercent = rom.maxSize ? (rom.used * 100) / rom.maxSize : 0;
  return [
    `${l10n("FIELD_ROM_USED")}: ${bytesToHumanReadable(rom.used)} / ${bytesToHumanReadable(rom.size)}`,
    rom.nextSize
      ? `${l10n("FIELD_ROM_NEXT_SIZE")}: ${bytesToHumanReadable(rom.nextSize)}`
      : `${l10n("FIELD_ROM_MAX_SIZE")}: ${bytesToHumanReadable(rom.maxSize)}`,
    `${l10n("FIELD_ROM_MAX_CAPACITY")}: ${maxPercent.toFixed(1)}% (${bytesToHumanReadable(rom.used)} / ${bytesToHumanReadable(rom.maxSize)})`,
    formatMemory(l10n("FIELD_BANK_0"), usage.memory.bank0),
    formatMemory("WRAM", usage.memory.wram),
  ].join("\n");
};

const formatOverview = (overview: BuildUsageOverview) =>
  [
    `## ${l10n("FIELD_MEMORY_USAGE")}`,
    "",
    formatTable(
      [
        l10n("FIELD_SOURCE"),
        l10n("FIELD_BANK_0"),
        "WRAM",
        l10n("FIELD_BANKED_ROM"),
      ],
      [
        [l10n("FIELD_BASE_ENGINE"), ...formatRegion(overview.engine)],
        [l10n("FIELD_MUSIC_DRIVER"), ...formatRegion(overview.musicDriver)],
        [l10n("FIELD_GBDK_RUNTIME"), ...formatRegion(overview.gbdkRuntime)],
        [l10n("FIELD_PROJECT_DATA"), ...formatRegion(overview.project)],
        [l10n("FIELD_PLUGINS"), ...formatRegion(overview.plugins)],
        [l10n("FIELD_RESERVED_MEMORY"), ...formatRegion(overview.reserved)],
        [l10n("FIELD_TOTAL"), ...formatRegion(overview.total)],
        [
          `${l10n("FIELD_MAXIMUM")} (${overview.cartType.toUpperCase()})`,
          ...formatRegion(overview.maximum),
        ],
        [l10n("FIELD_REMAINING"), ...formatRegion(overview.remaining)],
      ],
    ),
  ].join("\n");

const formatPlugins = (plugins: BuildUsagePlugin[]) =>
  !plugins.length
    ? ""
    : [
        `## ${l10n("FIELD_PLUGIN_MEMORY_USAGE")}`,
        "",
        formatTable(
          [
            l10n("FIELD_PLUGIN"),
            l10n("FIELD_BANK_0"),
            "WRAM",
            l10n("FIELD_BANKED_ROM"),
          ],
          plugins.flatMap((plugin) => [
            [plugin.pluginName, ...formatRegion(plugin.usage)],
            ...plugin.files.map((file) => [
              `  ${file.sourceFile}${file.replacesDefault ? ` (${l10n("FIELD_REPLACES_DEFAULT_ENGINE_FILE")})` : ""}`,
              ...formatRegion(file.usage),
            ]),
          ]),
        ),
      ].join("\n");

const itemName = (item: BuildUsageItem) =>
  item.type === "script"
    ? item.sourceLabels.join(", ")
    : (() => {
        const label = buildUsageAssetSourceTypeLabel(item.sourceType);
        return label ? `${item.name} (${label})` : item.name;
      })();

const formatItems = (
  usage: Exclude<UsageData, { status: "unavailable" }>,
  project: ProjectResources,
) => {
  const items = buildUsageItems({
    scripts: usage.scripts,
    sources: usage.sources,
    entities: buildUsageItemEntitiesFromProject(project),
  }).sort((left, right) => right.size - left.size);
  return !items.length
    ? ""
    : [
        `## ${l10n("FIELD_PROJECT_DATA")}`,
        "",
        formatTable(
          [
            l10n("FIELD_NAME"),
            l10n("FIELD_FILENAME"),
            l10n("FIELD_TYPE"),
            l10n("FIELD_SIZE"),
          ],
          items.map((item) => [
            itemName(item),
            item.sourceFile,
            buildUsageItemTypeLabel(item.type),
            bytesToHumanReadable(item.size),
          ]),
        ),
      ].join("\n");
};

export const formatBuildUsageReport = (
  usage: UsageData,
  project: ProjectResources,
) => {
  const sections = [`# ${l10n("FIELD_ROM_USAGE")}`];
  if (usage.status === "unavailable")
    return [...sections, "Unable to analyse ROM usage."].join("\n\n");
  if (usage.status === "partial")
    sections.push(l10n("FIELD_BUILD_FAILED_INFO"));
  else sections.push(formatSummary(usage), formatOverview(usage.overview));
  const plugins = formatPlugins(usage.plugins);
  if (plugins) sections.push(plugins);
  const items = formatItems(usage, project);
  if (items) sections.push(items);
  return sections.join("\n\n");
};

export default formatBuildUsageReport;

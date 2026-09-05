import type { UsageData } from "lib/compiler/buildUsage";
import formatBuildUsageReport from "shared/lib/compiler/formatBuildUsageReport";
import { clearL10NData, setL10NData } from "shared/lib/lang/l10n";
import { dummyProjectResources } from "../../../dummydata";

beforeEach(() =>
  setL10NData({
    FIELD_ROM_USAGE: "ROM Usage",
    FIELD_ROM_USED: "ROM Used",
    FIELD_ROM_NEXT_SIZE: "Next Size",
    FIELD_ROM_MAX_CAPACITY: "Max ROM Capacity",
    FIELD_BANK_0: "Bank 0",
    FIELD_MEMORY_USAGE_FREE: "{freeSpace} free",
    FIELD_MEMORY_USAGE: "Memory Usage",
    FIELD_SOURCE: "Source",
    FIELD_BASE_ENGINE: "GB Studio engine",
    FIELD_MUSIC_DRIVER: "Music Driver",
    FIELD_GBDK_RUNTIME: "GBDK",
    FIELD_PROJECT_DATA: "Project data",
    FIELD_PLUGINS: "Plugins",
    FIELD_RESERVED_MEMORY: "Reserved",
    FIELD_TOTAL: "Total",
    FIELD_MAXIMUM: "Maximum",
    FIELD_REMAINING: "Remaining",
    FIELD_PLUGIN_MEMORY_USAGE: "Plugin Memory Usage",
    FIELD_PLUGIN: "Plugin",
    FIELD_BANKED_ROM: "Banked ROM",
    FIELD_BUILD_FAILED_INFO: "Build failed; partial usage follows.",
  }),
);
afterEach(() => clearL10NData());

test("formats a complete report with its memory summary and overview", () => {
  const usage: UsageData = {
    status: "complete",
    memory: {
      rom: {
        used: 32 * 1024,
        size: 128 * 1024,
        maxSize: 2 * 1024 * 1024,
        nextSize: 256 * 1024,
      },
      bank0: { used: 1024, size: 16 * 1024 },
      wram: { used: 512, size: 8 * 1024 },
    },
    overview: {
      cartType: "mbc3",
      engine: { bank0: 1024, wram: 512, bankedRom: 0 },
      musicDriver: { bank0: 0, wram: 0, bankedRom: 0 },
      gbdkRuntime: { bank0: 0, wram: 0, bankedRom: 0 },
      project: { bank0: 0, wram: 0, bankedRom: 0 },
      plugins: { bank0: 0, wram: 0, bankedRom: 0 },
      reserved: { bank0: 0, wram: 0, bankedRom: 0 },
      total: { bank0: 1024, wram: 512, bankedRom: 31 * 1024 },
      maximum: { bank0: 16 * 1024, wram: 8 * 1024, bankedRom: 2032 * 1024 },
      remaining: { bank0: 15 * 1024, wram: 7680, bankedRom: 2001 * 1024 },
    },
    plugins: [],
    scripts: [],
    sources: [],
  };
  const output = formatBuildUsageReport(usage, dummyProjectResources);
  expect(output).toContain("ROM Used: 32 KiB / 128 KiB");
  expect(output).toContain("Next Size: 256 KiB");
  expect(output).toContain("Memory Usage");
  expect(output).toMatch(/GB Studio engine\s+1 KiB\s+512 bytes\s+0 bytes/);
});

test("formats recovered partial usage without a linked summary", () => {
  const usage: UsageData = {
    status: "partial",
    plugins: [
      {
        pluginName: "Example plugin",
        usage: { bank0: 100, wram: 20, bankedRom: 30 },
        files: [],
      },
    ],
    scripts: [],
    sources: [],
  };
  const output = formatBuildUsageReport(usage, dummyProjectResources);
  expect(output).toContain("Build failed; partial usage follows.");
  expect(output).toContain("Plugin Memory Usage");
  expect(output).toContain("Example plugin");
  expect(output).not.toContain("ROM Used:");
});

/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, within } from "../../react-utils";
import DebuggerRomUsageOverview from "components/debugger/DebuggerRomUsageOverview";
import { DebuggerPluginUsage } from "components/debugger/DebuggerPluginUsage";
import DebuggerRomUsage from "components/debugger/DebuggerRomUsage";
import type {
  BuildUsageOverview,
  BuildUsagePlugin,
  UsageData,
} from "lib/compiler/buildUsage";

let mockUsageData: UsageData | null = null;

jest.mock("store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ debug: { usageData: mockUsageData } }),
}));

jest.mock("components/debugger/DebuggerBuildFooter", () => ({
  DebuggerBuildFooter: () => null,
}));

jest.mock("shared/lib/lang/l10n", () => ({
  __esModule: true,
  default: (key: string) => key,
}));

const overview: BuildUsageOverview = {
  cartType: "mbc5",
  engine: { bank0: 10 * 1024, wram: 6 * 1024, bankedRom: 40 * 1024 },
  musicDriver: { bank0: 1900, wram: 100, bankedRom: 0 },
  gbdkRuntime: { bank0: 2000, wram: 37, bankedRom: 0 },
  project: { bank0: 29, wram: 0, bankedRom: 45 * 1024 },
  plugins: { bank0: 0, wram: 0, bankedRom: 218 },
  reserved: { bank0: 0, wram: 672, bankedRom: 0 },
  total: { bank0: 14959, wram: 6953, bankedRom: 87498 },
  maximum: { bank0: 16384, wram: 8192, bankedRom: 255 * 16384 },
  remaining: { bank0: 1425, wram: 1239, bankedRom: 255 * 16384 - 87498 },
};

const plugins: BuildUsagePlugin[] = [
  {
    pluginName: "Example Plugin",
    usage: { bank0: 1024, wram: 20, bankedRom: 2048 },
    files: [
      {
        sourceFile: "src/plugin-added.c",
        usage: { bank0: 1024, wram: 0, bankedRom: 2048 },
        replacesDefault: false,
      },
      {
        sourceFile: "src/core/actor.c",
        usage: { bank0: 0, wram: 20, bankedRom: 0 },
        replacesDefault: true,
      },
    ],
  },
];

test("renders the normalized usage overview without recalculating rows", () => {
  render(<DebuggerRomUsageOverview overview={overview} />);

  expect(screen.getByText("FIELD_MEMORY_USAGE")).toBeInTheDocument();
  const rows = screen.getAllByRole("row");
  expect(rows).toHaveLength(10);
  expect(within(rows[1]).getByText("10 KiB")).toBeInTheDocument();
  expect(within(rows[1]).getByText("6 KiB")).toBeInTheDocument();
  expect(within(rows[1]).getByText("40 KiB")).toBeInTheDocument();
  expect(within(rows[5]).getByText("218 bytes")).toBeInTheDocument();
  expect(screen.getByText("FIELD_MAXIMUM (MBC5)")).toBeInTheDocument();
});

test("uses the selected cartridge's banked ROM capacity for the total", () => {
  const maxBankedRom = 127 * 16 * 1024;
  const totalBankedRom = maxBankedRom + 1;
  render(
    <DebuggerRomUsageOverview
      overview={{
        ...overview,
        cartType: "mbc3",
        total: { ...overview.total, bankedRom: totalBankedRom },
        maximum: { ...overview.maximum, bankedRom: maxBankedRom },
      }}
    />,
  );

  const totalRow = screen.getByText("FIELD_TOTAL").closest("tr");
  expect(totalRow).not.toBeNull();
  expect(within(totalRow as HTMLElement).getByText("1.98 MiB").tagName).toBe(
    "SPAN",
  );
});

test("renders plugin totals, individual source files, and replacement markers", () => {
  render(<DebuggerPluginUsage plugins={plugins} />);

  expect(screen.getByText("FIELD_PLUGIN_MEMORY_USAGE")).toBeInTheDocument();
  const rows = screen.getAllByRole("row");
  expect(rows).toHaveLength(4);
  expect(within(rows[1]).getByText("Example Plugin")).toBeInTheDocument();
  expect(within(rows[1]).getByText("1 KiB")).toBeInTheDocument();
  expect(within(rows[1]).getByText("2 KiB")).toBeInTheDocument();
  expect(within(rows[2]).getByText(/src\/plugin-added\.c/)).toBeInTheDocument();
  expect(within(rows[3]).getByText(/src\/core\/actor\.c/)).toHaveTextContent(
    "FIELD_REPLACES_DEFAULT_ENGINE_FILE",
  );
});

test("only highlights individual plugin files that exceed one bank", () => {
  render(
    <DebuggerPluginUsage
      plugins={[
        {
          pluginName: "Large Plugin",
          usage: { bank0: 0, wram: 0, bankedRom: 40 * 1024 },
          files: [
            {
              sourceFile: "src/large.c",
              usage: { bank0: 0, wram: 0, bankedRom: 20 * 1024 },
              replacesDefault: false,
            },
          ],
        },
      ]}
    />,
  );

  const rows = screen.getAllByRole("row");
  expect(within(rows[1]).getByText("40 KiB").tagName).toBe("TD");
  expect(within(rows[2]).getByText("20 KiB").tagName).toBe("SPAN");
});

test("shows the overview after a complete build", () => {
  mockUsageData = {
    status: "complete",
    memory: {
      rom: {
        used: 1024,
        size: 128 * 1024,
        maxSize: 4 * 1024 * 1024,
        nextSize: 256 * 1024,
      },
      bank0: { used: 512, size: 16 * 1024 },
      wram: { used: 256, size: 8 * 1024 },
    },
    overview,
    plugins,
  };

  render(<DebuggerRomUsage />);

  expect(screen.getByText("FIELD_MEMORY_USAGE")).toBeInTheDocument();
  expect(screen.getByText("FIELD_GBDK_RUNTIME")).toBeInTheDocument();
  expect(screen.getByText("FIELD_PLUGIN_MEMORY_USAGE")).toBeInTheDocument();
});

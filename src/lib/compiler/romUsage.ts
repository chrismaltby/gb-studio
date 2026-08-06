import fs from "fs-extra";
import Path from "path";
import ensureBuildTools from "lib/compiler/ensureBuildTools";
import spawn from "lib/helpers/cli/spawn";
import l10n from "shared/lib/lang/l10n";
import { envWith } from "lib/helpers/cli/env";
import {
  ABSOLUTE_DATA_SIZE,
  SHADOW_OAM_ADDRESS,
  SHADOW_OAM_SIZE,
  STACK_RESERVE_BYTES,
  STACK_TOP_ADDRESS,
} from "lib/compiler/buildMakeScript";

type RomUsageOptions = {
  buildRoot: string;
  romStem: string;
  tmpPath: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

/**
 * An area the linker placed past the end of its memory region.
 * Romusage clamps each bank's "used" value to the bank size, so this is the
 * only place the true size of an overflowing region is reported.
 */
export type UsageOverflow = {
  area: string;
  /** An address within the region that was overrun */
  address: number;
  bytes: number;
};

const OVERFLOW_REGEX =
  /Area\s+(\S+)\s+at\s+[0-9a-fA-F]+\s*->\s*[0-9a-fA-F]+\s+extends past end of memory region at\s+([0-9a-fA-F]+)\s+\(Overflow by (\d+) bytes\)/;

const OVERLAP_REGEX = /Areas overlapp?\s+by\s+(\d+)\s+bytes/;

const OVERLAP_AREA_REGEX = /^\s*(\S+)\s+0x([0-9a-fA-F]+)\s*->\s*0x[0-9a-fA-F]+/;

export const parseUsageOverflow = (line: string): UsageOverflow | undefined => {
  const match = OVERFLOW_REGEX.exec(line);
  if (!match) {
    return undefined;
  }
  return {
    area: match[1],
    address: parseInt(match[2], 16),
    bytes: Number(match[3]),
  };
};

/**
 * Overlap warnings span several lines: the byte count comes first, then one
 * line per area involved. Feed lines through in order and an overflow is
 * returned once the area giving it an address has been seen.
 */
export const createOverlapParser = () => {
  let pendingBytes: number | undefined;
  return (line: string): UsageOverflow | undefined => {
    const overlap = OVERLAP_REGEX.exec(line);
    if (overlap) {
      pendingBytes = Number(overlap[1]);
      return undefined;
    }
    if (pendingBytes === undefined) {
      return undefined;
    }
    const area = OVERLAP_AREA_REGEX.exec(line);
    if (!area) {
      return undefined;
    }
    const bytes = pendingBytes;
    pendingBytes = undefined;
    return {
      area: area[1],
      address: parseInt(area[2], 16),
      bytes,
    };
  };
};

const hex = (value: number) => value.toString(16).toUpperCase();

/**
 * Areas the engine occupies at fixed addresses that never appear in the map
 * file. Passed to romusage as exclusive areas so that it both counts them as
 * used and warns when linker placed data collides with them.
 */
export const reservedWramAreaArgs = (): string[] => [
  `-e:SHADOW_OAM:${hex(SHADOW_OAM_ADDRESS)}:${hex(SHADOW_OAM_SIZE)}`,
  `-e:STACK:${hex(STACK_TOP_ADDRESS - STACK_RESERVE_BYTES)}:${hex(
    STACK_RESERVE_BYTES,
  )}`,
  `-e:ABSOLUTE_DATA:${hex(STACK_TOP_ADDRESS)}:${hex(ABSOLUTE_DATA_SIZE)}`,
];

export type UsageData = {
  overflows: UsageOverflow[];
  banks: Array<{
    name: string;
    type: string;
    baseBankNum: string;
    isBanked: string;
    isMergedBank: string;
    rangeStart: string;
    rangeEnd: string;
    size: string;
    used: string;
    free: string;
    usedPercent: string;
    freePercent: string;
    miniGraph: string;
  }>;
};

const romUsage = async ({
  buildRoot = "/tmp",
  tmpPath = "/tmp",
  romStem = "game",
  warnings = (_msg) => {},
  progress = (_msg) => {},
}: RomUsageOptions) => {
  const env = { ...process.env };

  const buildToolsPath = await ensureBuildTools(tmpPath);
  const buildToolsVersion = await fs.readFile(
    `${buildToolsPath}/tools_version`,
    "utf8",
  );

  env.PATH = envWith([Path.join(buildToolsPath, "gbdk", "bin")]);

  env.GBDKDIR = `${buildToolsPath}/gbdk/`;
  env.GBS_TOOLS_VERSION = buildToolsVersion;

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  const romusageCommand =
    process.platform === "win32"
      ? `"${buildToolsPath}\\gbdk\\bin\\romusage.exe"`
      : "romusage";
  const romusageArgs = [
    `"${buildRoot}/build/rom/${romStem}.map"`,
    `-g`,
    `-sH`,
    `-sJ`,
    // The map file has no record of these, so without them romusage reports
    // WRAM the engine has already claimed as free
    ...reservedWramAreaArgs(),
  ];

  let output = "";
  let jsonStarted = false;
  const overflows: UsageOverflow[] = [];
  const parseOverlap = createOverlapParser();
  progress(`${l10n("COMPILER_ROMUSAGE")}...`);
  const { completed: romusageCompleted } = spawn(
    romusageCommand,
    romusageArgs,
    options,
    {
      onLog: (msg) => {
        // Romusage prints memory overflow warnings to stdout ahead of the
        // JSON output, which would otherwise make the result unparseable.
        // Forward those lines as warnings and only collect the JSON itself.
        if (!jsonStarted && !msg.trimStart().startsWith("{")) {
          if (msg.trim()) {
            const overflow = parseUsageOverflow(msg) ?? parseOverlap(msg);
            if (overflow) {
              overflows.push(overflow);
            }
            warnings(msg);
          }
          return;
        }
        jsonStarted = true;
        output += msg;
      },
      onError: (msg) => {
        if (msg.indexOf("Romusage") > -1) {
          return;
        }
        warnings(msg);
      },
    },
  );

  await romusageCompleted;

  if (!jsonStarted) {
    throw new Error("Romusage produced no usage data");
  }

  // Romusage reports overflows outside its JSON, merge them back in
  return {
    ...(JSON.parse(output) as Omit<UsageData, "overflows">),
    overflows: overflows.filter(
      (overflow, index) =>
        // The same warning is printed once per pass romusage makes
        overflows.findIndex(
          (other) =>
            other.area === overflow.area &&
            other.address === overflow.address &&
            other.bytes === overflow.bytes,
        ) === index,
    ),
  };
};

export default romUsage;

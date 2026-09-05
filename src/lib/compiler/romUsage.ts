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
} from "shared/lib/compiler/memoryLayout";
import type { BuildManifest } from "lib/compiler/buildManifest";

type RomUsageOptions = {
  manifest: BuildManifest;
  tmpPath: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

export type RomUsageBank = {
  name: string;
  size: number;
  used: number;
};

export type RomUsageData = {
  banks: RomUsageBank[];
};

const hex = (value: number) => value.toString(16).toUpperCase();

const parseBankValue = (value: string) => {
  if (value.trim() === "") {
    throw new Error("Invalid bank value");
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Invalid bank value: ${String(value)}`);
  }

  return number;
};

export const parseRomUsage = (output: string): RomUsageData => {
  const parsed: unknown = JSON.parse(output);

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("banks" in parsed) ||
    !Array.isArray(parsed.banks)
  ) {
    throw new Error("romusage output does not contain a bank list");
  }

  const banks = parsed.banks.map((bank, index) => {
    if (!bank || typeof bank !== "object" || !("name" in bank)) {
      throw new Error(`Invalid romusage bank at index ${index}`);
    }
    if (
      typeof bank.name !== "string" ||
      typeof bank.size !== "string" ||
      typeof bank.used !== "string"
    ) {
      throw new Error(`Invalid romusage bank data at index ${index}`);
    }
    return {
      name: bank.name,
      size: parseBankValue(bank.size),
      used: parseBankValue(bank.used),
    };
  });

  return { banks };
};

const romUsage = async ({
  manifest,
  tmpPath = "/tmp",
  warnings = (_msg) => {},
  progress = (_msg) => {},
}: RomUsageOptions): Promise<RomUsageData> => {
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
    cwd: manifest.buildRoot,
    env,
    shell: true,
  };

  const romusageCommand =
    process.platform === "win32"
      ? `"${buildToolsPath}\\gbdk\\bin\\romusage.exe"`
      : "romusage";

  const romusageArgs = [
    `"${manifest.artifacts.mapPath}"`,
    `-sJ`,
    `-Q`,
    `-e:SHADOW_OAM:${hex(SHADOW_OAM_ADDRESS)}:${hex(SHADOW_OAM_SIZE)}`,
    `-e:STACK:${hex(STACK_TOP_ADDRESS - STACK_RESERVE_BYTES)}:${hex(
      STACK_RESERVE_BYTES,
    )}`,
    `-e:ABSOLUTE_DATA:${hex(STACK_TOP_ADDRESS)}:${hex(ABSOLUTE_DATA_SIZE)}`,
  ];

  let output = "";
  progress(`${l10n("COMPILER_ROMUSAGE")}...`);
  const { completed: romusageCompleted } = spawn(
    romusageCommand,
    romusageArgs,
    options,
    {
      onLog: (msg) => {
        output += msg;
      },
      onError: (msg) => {
        warnings(msg);
      },
    },
  );

  await romusageCompleted;

  return parseRomUsage(output);
};

export default romUsage;

import {
  remove,
  writeFile,
  ensureDir,
  createReadStream,
  pathExists,
  readJSON,
} from "fs-extra";
import Path from "path";
import AdmZip from "adm-zip";
import spawn from "../../src/lib/helpers/cli/spawn";
import { createHash } from "crypto";

const buildToolsRoot = Path.join(
  Path.normalize(`${__dirname}/../../`),
  "buildTools",
);

const lockPath = Path.join(buildToolsRoot, "dependencies.lock");

const dependencies = {
  "darwin-arm64": {
    gbdk: {
      url: "https://github.com/gbdk-2020/gbdk-2020/releases/download/gbdk-next/gbdk-macos-arm64.tar.gz",
      type: "targz",
    },
  },
  "darwin-x64": {
    gbdk: {
      url: "https://github.com/gbdk-2020/gbdk-2020/releases/download/gbdk-next/gbdk-macos.tar.gz",
      type: "targz",
    },
  },
  "linux-x64": {
    gbdk: {
      url: "https://github.com/gbdk-2020/gbdk-2020/releases/download/gbdk-next/gbdk-linux64.tar.gz",
      type: "targz",
    },
  },
  "linux-arm64": {
    gbdk: {
      url: "https://github.com/gbdk-2020/gbdk-2020/releases/download/gbdk-next/gbdk-linux-arm64.tar.gz",
      type: "targz",
    },
  },
  "win32-ia32": {
    gbdk: {
      url: "https://github.com/gbdk-2020/gbdk-2020/releases/download/gbdk-next/gbdk-win32.zip",
      type: "zip",
    },
  },
  "win32-x64": {
    gbdk: {
      url: "https://github.com/gbdk-2020/gbdk-2020/releases/download/gbdk-next/gbdk-win64.zip",
      type: "zip",
    },
  },
} as const;

type Arch = keyof typeof dependencies;

const archs = Object.keys(dependencies) as Array<Arch>;
const localArch = `${process.platform}-${process.arch}`;

const fetchAll = process.argv.includes("--all");
const updateLock = process.argv.includes("--update-lock");

const fetchArch =
  process.argv
    .find((arg) => arg.startsWith("--arch="))
    ?.replace("--arch=", "") ?? localArch;

const extractTarGz = async (
  archivePath: string,
  outputDir: string,
): Promise<void> => {
  console.log(`Extract tar to "${outputDir}"`);
  const res = spawn("tar", ["-zxf", archivePath, "-C", outputDir], {}, {});
  await res.completed;
  console.log("✅ Done");
};

const extractZip = async (
  archivePath: string,
  outputDir: string,
): Promise<void> => {
  console.log(`Extract zip to "${outputDir}"`);
  const zip = new AdmZip(archivePath);
  await zip.extractAllTo(outputDir, true);
  console.log("✅ Done");
};

export const sha256File = async (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    hash.on("error", reject);
    stream
      .pipe(hash)
      .setEncoding("hex")
      .on("finish", () => {
        resolve(hash.read());
      });
  });

export const fetchGBDKDependency = async (
  arch: Arch,
  expectedChecksum?: string,
) => {
  console.log(`Fetching GBDK for arch=${arch}`);
  const { url, type } = dependencies[arch].gbdk;
  console.log(`URL=${url}`);

  const response = await fetch(url);
  const buffer = await response.arrayBuffer(); // Get a Buffer from the response
  const data = Buffer.from(buffer);
  const tmpPath = Path.join(buildToolsRoot, "tmp.data");
  await writeFile(tmpPath, data);
  console.log(`Written to "${tmpPath}"`);

  const checksum = await sha256File(tmpPath);

  if (expectedChecksum && checksum !== expectedChecksum && !updateLock) {
    throw new Error(
      `Checksum mismatch for ${arch}. Expected: ${expectedChecksum}, Got: ${checksum}.`,
    );
  }

  const gbdkArchPath = Path.join(buildToolsRoot, arch);
  await ensureDir(gbdkArchPath);

  if (type === "targz") {
    await extractTarGz(tmpPath, gbdkArchPath);
  } else {
    await extractZip(tmpPath, gbdkArchPath);
  }

  await remove(tmpPath);

  return checksum;
};

const main = async () => {
  let lockFile: { gbdk: Record<string, string> } = { gbdk: {} };
  if (!updateLock && (await pathExists(lockPath))) {
    lockFile = await readJSON(lockPath);
  }

  await ensureDir(buildToolsRoot);
  for (const arch of archs) {
    if (fetchAll || arch === fetchArch) {
      const checksum = await fetchGBDKDependency(arch, lockFile.gbdk[arch]);
      lockFile.gbdk[arch] = checksum;
    }
  }

  await writeFile(lockPath, JSON.stringify(lockFile, null, 2));
};

main().catch((e) => {
  console.error(`❌ Error: `, e);
  if (
    e instanceof Error &&
    e.message &&
    e.message.includes("Checksum mismatch")
  ) {
    console.log("");
    console.log("A new release of GBDK may have been published.");
    console.log("To update lock file with new checksums run:");
    console.log("");
    console.log(`${process.argv.join(" ")} --update-lock`);
    console.log("");
  }
  process.exit(1);
});

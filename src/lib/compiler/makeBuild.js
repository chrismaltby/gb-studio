import fs from "fs-extra";
import buildMakeScript, {
  buildLinkFile,
  buildLinkFlags,
  buildPackFile,
} from "./buildMakeScript";
import { isMBC1 } from "./helpers";
import { cacheObjData, fetchCachedObjData } from "./objCache";
import ensureBuildTools from "./ensureBuildTools";
import spawn from "../helpers/cli/spawn";
import l10n from "../helpers/l10n";

const makeBuild = async ({
  buildRoot = "/tmp",
  tmpPath = "/tmp",
  data = {},
  profile = false,
  progress = (_msg) => {},
  warnings = (_msg) => {},
} = {}) => {
  const env = Object.create(process.env);
  const { settings } = data;

  const buildToolsPath = await ensureBuildTools(tmpPath);

  env.PATH = [`${buildToolsPath}/gbdk/bin`, env.PATH].join(":");
  env.GBDKDIR = `${buildToolsPath}/gbdk/`;

  env.CART_TYPE = parseInt(settings.cartType || "1B", 16);
  env.TMP = tmpPath;
  env.TEMP = tmpPath;
  if (settings.customColorsEnabled) {
    env.COLOR = true;
  }
  if (profile) {
    env.PROFILE = true;
  }
  if (settings.musicDriver === "huge") {
    env.MUSIC_DRIVER = "HUGE_TRACKER";
  } else {
    env.MUSIC_DRIVER = "GBT_PLAYER";
  }

  // Modify BankManager.h to set MBC1 memory controller
  if (isMBC1(settings.cartType)) {
    let bankHeader = await fs.readFile(
      `${buildRoot}/include/BankManager.h`,
      "utf8"
    );
    bankHeader = bankHeader.replace(/_MBC5/g, "_MBC1");
    await fs.writeFile(
      `${buildRoot}/include/BankManager.h`,
      bankHeader,
      "utf8"
    );
  }

  // Populate /obj with cached data
  await fetchCachedObjData(buildRoot, tmpPath, env);

  // Compile Source Files

  const makeScriptFile = process.platform === "win32" ? "make.bat" : "make.sh";

  const makeScript = await buildMakeScript(buildRoot, {
    CART_TYPE: env.CART_TYPE,
    CART_SIZE: env.CART_SIZE,
    customColorsEnabled: settings.customColorsEnabled,
    gbcFastCPUEnabled: settings.gbcFastCPUEnabled,
    musicDriver: settings.musicDriver,
    profile,
    platform: process.platform,
  });
  await fs.writeFile(`${buildRoot}/${makeScriptFile}`, makeScript);

  const command =
    process.platform === "win32" ? makeScriptFile : `/bin/sh ${makeScriptFile}`;
  const args = ["rom"];

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  await spawn(command, args, options, {
    onLog: (msg) => progress(msg),
    onError: (msg) => warnings(msg),
  });

  await fs.unlink(`${buildRoot}/${makeScriptFile}`);

  // GBSPack ---

  progress(`${l10n("COMPILER_PACKING")}...`);
  const packFile = await buildPackFile(buildRoot);
  const packFilePath = `${buildRoot}/obj/packfile.pk`;
  await fs.writeFile(packFilePath, packFile);

  const packCommand = `../_gbstools/gbspack/gbspack`;
  const packArgs = ["-b", 5, "-f", 255, "-e", "rel", "-c", "-i", packFilePath];
  const cartSize = await spawn(packCommand, packArgs, options, {
    onError: (msg) => warnings(msg),
  });

  // Link ROM ---

  progress(`${l10n("COMPILER_LINKING")}...`);
  const linkFile = await buildLinkFile(buildRoot, parseInt(cartSize, 10));
  const linkFilePath = `${buildRoot}/obj/linkfile.lk`;
  await fs.writeFile(linkFilePath, linkFile);

  const linkCommand = `../_gbstools/gbdk/bin/lcc`;
  const linkArgs = buildLinkFlags(
    linkFilePath,
    data.name || "GBStudio",
    env.CART_TYPE,
    settings.customColorsEnabled,
    settings.musicDriver
  );

  await spawn(linkCommand, linkArgs, options, {
    onLog: (msg) => progress(msg),
    onError: (msg) => {
      if (msg.indexOf("Converted build") > -1) {
        return;
      }
      warnings(msg);
    },
  });

  // Store /obj in cache
  await cacheObjData(buildRoot, tmpPath, env);
};

export default makeBuild;

import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs-extra";
import parseAssetPath from "../helpers/path/parseAssetPath";
import { toValidSymbol } from "lib/helpers/symbols";

const globAsync = promisify(glob);

export const toVGMType = (filename) => {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".wav")) {
    return "wav";
  }
  if (lowerFilename.endsWith(".vgm") || lowerFilename.endsWith(".vgz")) {
    return "vgm";
  }
  if (lowerFilename.endsWith(".sav")) {
    return "fxhammer";
  }
  throw new Error("Unknown sound type");
};

const loadSoundData = (projectRoot) => async (filename) => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, "sounds");
  const fileStat = await stat(filename, { bigint: true });
  const inode = fileStat.ino.toString();
  const type = toVGMType(filename);

  return {
    id: uuidv4(),
    plugin,
    name: file,
    symbol: toValidSymbol(`sound_${file}`),
    filename: file,
    type,
    inode,
    _v: Date.now(),
  };
};

const loadAllSoundData = async (projectRoot) => {
  const soundPaths = await globAsync(
    `${projectRoot}/assets/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)`
  );
  const soundsData = await Promise.all(
    [].concat(
      soundPaths.map(loadSoundData(projectRoot)),
      pluginPaths.map(loadSoundData(projectRoot))
    )
  );
  return soundsData;
};

export default loadAllSoundData;
export { loadSoundData };

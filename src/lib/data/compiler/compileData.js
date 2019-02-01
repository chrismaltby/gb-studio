import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import { walkEvents, walkScenesEvents } from "../../helpers/eventSystem";

const compile = async (
  projectData,
  options = {
    projectRoot: "/tmp",
    bankSize: GB_MAX_BANK_SIZE,
    bankOffset: MIN_DATA_BANK
  }
) => {
  const output = {};
  const banked = new BankedData(options.bankSize);

  const precompiled = await precompile(projectData);

  return output;
};

//#region precompile

const precompile = async projectData => {
  const flags = precompileFlags(projectData.scenes);
  const strings = precompileStrings(projectData.scenes);
  //   await precompileStrings(world);
  //   await precompileImages(world);
  //   await precompileSprites(world);
  //   await precompileMaps(world);
  //   await precompileScript(world);

  return {
    flags,
    strings
  };
};

export const precompileFlags = scenes => {
  let flags = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.flag) {
      if (flags.indexOf(cmd.args.flag) === -1) {
        flags.push(cmd.args.flag);
      }
    }
  });
  return flags;
};

export const precompileStrings = scenes => {
  let strings = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.text) {
      // If never seen this string before add it to the list
      if (strings.indexOf(cmd.args.text) === -1) {
        strings.push(cmd.args.text);
      }
    }
  });
  return strings;
};

//#endregion

export default compile;

import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import { walkEvents } from "../../helpers/eventSystem";

const compile = (
  projectData,
  options = {
    projectRoot: "/tmp",
    bankSize: GB_MAX_BANK_SIZE,
    bankOffset: MIN_DATA_BANK
  }
) => {
  const output = {};
  const banked = new BankedData(options.bankSize);

  const precompiled = precompile(projectData);

  return output;
};

//#region precompile

const precompile = async projectData => {
  const flags = await precompileFlags(projectData.scenes);
  //   await precompileStrings(world);
  //   await precompileImages(world);
  //   await precompileSprites(world);
  //   await precompileMaps(world);
  //   await precompileScript(world);

  return {
    flags
  };
};

export const precompileFlags = scenes => {
  let flags = [];
  scenes.forEach(scene => {
    (scene.actors || []).forEach(actor => {
      walkEvents(actor.events || [], cmd => {
        if (cmd.args && cmd.args.flag) {
          if (flags.indexOf(cmd.args.flag) === -1) {
            flags.push(cmd.args.flag);
          }
        }
      });
    });
    (scene.triggers || []).forEach(trigger => {
      walkEvents(trigger.events || [], cmd => {
        if (cmd.args && cmd.args.flag) {
          if (flags.indexOf(cmd.args.flag) === -1) {
            flags.push(cmd.args.flag);
          }
        }
      });
    });
  });
  return flags;
};

//#endregion

export default compile;

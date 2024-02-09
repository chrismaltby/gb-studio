import API from "renderer/lib/api";
import { defaultKeys, milkytrackerKeys, openMPTKeys } from "./defaultKeys";

interface KeyCommands {
  editNoteField?: (...args: any[]) => void;
  editInstrumentField?: (...args: any[]) => void;
  editEffectCodeField?: (...args: any[]) => void;
  editEffectParamField?: (...args: any[]) => void;
  editOffsetField?: (...args: any[]) => void;
  editJumpField?: (...args: any[]) => void;
}

export type KeyWhen =
  | null
  | "noteColumnFocus"
  | "instrumentColumnFocus"
  | "effectCodeColumnFocus"
  | "effectParamColumnFocus"
  | "offsetColumnFocus"
  | "jumpColumnFocus";

export interface KeyBinding {
  key: string;
  command: keyof KeyCommands;
  args: any;
  when: KeyWhen;
}

let keyBindings: KeyBinding[] = [];

export const getKeys = (key: string, when: KeyWhen, cmds: KeyCommands) => {
  const pressedKey = keyBindings
    .reverse()
    .filter((k) => k.key === key && k.when === when)[0];

  if (pressedKey) {
    const command = cmds[pressedKey.command];
    if (command) {
      command(pressedKey.args);
    }
  }
};

export const initKeyBindings = async () => {
  const customTrackerKeyBindings =
    (await API.settings.get("trackerKeyBindings")) === 1
      ? milkytrackerKeys
      : openMPTKeys;
  keyBindings = defaultKeys.concat(customTrackerKeyBindings);
};

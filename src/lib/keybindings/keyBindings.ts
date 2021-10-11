import { defaultKeys, milkytrackerKeys, openMPTKeys } from "./defaultKeys";
import settings from "electron-settings";

interface KeyCommands {
  editNoteCell?: (...args: any[]) => void;
  editInstrumentCell?: (...args: any[]) => void;
  editEffectCodeCell?: (...args: any[]) => void;
  editEffectParamCell?: (...args: any[]) => void;
}

export type KeyWhen =
  | null
  | "noteColumnFocus"
  | "instrumentColumnFocus"
  | "effectCodeColumnFocus"
  | "effectParamColumnFocus";

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

export const initKeyBindings = () => {
  keyBindings = defaultKeys.concat(
    settings.get("trackerKeyBindings") === 1 ? milkytrackerKeys : openMPTKeys
  );
};

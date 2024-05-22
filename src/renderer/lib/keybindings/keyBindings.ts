import API from "renderer/lib/api";
import { defaultKeys, milkytrackerKeys, openMPTKeys } from "./defaultKeys";

interface KeyCommands {
  editNoteField?: (value: number | null) => void;
  editInstrumentField?: (value: number | null) => void;
  editEffectCodeField?: (value: number | null) => void;
  editEffectParamField?: (value: number | null) => void;
  editOffsetField?: (value: "+" | "-" | number | null) => void;
  editJumpField?: (value: number | null) => void;
}

export type KeyWhen =
  | null
  | "noteColumnFocus"
  | "instrumentColumnFocus"
  | "effectCodeColumnFocus"
  | "effectParamColumnFocus"
  | "offsetColumnFocus"
  | "jumpColumnFocus";

export type KeyBinding =
  | {
      key: string;
      command: "editOffsetField";
      args: "+" | "-" | number | null;
      when: KeyWhen;
    }
  | {
      key: string;
      command: keyof Omit<KeyCommands, "editOffsetField">;
      args: number | null;
      when: KeyWhen;
    };

let keyBindings: KeyBinding[] = [];

export const getKeys = (key: string, when: KeyWhen, cmds: KeyCommands) => {
  const pressedKey = keyBindings
    .reverse()
    .filter((k) => k.key === key && k.when === when)[0];

  if (pressedKey) {
    if (pressedKey.command === "editOffsetField") {
      const command = cmds[pressedKey.command];
      if (command) {
        command(pressedKey.args);
      }
    } else {
      const command = cmds[pressedKey.command];
      if (command) {
        command(pressedKey.args);
      }
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

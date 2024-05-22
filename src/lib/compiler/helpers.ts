export type DirectionGBVMValue =
  | "DIR_DOWN"
  | "DIR_LEFT"
  | "DIR_RIGHT"
  | "DIR_UP";

const DIR_ENUM_LOOKUP: Record<string, DirectionGBVMValue> = {
  down: "DIR_DOWN",
  left: "DIR_LEFT",
  right: "DIR_RIGHT",
  up: "DIR_UP",
} as const;

const TEXT_SPEED_LOOKUP = [0x0, 0x1, 0x3, 0x7, 0xf, 0x1f] as const;

const KEY_BITS: Record<string, number> = {
  left: 0x02,
  right: 0x01,
  up: 0x04,
  down: 0x08,
  a: 0x10,
  b: 0x20,
  select: 0x40,
  start: 0x80,
} as const;

export const inputDec = (input: string | string[]) => {
  let output = 0;
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      output |= KEY_BITS[input[i]];
    }
  } else {
    output = KEY_BITS[input];
  }
  if (output === 0) {
    // If no input set game would hang
    // as could not continue on, assume
    // this isn't what user wants and
    // instead allow any input
    output = 255;
  }
  return output;
};

export const dirEnum = (dir: unknown): DirectionGBVMValue =>
  DIR_ENUM_LOOKUP[dir as string] || "DIR_DOWN";

export const textSpeedDec = (speed: number): number =>
  TEXT_SPEED_LOOKUP[speed] !== undefined ? TEXT_SPEED_LOOKUP[speed] : 0x1;

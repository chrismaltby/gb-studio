import { readFile } from "fs-extra";

export const readDebuggerSymbols = async (outputRoot: string) => {
  const noi = await readFile(`${outputRoot}/build/rom/game.noi`, "utf8");

  const map = Object.fromEntries(
    noi
      .split("\n")
      .map((r) => r.split(" ").slice(1, 3))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16)])
  );

  const dict = new Map<number, Map<number, string>>();
  Object.keys(map).forEach((k) => {
    const match = k.match(/___bank_(.*)/);
    if (match) {
      const label = `_${match[1]}`;
      const bank = map[k];
      if (map[label]) {
        const n = dict.get(bank) ?? new Map<number, string>();
        const ptr = map[label] & 0x0ffff;
        n.set(ptr, label);
        dict.set(bank, n);
      }
    }
  });

  const gameGlobals = await readFile(
    outputRoot + "/include/data/game_globals.i",
    "utf8"
  );

  const globals = Object.fromEntries(
    gameGlobals
      .split("\n")
      .map((r) => r.split(" = "))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16)])
  );

  return { map, dict, globals };
};

import { readFile } from "fs-extra";

export const readDebuggerSymbols = async (outputRoot: string) => {
  const noi = await readFile(`${outputRoot}/build/rom/game.noi`, "utf8");

  const memoryMap = Object.fromEntries(
    noi
      .split("\n")
      .map((r) => r.split(" ").slice(1, 3))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16)])
  );

  const memoryDict = new Map<number, Map<number, string>>();
  Object.keys(memoryMap).forEach((k) => {
    const match = k.match(/___bank_(.*)/);
    if (match) {
      const label = `_${match[1]}`;
      const bank = memoryMap[k];
      if (memoryMap[label]) {
        const n = memoryDict.get(bank) ?? new Map<number, string>();
        const ptr = memoryMap[label] & 0x0ffff;
        n.set(ptr, label);
        memoryDict.set(bank, n);
      }
    }
  });

  const gameGlobals = await readFile(
    outputRoot + "/include/data/game_globals.i",
    "utf8"
  );

  const globalVariables = Object.fromEntries(
    gameGlobals
      .split("\n")
      .map((r) => r.split(" = "))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16)])
  );

  return { memoryMap, memoryDict, globalVariables };
};

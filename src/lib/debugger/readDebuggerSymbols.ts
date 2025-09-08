import { readFile } from "fs-extra";

export const readDebuggerSymbols = async (
  outputRoot: string,
  romStem: string,
) => {
  const noi = await readFile(`${outputRoot}/build/rom/${romStem}.noi`, "utf8");

  const memoryMap: Record<string, number> = Object.fromEntries(
    noi
      .split("\n")
      .map((r) => r.split(" ").slice(1, 3))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16) & 0xffff]),
  );

  const gameGlobals = await readFile(
    outputRoot + "/include/data/game_globals.i",
    "utf8",
  );

  const globalVariables: Record<string, number> = Object.fromEntries(
    gameGlobals
      .split("\n")
      .map((r) => r.split(" = "))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 10)]),
  );

  return { memoryMap, globalVariables };
};

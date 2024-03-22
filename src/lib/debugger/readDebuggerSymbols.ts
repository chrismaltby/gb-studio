import { readFile } from "fs-extra";

export const readDebuggerSymbols = async (outputRoot: string) => {
  const noi = await readFile(`${outputRoot}/build/rom/game.noi`, "utf8");

  const memoryMap: Record<string, number> = Object.fromEntries(
    noi
      .split("\n")
      .map((r) => r.split(" ").slice(1, 3))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16) & 0xffff])
  );

  const gameGlobals = await readFile(
    outputRoot + "/include/data/game_globals.i",
    "utf8"
  );

  const globalVariables: Record<string, number> = Object.fromEntries(
    gameGlobals
      .split("\n")
      .map((r) => r.split(" = "))
      .map((_, i, keys) => [keys[i][0], parseInt(keys[i][1], 16)])
  );

  const extractOpLengths = (input: string) => {
    const start = input.indexOf("const SCRIPT_CMD script_cmds[] = {");
    const end = input.indexOf("};", start) + 1;
    const scriptCmdsSection = input.substring(start, end);
    console.log("scriptCmdsSection", scriptCmdsSection);

    // Regular expression to match entries, taking into account multiline entries
    const entryRegex = /{\s*[^,]+,\s*[^,]+,\s*(\d+)\s*},?/gm;

    let match = null;
    const lengths = [];

    // Iterate over all matches within the isolated section
    while ((match = entryRegex.exec(scriptCmdsSection)) !== null) {
      // Parse the captured value to a number and add it to the array
      const lastValue = parseInt(match[1], 10);
      lengths.push(lastValue);
    }

    return lengths;
  };

  const opLengths = extractOpLengths(
    await readFile(outputRoot + "/src/core/vm_instructions.c", "utf8")
  );

  const vmOpSizes = Object.fromEntries(
    (await readFile(outputRoot + "/include/vm.i", "utf8"))
      .split("\n")
      .filter((line) => line.startsWith("OP_VM_") && line.includes("="))
      .map((line) => {
        const tokens = line.split("=");
        const symbol = tokens[0].trim().replace(/^OP_/, "");
        const value = parseInt(tokens[1].trim(), 16);
        const numArgs = opLengths[value - 1] ?? 0;
        return [symbol, numArgs + 1];
      })
  );

  return { memoryMap, globalVariables, vmOpSizes };
};

// GBA Studio - M2b bring-up driver.
//
// Reads a GB Studio-generated GBVM assembly file (.s), runs it through the code
// bridge (parseGbvmAsm -> emitGbaBytecode), and writes a gbavm bytecode C file.
// This is the editor->engine path exercised end-to-end on real codegen output,
// ahead of wiring it into the editor's Build button. Usage:
//   node node_modules/ts-node/dist/bin.js src/lib/compiler/gba/genSceneBytecode.ts <in.s> [out.c]
import { readFileSync, writeFileSync } from "fs";
import { parseGbvmAsm } from "./parseGbvmAsm";
import { emitGbaBytecode, formatGbaProgramC } from "./emitGbaBytecode";

const inFile = process.argv[2];
if (!inFile) throw new Error("usage: genSceneBytecode <in.s> [out.c]");
const outFile = process.argv[3] ?? "D:/source/gbavm/src/game_script.c";

const { items, skipped } = parseGbvmAsm(readFileSync(inFile, "utf8"));
const program = emitGbaBytecode(items);
writeFileSync(outFile, formatGbaProgramC("game_script", program) + "\n");

// eslint-disable-next-line no-console
console.log(
  `parsed ${inFile} -> ${outFile}: ${program.bytes.length} bytes, ${program.relocations.length} relocations`,
);
if (skipped.length) {
  // eslint-disable-next-line no-console
  console.log(`  deferred (not yet supported on GBA): ${skipped.join(" | ")}`);
}

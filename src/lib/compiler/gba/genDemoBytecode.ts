// GBA Studio - M2 bring-up generator.
//
// Runs a moving-actor program through the real M1 emit layer and writes a gbavm
// bytecode C file (bytecode + relocation table). Stand-in for full project-events
// codegen (M3): proves the emit layer's output runs on GBA via the engine's
// relocation loader. Usage:
//   node node_modules/ts-node/dist/bin.js src/lib/compiler/gba/genDemoBytecode.ts [outFile]
import { writeFileSync } from "fs";
import { emitGbaBytecode, formatGbaProgramC, GbaItem } from "./emitGbaBytecode";

// RPN: g2 = min(g2 + 4, 0x0A00). Moves the actor right 4 subpx/frame, clamping at
// x = 160px so a screenshot is timing-independent. Raw stream (no leading 0x15).
const RPN_MOVE_RIGHT_CLAMPED = [
  0xfd, 0x02, 0x00, // REF   g2
  0xfe, 0x04, 0x00, // INT16 4
  0x0a, //             ADD
  0xfe, 0x00, 0x0a, // INT16 0x0A00 (160px*16)
  0x14, //             MIN (clamp)
  0xfb, 0x02, 0x00, // REF_SET g2
  0x00, //             end
];

// Heap: g1 = actor ID, g2 = X (subpx), g3 = Y (subpx); pos struct base = g1.
const program = emitGbaBytecode([
  { kind: "op", op: 0x31, operands: [0] }, //          ACTOR_ACTIVATE 0
  { kind: "op", op: 0x14, operands: [1, 0] }, //       SET_CONST g1 = 0        (actor ID)
  { kind: "op", op: 0x14, operands: [2, 0x0780] }, //  SET_CONST g2 = 120px*16 (start centre)
  { kind: "op", op: 0x14, operands: [3, 0x0500] }, //  SET_CONST g3 = 80px*16
  { kind: "label", name: "loop" },
  { kind: "rpn", bytes: RPN_MOVE_RIGHT_CLAMPED }, //   g2 = min(g2+4, 160px)
  { kind: "op", op: 0x35, operands: [1] }, //          ACTOR_SET_POS (struct @ g1)
  { kind: "op", op: 0x18, operands: [] }, //           IDLE (yield one frame)
  { kind: "op", op: 0x09, operands: [{ label: "loop" }] }, // JUMP loop (relocation)
] as GbaItem[]);

const out = process.argv[2] ?? "D:/source/gbavm/src/game_script.c";
writeFileSync(out, formatGbaProgramC("game_script", program) + "\n");
// eslint-disable-next-line no-console
console.log(
  `wrote ${out}: ${program.bytes.length} bytes, ${program.relocations.length} relocations`,
);

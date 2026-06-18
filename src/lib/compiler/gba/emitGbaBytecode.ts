// GBA Studio - GBA bytecode emitter (Milestone M1).
//
// Serializes a GBVM opcode stream into the byte layout the ported gbavm engine's
// VM_STEP expects (see D:/source/gbavm/src/vm.c): little-endian operands, and
// 32-bit native pointers for code targets (jump/call/loop/if labels).
//
// GB Studio's GB path defers byte encoding to the SDCC assembler via the vm.i
// macros (which emit big-endian, reversed-order, 16-bit operands). The GBA engine
// has no assembler, so this module performs the encoding directly. Code targets
// can't be known until the bytecode blob is placed in ROM, so each is emitted as a
// 4-byte placeholder plus a relocation entry; the engine patches them to real
// pointers at load time (generalizing the single hand-patched jump in gbavm's
// current main.cpp).

export type GbaOperandType = "u8" | "i8" | "u16" | "i16" | "ptr";

// Fixed operand layout per opcode, in the order gbavm's VM_STEP reads them.
// "ptr" = a 32-bit code target (a label) -> emitted as a 4-byte relocation.
// Covers the opcodes the engine implements today (system + control flow + the
// initial hardware ops); more are added here as the engine gains handlers.
export const GBA_OPCODE_SPECS: Record<number, GbaOperandType[]> = {
  0x01: ["u16"], // PUSH_CONST val
  0x02: ["u8"], // POP n
  0x04: ["ptr"], // CALL addr
  0x05: ["u8"], // RET n
  0x07: ["i16", "ptr", "u8"], // LOOP idx, label, n
  0x09: ["ptr"], // JUMP label
  0x0a: ["u8", "ptr"], // CALL_FAR bank, addr
  0x0b: ["u8"], // RET_FAR n
  0x0f: ["u8", "i16", "i16", "ptr", "u8"], // IF cond, idxA, idxB, label, n
  0x10: ["i16"], // PUSH_VALUE_IND idx
  0x11: ["i16"], // PUSH_VALUE idx
  0x12: ["i8"], // RESERVE ofs
  0x13: ["i16", "i16"], // SET idxA, idxB
  0x14: ["i16", "u16"], // SET_CONST idx, val
  0x16: ["i16"], // JOIN idx
  0x17: ["i16"], // TERMINATE idx
  0x18: [], // IDLE
  0x19: ["i16", "i16"], // GET_TLOCAL idxA, idxB
  0x1a: ["u8", "i16", "i16", "ptr", "u8"], // IF_CONST cond, idxA, B, label, n
  0x1c: ["u16", "i16", "ptr"], // RATE_LIMIT_CONST nFrames, idx, label
  0x23: ["i16"], // INIT_RNG idx
  0x24: ["i16", "u16", "u16"], // RAND idx, min, limit
  0x25: [], // LOCK
  0x26: [], // UNLOCK
  0x27: ["u8", "u8"], // RAISE code, size
  0x28: ["i16", "i16"], // SET_INDIRECT idxA, idxB
  0x29: ["i16", "i16"], // GET_INDIRECT idxA, idxB
  0x2b: ["i16"], // POLL_LOADED idx
  0x2c: ["i16"], // PUSH_REFERENCE idx
  0x2d: ["u8", "ptr"], // CALL_NATIVE bank, ptr
  0x31: ["i16"], // ACTOR_ACTIVATE actor
  0x33: ["i16"], // ACTOR_DEACTIVATE actor
  0x35: ["i16"], // ACTOR_SET_POS idx
  0x3a: ["i16"], // ACTOR_GET_POS idx
  0x51: ["u8"], // SET_SPRITES_VISIBLE mode
  0x54: ["u8", "i16"], // INPUT_GET joyid, idx
  0x76: ["i16", "i16", "i16"], // MEMSET idx, value, count
  0x77: ["i16", "i16", "i16"], // MEMCPY idxA, idxB, count
};

export const GBA_OP_STOP = 0x00;

export type GbaItem =
  | { kind: "label"; name: string }
  | { kind: "op"; op: number; operands: (number | { label: string })[] }
  | { kind: "stop" }
  | { kind: "rpn"; bytes: number[] }; // raw RPN stream incl. terminator (pre-encoded for now)

export interface GbaReloc {
  at: number; // byte offset of the 4-byte field to patch
  target: number; // byte offset of the target label within the blob
}

export interface GbaProgram {
  bytes: number[];
  relocations: GbaReloc[];
}

const operandSize = (t: GbaOperandType): number =>
  t === "u8" || t === "i8" ? 1 : t === "ptr" ? 4 : 2;

const opByteSize = (types: GbaOperandType[]): number =>
  1 + types.reduce((n, t) => n + operandSize(t), 0);

function itemSize(item: GbaItem): number {
  switch (item.kind) {
    case "label":
      return 0;
    case "stop":
      return 1;
    case "rpn":
      return 1 + item.bytes.length; // 0x15 opcode + stream
    case "op": {
      const spec = GBA_OPCODE_SPECS[item.op];
      if (!spec) {
        throw new Error(`No GBA encoding for opcode 0x${item.op.toString(16)}`);
      }
      return opByteSize(spec);
    }
  }
}

/**
 * Encode an opcode stream into gbavm bytes + a relocation table.
 * Two passes: resolve label byte-offsets, then emit bytes and relocations.
 */
export function emitGbaBytecode(items: GbaItem[]): GbaProgram {
  const labelOffsets = new Map<string, number>();
  let offset = 0;
  for (const item of items) {
    if (item.kind === "label") {
      if (labelOffsets.has(item.name)) {
        throw new Error(`Duplicate label ${item.name}`);
      }
      labelOffsets.set(item.name, offset);
    }
    offset += itemSize(item);
  }

  const bytes: number[] = [];
  const relocations: GbaReloc[] = [];
  const push8 = (v: number) => bytes.push(v & 0xff);
  const push16 = (v: number) => {
    bytes.push(v & 0xff);
    bytes.push((v >> 8) & 0xff);
  };
  const push32placeholder = () => {
    for (let i = 0; i < 4; i++) bytes.push(0);
  };

  for (const item of items) {
    if (item.kind === "label") continue;
    if (item.kind === "stop") {
      push8(GBA_OP_STOP);
      continue;
    }
    if (item.kind === "rpn") {
      push8(0x15);
      for (const b of item.bytes) push8(b);
      continue;
    }
    const spec = GBA_OPCODE_SPECS[item.op];
    if (!spec) throw new Error(`No GBA encoding for opcode 0x${item.op.toString(16)}`);
    push8(item.op);
    spec.forEach((t, i) => {
      const operand = item.operands[i];
      if (t === "ptr") {
        if (typeof operand !== "object" || !("label" in operand)) {
          throw new Error(
            `Opcode 0x${item.op.toString(16)} operand ${i} must be a {label}`,
          );
        }
        const target = labelOffsets.get(operand.label);
        if (target === undefined) {
          throw new Error(`Unknown label "${operand.label}"`);
        }
        relocations.push({ at: bytes.length, target });
        push32placeholder();
      } else {
        if (typeof operand !== "number") {
          throw new Error(
            `Opcode 0x${item.op.toString(16)} operand ${i} must be a number`,
          );
        }
        if (t === "u8" || t === "i8") push8(operand);
        else push16(operand);
      }
    });
  }

  return { bytes, relocations };
}

/** Format an emitted program as C source for the gbavm build (used in M2). */
export function formatGbaProgramC(name: string, program: GbaProgram): string {
  const hex = program.bytes.map((b) => `0x${b.toString(16).padStart(2, "0")}`);
  const rows: string[] = [];
  for (let i = 0; i < hex.length; i += 12) {
    rows.push("    " + hex.slice(i, i + 12).join(", ") + ",");
  }
  const relocs = program.relocations
    .map((r) => `    { ${r.at}, ${r.target} },`)
    .join("\n");
  return [
    "// Generated by GBA Studio - gbavm bytecode + relocation table.",
    `const unsigned char ${name}[] = {`,
    ...rows,
    "};",
    `const unsigned int ${name}_len = ${program.bytes.length};`,
    `// {field_offset, target_offset}: engine sets *(const void**)(${name}+field) = ${name}+target at load.`,
    `const struct { unsigned short at; unsigned short target; } ${name}_relocs[] = {`,
    relocs,
    "};",
    `const unsigned int ${name}_relocs_len = ${program.relocations.length};`,
  ].join("\n");
}

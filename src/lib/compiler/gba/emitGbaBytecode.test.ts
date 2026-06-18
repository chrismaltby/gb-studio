import { emitGbaBytecode, GbaItem } from "./emitGbaBytecode";

describe("emitGbaBytecode", () => {
  test("encodes SET_CONST operands little-endian (matches gbavm VM_STEP)", () => {
    const { bytes, relocations } = emitGbaBytecode([
      { kind: "op", op: 0x14, operands: [1, 0] }, // SET_CONST g1 = 0
      { kind: "op", op: 0x14, operands: [2, 0x0780] }, // SET_CONST g2 = 0x0780
      { kind: "stop" },
    ]);
    expect(bytes).toEqual([
      0x14, 0x01, 0x00, 0x00, 0x00, // idx=1 (LE), val=0x0000 (LE)
      0x14, 0x02, 0x00, 0x80, 0x07, // idx=2 (LE), val=0x0780 (LE)
      0x00, // STOP
    ]);
    expect(relocations).toEqual([]);
  });

  test("encodes negative (stack-relative) i16 operands as two's-complement LE", () => {
    const { bytes } = emitGbaBytecode([
      { kind: "op", op: 0x13, operands: [-1, 0] }, // SET .ARG0(-1), g0
    ]);
    expect(bytes).toEqual([0x13, 0xff, 0xff, 0x00, 0x00]); // -1 => 0xFFFF LE
  });

  test("resolves a jump/if label to a 32-bit relocation at the right offset", () => {
    const items: GbaItem[] = [
      { kind: "label", name: "loop" }, // byte offset 0
      { kind: "op", op: 0x35, operands: [1] }, // ACTOR_SET_POS g1  -> bytes 0..2
      // IF_CONST cond=LT(2), idxA=g0(0), B=10, -> loop, n=0   (op at offset 3)
      { kind: "op", op: 0x1a, operands: [2, 0, 10, { label: "loop" }, 0] },
      { kind: "stop" },
    ];
    const { bytes, relocations } = emitGbaBytecode(items);

    // ACTOR_SET_POS g1
    expect(bytes.slice(0, 3)).toEqual([0x35, 0x01, 0x00]);
    // IF_CONST: op, cond, idxA(2), B(2), ptr(4 placeholder), n
    expect(bytes[3]).toBe(0x1a);
    expect(bytes[4]).toBe(0x02); // condition
    expect(bytes.slice(5, 7)).toEqual([0x00, 0x00]); // idxA = 0
    expect(bytes.slice(7, 9)).toEqual([0x0a, 0x00]); // B = 10 (LE)
    expect(bytes.slice(9, 13)).toEqual([0x00, 0x00, 0x00, 0x00]); // ptr placeholder
    expect(bytes[13]).toBe(0x00); // n
    expect(bytes[14]).toBe(0x00); // STOP
    // The 4-byte ptr field at offset 9 must be relocated to "loop" (offset 0).
    expect(relocations).toEqual([{ at: 9, target: 0 }]);
  });

  test("throws clearly on an unsupported opcode", () => {
    expect(() =>
      emitGbaBytecode([{ kind: "op", op: 0x41, operands: [0] }]), // DISPLAY_TEXT (not yet ported)
    ).toThrow(/No GBA encoding for opcode 0x41/);
  });
});

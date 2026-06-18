import { parseGbvmAsm } from "./parseGbvmAsm";
import { emitGbaBytecode } from "./emitGbaBytecode";

// The exact scene-init assembly GB Studio emits for a one-actor scene whose on-init
// script is [Activate Actor, Set Position]. Kept verbatim so the test tracks the
// real codegen, not a hand-massaged copy.
const SCENE_INIT = `
.module scene_test_init
.include "vm.i"
.globl _fade_frames_per_step
.area _CODE_255
.LOCAL_ACTOR = -4
_scene_test_init::
        VM_LOCK
        VM_RESERVE              4
        ; Set Sprite Mode: 8x16
        VM_SET_SPRITE_MODE      .MODE_8X16
        ; Actor Activate
        VM_SET_CONST            .LOCAL_ACTOR, 1
        VM_ACTOR_ACTIVATE       .LOCAL_ACTOR
        ; Actor Set Position
        VM_RPN
            .R_INT16    3840
            .R_REF_SET  ^/(.LOCAL_ACTOR + 1)/
            .R_INT16    2560
            .R_REF_SET  ^/(.LOCAL_ACTOR + 2)/
            .R_STOP
        VM_SET_CONST            .LOCAL_ACTOR, 1
        VM_ACTOR_SET_POS        .LOCAL_ACTOR
        VM_IDLE
        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1
        VM_STOP
`;

describe("parseGbvmAsm", () => {
  test("parses a real scene-init script into gbavm opcodes", () => {
    const { items, skipped } = parseGbvmAsm(SCENE_INIT);

    // Drop labels for op-level comparison (the entry label carries no bytes).
    const ops = items.filter((i) => i.kind !== "label");

    expect(ops).toEqual([
      { kind: "op", op: 0x25, operands: [] }, // VM_LOCK
      { kind: "op", op: 0x12, operands: [4] }, // VM_RESERVE 4
      { kind: "op", op: 0x5d, operands: [1] }, // VM_SET_SPRITE_MODE .MODE_8X16
      { kind: "op", op: 0x14, operands: [-4, 1] }, // VM_SET_CONST .LOCAL_ACTOR, 1
      { kind: "op", op: 0x31, operands: [-4] }, // VM_ACTOR_ACTIVATE
      // VM_RPN: INT16 3840; REF_SET -3; INT16 2560; REF_SET -2; STOP
      {
        kind: "rpn",
        bytes: [
          0xfe, 0x00, 0x0f, // INT16 3840
          0xfb, 0xfd, 0xff, // REF_SET (-4+1 = -3)
          0xfe, 0x00, 0x0a, // INT16 2560
          0xfb, 0xfe, 0xff, // REF_SET (-4+2 = -2)
          0x00, // STOP
        ],
      },
      { kind: "op", op: 0x14, operands: [-4, 1] }, // VM_SET_CONST
      { kind: "op", op: 0x35, operands: [-4] }, // VM_ACTOR_SET_POS
      { kind: "op", op: 0x18, operands: [] }, // VM_IDLE
      { kind: "op", op: 0x57, operands: [2] }, // VM_FADE_IN -> VM_FADE (no-op)
      { kind: "stop" }, // VM_STOP
    ]);

    // The engine-symbol write is intentionally dropped, and reported.
    expect(skipped).toEqual(["VM_SET_CONST_INT8 _fade_frames_per_step, 1"]);
  });

  test("the parsed stream round-trips through the emitter", () => {
    const { items } = parseGbvmAsm(SCENE_INIT);
    const { bytes, relocations } = emitGbaBytecode(items);
    expect(bytes.length).toBeGreaterThan(0);
    expect(relocations).toEqual([]); // no code targets in this script
    expect(bytes[bytes.length - 1]).toBe(0x00); // ends at VM_STOP
  });

  test("throws on an unknown macro rather than dropping it silently", () => {
    expect(() => parseGbvmAsm("        VM_TOTALLY_MADE_UP 1, 2\n")).toThrow(
      /Unsupported GBVM macro "VM_TOTALLY_MADE_UP"/,
    );
  });

  test("evaluates SDCC expression wrappers and named constants", () => {
    const { items } = parseGbvmAsm(
      `.FOO = 10\n        VM_SET_CONST ^/(.FOO + 2)/, .MODE_8X16\n`,
    );
    expect(items).toEqual([{ kind: "op", op: 0x14, operands: [12, 1] }]);
  });
});

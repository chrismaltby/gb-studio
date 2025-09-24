import path from "path";
import { readFile } from "fs-extra";
import {
  anonymizeGBVMScript,
  gbvmScriptChecksum,
} from "lib/compiler/gbvm/buildHelpers";

describe("anonymizeGBVMScript", () => {
  it("should remove symbol from gbvm script", () => {
    const input = `.module scene_1_init

.include "vm.i"
.include "data/game_globals.i"

.globl _fade_frames_per_step

.area _CODE_255


___bank_scene_1_init = 255
.globl ___bank_scene_1_init

_scene_1_init::
        VM_LOCK

        ; Wait 1 Frames
        VM_IDLE

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "hello world"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`;
    expect(anonymizeGBVMScript(input)).toEqual(`.module SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl _fade_frames_per_step

.area _CODE_255


___bank_SCRIPT = 255
.globl ___bank_SCRIPT

_SCRIPT::
        VM_LOCK

        ; Wait 1 Frames
        VM_IDLE

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "hello world"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
  });

  it("should keep other symbols while anonymizing gbvm script", () => {
    const input = `.module scene_1_init

.include "vm.i"
.include "data/game_globals.i"

.globl _fade_frames_per_step

.area _CODE_255


___bank_scene_1_init = 255
.globl ___bank_scene_1_init
___bank_scene_2_init = 255
.globl ___bank_scene_2_init

_scene_1_init::
        VM_LOCK

        ; Wait 1 Frames
        VM_IDLE

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "hello world"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`;
    const output = anonymizeGBVMScript(input);
    expect(output).toContain("scene_2_init");
    expect(output).not.toContain("scene_1_init");
  });

  it("should give equal output for functionally identical scripts", async () => {
    const input1 = await readFile(
      path.resolve(__dirname, "_files/data/script_input_953.s"),
      "utf8",
    );
    const input2 = await readFile(
      path.resolve(__dirname, "_files/data/script_input_954.s"),
      "utf8",
    );

    const output1 = anonymizeGBVMScript(input1);
    const output2 = anonymizeGBVMScript(input2);
    expect(output1).toEqual(output2);
  });

  it("should give equal output for functionally more identical scripts", async () => {
    const input1 = await readFile(
      path.resolve(__dirname, "_files/data/script_timer_40.s"),
      "utf8",
    );
    const input2 = await readFile(
      path.resolve(__dirname, "_files/data/script_timer_54.s"),
      "utf8",
    );

    const output1 = anonymizeGBVMScript(input1);
    const output2 = anonymizeGBVMScript(input2);
    expect(output1).toEqual(output2);
  });
});

describe("gbvmScriptChecksum", () => {
  it("should generate the same hashes for functionally identical scripts", () => {
    const input = `.module scene_1_init
  
  .include "vm.i"
  .include "data/game_globals.i"
  
  .globl _fade_frames_per_step
  
  .area _CODE_255
  
  
  ___bank_scene_1_init = 255
  .globl ___bank_scene_1_init
  
  _scene_1_init::
          VM_LOCK
  
          ; Wait 1 Frames
          VM_IDLE
  
          ; Fade In
          VM_SET_CONST_INT8       _fade_frames_per_step, 1
          VM_FADE_IN              1
  
          ; Text Dialogue
          VM_LOAD_TEXT            0
          .asciz "hello world"
          VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
          VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
          VM_DISPLAY_TEXT
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
          VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/
  
          ; Stop Script
          VM_STOP
  `;
    const input2 = `.module scene_2_init
  
  .include "vm.i"
  .include "data/game_globals.i"
  
  .globl _fade_frames_per_step
  
  .area _CODE_255
  
  
  ___bank_scene_2_init = 255
  .globl ___bank_scene_2_init
  
  _scene_2_init::
          VM_LOCK
  
          ; Wait 1 Frames
          VM_IDLE
  
          ; Fade In
          VM_SET_CONST_INT8       _fade_frames_per_step, 1
          VM_FADE_IN              1
  
          ; Text Dialogue
          VM_LOAD_TEXT            0
          .asciz "hello world"
          VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
          VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
          VM_DISPLAY_TEXT
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
          VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/
  
          ; Stop Script
          VM_STOP
  `;
    const hash1 = gbvmScriptChecksum(input);
    const hash2 = gbvmScriptChecksum(input2);

    expect(hash1).toEqual(hash2);
    expect(hash1).toBeTruthy();
  });

  it("should generate different hashes for functionally different scripts", () => {
    // Dialogue differs "hello world" vs "hello world!"
    const input = `.module scene_1_init
  
  .include "vm.i"
  .include "data/game_globals.i"
  
  .globl _fade_frames_per_step
  
  .area _CODE_255
  
  
  ___bank_scene_1_init = 255
  .globl ___bank_scene_1_init
  
  _scene_1_init::
          VM_LOCK
  
          ; Wait 1 Frames
          VM_IDLE
  
          ; Fade In
          VM_SET_CONST_INT8       _fade_frames_per_step, 1
          VM_FADE_IN              1
  
          ; Text Dialogue
          VM_LOAD_TEXT            0
          .asciz "hello world"
          VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
          VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
          VM_DISPLAY_TEXT
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
          VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/
  
          ; Stop Script
          VM_STOP
  `;
    const input2 = `.module scene_2_init
  
  .include "vm.i"
  .include "data/game_globals.i"
  
  .globl _fade_frames_per_step
  
  .area _CODE_255
  
  
  ___bank_scene_2_init = 255
  .globl ___bank_scene_2_init
  
  _scene_2_init::
          VM_LOCK
  
          ; Wait 1 Frames
          VM_IDLE
  
          ; Fade In
          VM_SET_CONST_INT8       _fade_frames_per_step, 1
          VM_FADE_IN              1
  
          ; Text Dialogue
          VM_LOAD_TEXT            0
          .asciz "hello world!"
          VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
          VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
          VM_DISPLAY_TEXT
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
          VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
          VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/
  
          ; Stop Script
          VM_STOP
  `;
    const hash1 = gbvmScriptChecksum(input);
    const hash2 = gbvmScriptChecksum(input2);

    expect(hash1).not.toEqual(hash2);
    expect(hash1).toBeTruthy();
    expect(hash2).toBeTruthy();
  });
});

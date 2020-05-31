#include "Input.h"

#include "ScriptRunner.h"

UBYTE joy;
UBYTE last_joy;
UBYTE await_input;
BankPtr input_script_ptrs[NUM_INPUTS] = {{0}};

void HandleInputScripts() {
  UBYTE input_index, input_joy;

  if (!script_ctxs[0].script_ptr_bank && joy != 0 && joy != last_joy) {
    input_index = 0;
    input_joy = joy;
    for (input_index = 0; input_index != 8; ++input_index) {
      if (input_joy & 1) {
        if (input_script_ptrs[input_index].bank) {
          last_joy = joy;
          ScriptStartBg(&input_script_ptrs[input_index], 255);
          return;
        }
      }
      input_joy = input_joy >> 1;
    }
  }
}

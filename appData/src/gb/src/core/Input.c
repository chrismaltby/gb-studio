#include "Input.h"

#include "ScriptRunner.h"

UBYTE joy;
UBYTE last_joy;
UBYTE recent_joy;
UBYTE await_input;
UBYTE input_wait;
BankPtr input_script_ptrs[NUM_INPUTS] = {{0}};
UBYTE input_script_persist;
UBYTE input_override_default;

void HandleInputScripts() {
  UBYTE input_index, input_joy;

  if (input_wait != 0) {
    input_wait--;
    return;
  }

  if (!script_ctxs[0].script_ptr_bank && joy != 0 && joy != last_joy) {
    input_index = 0;
    input_joy = joy;
    for (input_index = 0; input_index != 8; ++input_index) {
      if (input_joy & 1) {
        if (input_script_ptrs[input_index].bank) {
          last_joy = joy;
          input_wait = 10;
          ScriptStartBg(&input_script_ptrs[input_index], 255);
          return;
        }
      }
      input_joy = input_joy >> 1;
    }
  }
}

void RemoveInputScripts() {
  UBYTE i;
  for (i = 0; i != 8; ++i) {
    if (!GET_BIT(input_script_persist, i)) {
      input_script_ptrs[i].bank = 0;
    }
  }
}

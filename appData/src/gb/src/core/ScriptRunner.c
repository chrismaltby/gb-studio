#include "ScriptRunner.h"

#include <rand.h>

#include "Actor.h"
#include "BankData.h"
#include "BankManager.h"
#include "FadeManager.h"
#include "UI.h"

UBYTE script_await_next_frame;
UBYTE script_action_complete = TRUE;
UBYTE script_actor;
UBYTE *ptr_div_reg = (UBYTE *)0xFF04;
UBYTE script_ptr_bank = 0;
UBYTE *script_ptr = 0;
UWORD script_ptr_x = 0;
UWORD script_ptr_y = 0;
UBYTE *script_start_ptr = 0;
UBYTE script_cmd_args[6] = {0};
UBYTE script_cmd_args_len;
UBYTE (*script_update_fn)();
UBYTE script_stack_ptr = 0;
UBYTE *script_stack[STACK_SIZE] = {0};
UBYTE *script_start_stack[STACK_SIZE] = {0};

UBYTE ScriptLastFnComplete_b();

void ScriptStart(BankPtr *events_ptr) {
  UBYTE rnd, c, a0, a1, a2;

  LOG("ScriptStart bank=%u offset=%d\n", events_ptr->bank, events_ptr->offset);

  script_ptr_bank = events_ptr->bank;
  script_ptr = ((UBYTE *)bank_data_ptrs[script_ptr_bank]) + events_ptr->offset;
  script_update_fn = FALSE;

  LOG("ScriptStart bank_offset=%d script_ptr=%d\n", ((UBYTE *)bank_data_ptrs[script_ptr_bank]),
      script_ptr);

  PUSH_BANK(script_ptr_bank);
  c = *(script_ptr);
  a0 = *(script_ptr + 1);
  a1 = *(script_ptr + 2);
  a2 = *(script_ptr + 3);
  POP_BANK;

  LOG("SCRIPT VALUE c=%u 0=%u 1=%u 2=%u\n", c, a0, a1, a2);
  UIDebugLog(9, 6, 0);
  UIDebugLog(c, 0, 0);
  UIDebugLog(a0, 1, 0);
  UIDebugLog(a1, 2, 0);
  UIDebugLog(a2, 3, 0);

  rnd = *(ptr_div_reg);
  initrand(rnd);

  script_start_ptr = script_ptr;
}

void ScriptRunnerUpdate() {
  UBYTE *initial_script_ptr;
  UBYTE i, script_cmd_index;
  UBYTE update_complete = FALSE;

  if (script_ptr_bank) {
    LOG("ScriptRunnerUpdate\n");
  }

  script_await_next_frame = FALSE;

  if (!script_action_complete) {
    LOG("Has not script_action_complete\n");
    PUSH_BANK(scriptrunner_bank);
    script_action_complete = ScriptLastFnComplete_b();
    POP_BANK;
  }

  if (script_update_fn) {
    LOG("Has script_update_fn\n");
    PUSH_BANK(scriptrunner_bank);
    // player.pos.x = 0;
    LOG("Has script_update_fn 1\n");

    update_complete = (*script_update_fn)();
    LOG("Has script_update_fn 2 -- %d\n", update_complete);

    // update_complete = TRUE;
    if (update_complete) {
      LOG("Has script_update_fn 3\n");

      script_update_fn = FALSE;
    }
    LOG("Has script_update_fn 4\n");

    POP_BANK;
  }

  if (!script_ptr_bank || !script_action_complete || script_update_fn) {
    // LOG("STOPPED SCRIPT FOR NOW\n");
    return;
  }

  script_cmd_index = ReadBankedUBYTE(script_ptr_bank, script_ptr);

  // LOG("SCRIPT CMD INDEX WAS %u not=%u, zero=%u\n", script_cmd_index, !script_cmd_index,
  // script_cmd_index == 0);

  if (!script_cmd_index) {
    if (script_stack_ptr) {
      // Return from Actor Invocation
      PUSH_BANK(scriptrunner_bank);
      Script_StackPop_b();
      POP_BANK;
      return;
    }
    LOG("SCRIPT FINISHED\n");
    script_ptr_bank = 0;
    script_ptr = 0;
    return;
  }

  PUSH_BANK(scriptrunner_bank);
  script_cmd_args_len = script_cmds[script_cmd_index].args_len;
  POP_BANK;

  // script_cmd_fn = script_cmds[script_cmd_index].fn;

  LOG("SCRIPT cmd [%u - %u] = %u (%u)\n", script_ptr_bank, script_ptr, script_cmd_index,
      script_cmd_args_len);

  for (i = 0; i != script_cmd_args_len; i++) {
    script_cmd_args[i] = ReadBankedUBYTE(script_ptr_bank, script_ptr + i + 1);
    LOG("SCRIPT ARG-%u = %u\n", i, script_cmd_args[i]);
  }

  PUSH_BANK(scriptrunner_bank);
  initial_script_ptr = script_ptr;
  script_cmds[script_cmd_index].fn();
  if (initial_script_ptr == script_ptr) {
    // Increment script_ptr unless already modified by script_cmd
    script_ptr += 1 + script_cmd_args_len;
  }
  POP_BANK;

  LOG("script_await_next_frame = %u script_update_fn = %d\n", script_await_next_frame,
      script_update_fn);

  if (!script_await_next_frame && !script_update_fn) {
    LOG("CONTINUE!\n");
    ScriptRunnerUpdate();
  }
}

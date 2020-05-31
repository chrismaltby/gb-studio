#include "ScriptRunner.h"


#include "Actor.h"
#include "BankData.h"
#include "BankManager.h"
#include "FadeManager.h"
#include "GameTime.h"
#include "Input.h"
#include "UI.h"
#include "Math.h"

// UBYTE script_await_next_frame;
UBYTE script_actor;
// UBYTE script_ptr_bank = 0;
// UBYTE *script_ptr = 0;
UWORD script_ptr_x = 0;
UWORD script_ptr_y = 0;
UBYTE *script_start_ptr = 0;
UBYTE script_cmd_args[7] = {0};
UBYTE script_cmd_args_len;
UBYTE (*script_update_fn)();
UBYTE script_stack_ptr = 0;
UBYTE *script_stack[STACK_SIZE] = {0};
UBYTE script_bank_stack[STACK_SIZE] = {0};
UBYTE *script_start_stack[STACK_SIZE] = {0};
ScriptContext script_ctxs[MAX_SCRIPT_CONTEXTS] = {0};
ScriptContext *current_script_ctx;
ScriptContext *main_script_ctx;
UBYTE timer_script_duration = 0;
UBYTE timer_script_time = 0;
BankPtr timer_script_ptr = {0};
UBYTE script_complete = FALSE;

void ScriptTimerUpdate_b();

void ScriptStart(BankPtr *events_ptr) {
  SeedRand();

  current_script_ctx = &script_ctxs[0];
  main_script_ctx = &script_ctxs[0];

  // // Stop all actor movement
  // for (i = 0; i != actors_active_size; i++) {
  //   a = actors_active[i];
  //   actors[a].moving = FALSE;
  // }

  LOG("ScriptStart bank=%u offset=%d\n", events_ptr->bank, events_ptr->offset);


  main_script_ctx->script_ptr_bank = events_ptr->bank;
  main_script_ctx->script_ptr = (BankDataPtr(main_script_ctx->script_ptr_bank)) + events_ptr->offset;
  main_script_ctx->script_update_fn = FALSE;
  main_script_ctx->script_start_ptr = main_script_ctx->script_ptr;
  // script_ptr_bank = events_ptr->bank;
  // script_ptr = (BankDataPtr(script_ptr_bank)) + events_ptr->offset;
  // script_update_fn = FALSE;


  // script_start_ptr = script_ptr;
}

/*
void ScriptStartBg(BankPtr *events_ptr) {
  // Run in background context
}
*/

void ScriptRunnerUpdate() {
  UBYTE *initial_script_ptr;
  UBYTE i, script_cmd_index;
  UBYTE update_complete = FALSE;

  current_script_ctx->script_await_next_frame = FALSE;

  if (current_script_ctx->script_update_fn) {
    LOG("Has script_update_fn\n");
    PUSH_BANK(SCRIPT_RUNNER_BANK);
    // player.pos.x = 0;
    LOG("Has script_update_fn 1\n");

    update_complete = (*(current_script_ctx->script_update_fn))();
    LOG("Has script_update_fn 2 -- %d\n", update_complete);

    // update_complete = TRUE;
    if (update_complete) {
      LOG("Has script_update_fn 3\n");

      current_script_ctx->script_update_fn = FALSE;
    }
    LOG("Has script_update_fn 4\n");

    POP_BANK;
  }

  if (!current_script_ctx->script_ptr_bank || current_script_ctx->script_update_fn) {
    // LOG("STOPPED SCRIPT FOR NOW\n");
    return;
  }

  script_cmd_index = ReadBankedUBYTE(current_script_ctx->script_ptr_bank, current_script_ctx->script_ptr);

  if (!script_cmd_index) {
    if (script_stack_ptr) {
      // Return from Actor Invocation
      PUSH_BANK(SCRIPT_RUNNER_BANK);
      Script_StackPop_b();
      POP_BANK;
      return;
    }
    LOG("SCRIPT FINISHED\n");
    current_script_ctx->script_ptr_bank = 0;
    current_script_ctx->script_ptr = 0;
    current_script_ctx->script_actor = 0;
    script_complete = TRUE;
    return;
  }

  PUSH_BANK(SCRIPT_RUNNER_BANK);
  script_cmd_args_len = script_cmds[script_cmd_index].args_len;
  POP_BANK;

  // script_cmd_fn = script_cmds[script_cmd_index].fn;

  // LOG("SCRIPT cmd [%u - %u] = %u (%u)\n", script_ptr_bank, script_ptr, script_cmd_index,
  //     script_cmd_args_len);

  for (i = 0; i != script_cmd_args_len; i++) {
    script_cmd_args[i] = ReadBankedUBYTE(current_script_ctx->script_ptr_bank, current_script_ctx->script_ptr + i + 1);
    // LOG("SCRIPT ARG-%u = %u\n", i, script_cmd_args[i]);
  }

  PUSH_BANK(SCRIPT_RUNNER_BANK);
  initial_script_ptr = current_script_ctx->script_ptr;
  script_cmds[script_cmd_index].fn();
  if (initial_script_ptr == current_script_ctx->script_ptr) {
    // Increment script_ptr unless already modified by script_cmd (e.g by conditional/jump)
    current_script_ctx->script_ptr += 1 + script_cmd_args_len;
  }
  POP_BANK;

  // LOG("script_await_next_frame = %u script_update_fn = %d\n", script_await_next_frame,
  //     script_update_fn);

  if (!current_script_ctx->script_await_next_frame && !current_script_ctx->script_update_fn) {
    LOG("CONTINUE!\n");
    ScriptRunnerUpdate();
  }
}

void ScriptTimerUpdate() {
  PUSH_BANK(SCRIPT_RUNNER_BANK);
  ScriptTimerUpdate_b();
  POP_BANK;
}

#include "ScriptRunner.h"

#include "Actor.h"
#include "BankData.h"
#include "BankManager.h"
#include "FadeManager.h"
#include "GameTime.h"
#include "Input.h"
#include "Math.h"
#include "UI.h"
#include "data_ptrs.h"
#include <string.h>
#include <gb/bgb_emu.h>

DECLARE_STACK(script_ctx_pool, MAX_BG_SCRIPT_CONTEXTS);
ScriptContext main_script_ctx;
UBYTE script_main_ctx_actor;
UBYTE script_cmd_args[7] = {0};
UBYTE script_cmd_args_len;
UBYTE script_stack_ptr = 0;
UBYTE* script_stack[STACK_SIZE] = {0};
UBYTE script_bank_stack[STACK_SIZE] = {0};
UBYTE* script_start_stack[STACK_SIZE] = {0};
ScriptContext script_ctxs[MAX_SCRIPT_CONTEXTS] = {{0}};
UBYTE current_script_ctx = 0;
ScriptContext* script_ctx_ptr;
UBYTE timer_script_duration = 0;
UBYTE timer_script_time = 0;
BankPtr timer_script_ptr = {0};
UBYTE ctx_cmd_remaining = 5;

void ScriptTimerUpdate_b();

void ScriptRunnerInit() {
  ScriptCtxPoolReset();
}

void ScriptStart(BankPtr* events_ptr) {
  SeedRand();

  PlayerStopMovement();

  script_variables[TMP_VAR_1] = 0;
  script_variables[TMP_VAR_2] = 0;

  script_ctxs[0].script_ptr_bank = events_ptr->bank;
  script_ctxs[0].script_ptr = (BankDataPtr(script_ctxs[0].script_ptr_bank)) + events_ptr->offset;
  script_ctxs[0].script_update_fn = FALSE;
  script_ctxs[0].script_start_ptr = script_ctxs[0].script_ptr;
}

UBYTE ScriptStartBg(BankPtr* events_ptr, UBYTE owner) {
  UWORD new_ctx = 0;

  SeedRand();

  // Run in background context
  new_ctx = ScriptCtxPoolNext();

  if (new_ctx != 0) {
    script_variables[TMP_VAR_1] = 0;
    script_variables[TMP_VAR_2] = 0;

    script_ctxs[new_ctx].owner = 0;  // @wtf
    script_ctxs[new_ctx].script_ptr_bank = events_ptr->bank;
    script_ctxs[new_ctx].script_ptr =
        (BankDataPtr(script_ctxs[new_ctx].script_ptr_bank)) + events_ptr->offset;
    script_ctxs[new_ctx].script_update_fn = FALSE;
    script_ctxs[new_ctx].script_start_ptr = script_ctxs[new_ctx].script_ptr;
    script_ctxs[new_ctx].owner = owner;

    ScriptRestoreCtx(new_ctx);

    return new_ctx;
  }

  return new_ctx;
}

void ScriptRunnerUpdate() {
  UBYTE* initial_script_ptr;
  UBYTE i, script_cmd_index;
  UBYTE update_complete = FALSE;

  main_script_ctx.script_await_next_frame = FALSE;

  if (main_script_ctx.script_update_fn) {
    
    PUSH_BANK(SCRIPT_RUNNER_BANK);
    
    update_complete = (*(main_script_ctx.script_update_fn))();
    
    if (update_complete) {
      main_script_ctx.script_update_fn = FALSE;
    }
    POP_BANK;
  }

  if (!main_script_ctx.script_ptr_bank || main_script_ctx.script_update_fn) {
    ScriptSaveCtx();
    main_script_ctx.script_ptr = 0;
    return;
  }

  script_cmd_index = ReadBankedUBYTE(main_script_ctx.script_ptr_bank, main_script_ctx.script_ptr);

  if (!script_cmd_index) {
    if (script_stack_ptr) {
      // Return from Actor Invocation
      PUSH_BANK(SCRIPT_RUNNER_BANK);
      Script_StackPop_b();
      POP_BANK;
      ScriptSaveCtx();
      main_script_ctx.script_ptr = 0;
      return;
    }
    
    main_script_ctx.script_ptr_bank = 0;
    main_script_ctx.script_ptr = 0;
    main_script_ctx.script_actor = 0;
    ScriptSaveCtx();
    if (current_script_ctx != 0) {
      ScriptCtxPoolReturn(current_script_ctx, script_ctxs[current_script_ctx].owner);
    } else {
      script_main_ctx_actor = 0;
    }
    return;
  }

  // Fetch script_cmd_args using inlined MemcpyBanked
  PUSH_BANK(main_script_ctx.script_ptr_bank);
  memcpy(script_cmd_args, main_script_ctx.script_ptr + 1, 7);
  POP_BANK;

  PUSH_BANK(SCRIPT_RUNNER_BANK);
  initial_script_ptr = main_script_ctx.script_ptr;
  script_cmd_args_len = script_cmds[script_cmd_index].args_len;
  script_cmds[script_cmd_index].fn();
  if (initial_script_ptr == main_script_ctx.script_ptr) {
    // Increment script_ptr unless already modified by script_cmd (e.g by conditional/jump)
    main_script_ctx.script_ptr += 1 + script_cmd_args_len;
  }
  POP_BANK;

  if (!main_script_ctx.script_await_next_frame && !main_script_ctx.script_update_fn && ctx_cmd_remaining != 0) {    
    ctx_cmd_remaining--;
    ScriptRunnerUpdate();
    return;
  }

  ScriptSaveCtx();
}

void ScriptTimerUpdate() {
  PUSH_BANK(SCRIPT_RUNNER_BANK);
  ScriptTimerUpdate_b();
  POP_BANK;
}

// ScriptSaveCTX:496

void ScriptSaveCtx() {
  //BGB_PROFILE_BEGIN();
  // store current struct pointer as index mult was slow
  script_ctx_ptr = &script_ctxs[current_script_ctx];

  // Copy main context into store
  memcpy(script_ctx_ptr, &main_script_ctx, sizeof(ScriptContext)-3);
  (*script_ctx_ptr).tmp_1 = script_variables[TMP_VAR_1];
  (*script_ctx_ptr).tmp_2 = script_variables[TMP_VAR_2];

  //BGB_PROFILE_END(ScriptSaveCTX);
}

void ScriptRestoreCtx(UBYTE i) {
  if (!script_ctxs[i].script_ptr_bank || (i != 0 && script_ctxs[0].script_ptr_bank)) {
    return;
  }
  //BGB_PROFILE_BEGIN();  
  if (i == 0) {
    ctx_cmd_remaining = 255;
  } else {
    ctx_cmd_remaining = 2;
  }
  current_script_ctx = i;

  // Copy stored context into main context
  memcpy(&main_script_ctx, &script_ctxs[i], sizeof(ScriptContext)-3);
  script_variables[TMP_VAR_1] = script_ctxs[i].tmp_1;
  script_variables[TMP_VAR_2] = script_ctxs[i].tmp_2;

  //BGB_PROFILE_END(RESTORECTX);

  ScriptRunnerUpdate();
}

UINT8 ScriptCtxPoolNext() {
  UINT8 next;
  if (StackSize(script_ctx_pool)) {
    next = StackPop(script_ctx_pool);
    return next;
  }
  return 0;
}

void ScriptCtxPoolReturn(UINT8 ctx, UBYTE owner) {
  // Make sure ctx is still owned by this entity
  // i.e. script didn't finish and was released
  // before actor went offscreen
  if (script_ctxs[ctx].owner == owner) {
    script_ctxs[ctx].script_ptr_bank = 0;
    StackPush(script_ctx_pool, ctx);
  }
}

void ScriptCtxPoolReset() {
  UBYTE i;
  for (i = 1; i != MAX_BG_SCRIPT_CONTEXTS + 1; i++) {
    script_ctx_pool[i] = i;
    script_ctxs[i].script_ptr_bank = 0;
  }
  script_ctx_pool[0] = MAX_BG_SCRIPT_CONTEXTS;
}

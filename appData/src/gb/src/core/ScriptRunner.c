#include "ScriptRunner.h"
#include "BankData.h"
#include "BankManager.h"
#include "UI.h"
#include "FadeManager.h"
#include "Actor.h"
#include <rand.h>

UBYTE script_await_next_frame;
UBYTE script_action_complete = TRUE;
UBYTE script_actor;
UBYTE scene_stack_ptr = 0;
SCENE_STATE scene_stack[MAX_SCENE_STATES] = {{0}};
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

SCRIPT_CMD script_cmds[] = {
    {Script_End_b, 0},                 // 0x00
    {Script_Text_b, 2},                // 0x01
    {Script_Goto_b, 2},                // 0x02
    {Script_IfFlag_b, 4},              // 0x03
    {Script_Noop_b, 0},                // 0x04
    {Script_SetFlag_b, 2},             // 0x05
    {Script_ClearFlag_b, 2},           // 0x06
    {Script_ActorSetDir_b, 1},         // 0x07
    {Script_ActorActivate_b, 1},       // 0x08
    {Script_CameraMoveTo_b, 3},        // 0x09
    {Script_CameraLock_b, 1},          // 0x0A
    {Script_Wait_b, 1},                // 0x0B
    {Script_FadeOut_b, 1},             // 0x0C
    {Script_FadeIn_b, 1},              // 0x0D
    {Script_LoadScene_b, 6},           // 0x0E
    {Script_ActorSetPos_b, 2},         // 0x0F
    {Script_ActorMoveTo_b, 2},         // 0x10
    {Script_ShowSprites_b, 0},         // 0x11
    {Script_HideSprites_b, 0},         // 0x12
    {Script_PlayerSetSprite_b, 1},     // 0x13
    {Script_ActorShow_b, 0},           // 0x14
    {Script_ActorHide_b, 0},           // 0x15
    {Script_ActorSetEmote_b, 1},       // 0x16
    {Script_CameraShake_b, 1},         // 0x17
    {Script_Noop_b, 0},                // 0x18
    {Script_ShowOverlay_b, 3},         // 0x19
    {Script_HideOverlay_b, 0},         // 0x1A
    {Script_Noop_b, 0},                // 0x1B
    {Script_OverlayMoveTo_b, 3},       // 0x1C
    {Script_AwaitInput_b, 1},          // 0x1D
    {Script_MusicPlay_b, 2},           // 0x1E
    {Script_MusicStop_b, 0},           // 0x1F
    {Script_ResetVariables_b, 0},      // 0x20
    {Script_NextFrame_b, 0},           // 0x21
    {Script_IncFlag_b, 2},             // 0x22
    {Script_DecFlag_b, 2},             // 0x23
    {Script_SetFlagValue_b, 3},        // 0x24
    {Script_IfValue_b, 6},             // 0x25
    {Script_IfInput_b, 3},             // 0x26
    {Script_Choice_b, 4},              // 0x27
    {Script_ActorPush_b, 1},           // 0x28
    {Script_IfActorPos_b, 4},          // 0x29
    {Script_LoadData_b, 0},            // 0x2A
    {Script_SaveData_b, 0},            // 0x2B
    {Script_ClearData_b, 0},           // 0x2C
    {Script_IfSavedData_b, 2},         // 0x2D
    {Script_IfActorDirection_b, 3},    // 0x2E
    {Script_SetFlagRandomValue_b, 4},  // 0x2F
    {Script_ActorGetPos_b, 0},         // 0x30
    {Script_ActorSetPosToVal_b, 0},    // 0x31
    {Script_ActorMoveToVal_b, 0},      // 0x32
    {Script_ActorMoveRel_b, 4},        // 0x33
    {Script_ActorSetPosRel_b, 4},      // 0x34
    {Script_MathAdd_b, 3},             // 0x35
    {Script_MathSub_b, 3},             // 0x36
    {Script_MathMul_b, 3},             // 0x37
    {Script_MathDiv_b, 3},             // 0x38
    {Script_MathMod_b, 3},             // 0x39
    {Script_MathAddVal_b, 0},          // 0x3A
    {Script_MathSubVal_b, 0},          // 0x3B
    {Script_MathMulVal_b, 0},          // 0x3C
    {Script_MathDivVal_b, 0},          // 0x3D
    {Script_MathModVal_b, 0},          // 0x3E
    {Script_CopyVal_b, 0},             // 0x3F
    {Script_IfValueCompare_b, 3},      // 0x40
    {Script_LoadVectors_b, 4},         // 0x41
    {Script_ActorSetMoveSpeed_b, 1},   // 0x42
    {Script_ActorSetAnimSpeed_b, 1},   // 0x43
    {Script_TextSetAnimSpeed_b, 3},    // 0x44
    {Script_ScenePushState_b, 0},      // 0x45
    {Script_ScenePopState_b, 1},       // 0x46
    {Script_ActorInvoke_b, 0},         // 0x47
    {Script_StackPush_b, 0},           // 0x48
    {Script_StackPop_b, 0},            // 0x49
    {Script_SceneResetStack_b, 0},     // 0x4A
    {Script_ScenePopAllState_b, 1},    // 0x4B
    {Script_SetInputScript_b, 4},      // 0x4C
    {Script_RemoveInputScript_b, 1},   // 0x4D
    {Script_ActorSetFrame_b, 1},       // 0x4E
    {Script_ActorSetFlip_b, 1},        // 0x4F
    {Script_TextMulti_b, 1},           // 0x50
    {Script_ActorSetFrameToVal_b, 2},  // 0x51
    {Script_VariableAddFlags_b, 3},    // 0x52
    {Script_VariableClearFlags_b, 3},  // 0x53
    {Script_SoundStartTone_b, 2},      // 0x54
    {Script_SoundStopTone_b, 0},       // 0x55
    {Script_SoundPlayBeep_b, 1},       // 0x56
    {Script_SoundPlayCrash_b, 0},      // 0x57
    {Script_SetTimerScript_b, 4},      // 0x58
    {Script_ResetTimer_b, 0},          // 0x59
    {Script_RemoveTimerScript_b, 0},   // 0x5A
    {Script_TextWithAvatar_b, 3},      // 0x5B
    {Script_TextMenu_b, 6},            // 0x5C
    {Script_ActorSetCollisions_b, 1}   // 0x5D
};

UBYTE ScriptLastFnComplete_b();

void ScriptStart(BankPtr *events_ptr) {
  UBYTE rnd, c, a0, a1, a2;

  LOG("ScriptStart bank=%u offset=%d\n", events_ptr->bank, events_ptr->offset);

  script_ptr_bank = events_ptr->bank;
  script_ptr = ((UBYTE *)bank_data_ptrs[script_ptr_bank]) + events_ptr->offset;

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

  script_cmd_args_len = script_cmds[script_cmd_index].args_len;
  // script_cmd_fn = script_cmds[script_cmd_index].fn;

  LOG("SCRIPT cmd [%u - %u] = %u (%u)\n", script_ptr_bank, script_ptr, script_cmd_index,
      script_cmd_args_len);

  for (i = 0; i != script_cmd_args_len; i++) {
    script_cmd_args[i] = ReadBankedUBYTE(script_ptr_bank, script_ptr + i + 1);
    LOG("SCRIPT ARG-%u = %u\n", i, script_cmd_args[i]);
  }

  PUSH_BANK(scriptrunner_bank);
  script_cmds[script_cmd_index].fn();
  POP_BANK;

  LOG("script_await_next_frame = %u script_update_fn = %d\n", script_await_next_frame,
      script_update_fn);

  if (!script_await_next_frame && !script_update_fn) {
    LOG("CONTINUE!\n");
    ScriptRunnerUpdate();
  }
}

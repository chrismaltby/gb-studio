#pragma bank 4

#include "ScriptRunner.h"
#include "MusicManager.h"
#include "FadeManager.h"
#include "BankData.h"
#include "BankManager.h"
#include "DataManager.h"
#include "UI.h"
#include "Math.h"
#include "Actor.h"
#include "GameTime.h"
#include "Core_Main.h"
#include "Collision.h"
#include "Input.h"
#include "Sprite.h"
#include "Scroll.h"
#include "Camera.h"
#include "data_ptrs.h"
#include "Projectiles.h"
#include "Palette.h"
#include "states/Platform.h"
#include "data_ptrs.h"
#include <rand.h>

#define RAM_START_PTR 0xA000
#define RAM_START_VARS_PTR 0xA0FF

#define EMOTE_SPRITE 124
#define BUBBLE_ANIMATION_FRAMES 15
#define BUBBLE_TOTAL_FRAMES 60

void ScriptHelper_CalcDest();
void ScriptHelper_ClampCamDest();

UBYTE* RAMPtr;
UBYTE scene_stack_ptr = 0;
SCENE_STATE scene_stack[MAX_SCENE_STATES];
UBYTE emote_timer = 0;
UBYTE shake_time = 0;
UBYTE should_shake_x = FALSE;
UBYTE should_shake_y = FALSE;
UBYTE after_lock_camera = FALSE;
Actor* tmp_actor;

const BYTE emote_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0,
                              0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0, 0, 0, 0,
                              0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0, 0, 0};

const SCRIPT_CMD script_cmds[] = {
    {Script_End_b, 0},                 // 0x00
    {Script_Text_b, 3},                // 0x01
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
    {Script_ActorMoveTo_b, 4},         // 0x10
    {Script_ShowSprites_b, 0},         // 0x11
    {Script_HideSprites_b, 0},         // 0x12
    {Script_PlayerSetSprite_b, 3},     // 0x13
    {Script_ActorShow_b, 0},           // 0x14
    {Script_ActorHide_b, 0},           // 0x15
    {Script_ActorSetEmote_b, 1},       // 0x16
    {Script_CameraShake_b, 3},         // 0x17
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
    {Script_Choice_b, 5},              // 0x27
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
    {Script_ActorMoveToVal_b, 2},      // 0x32
    {Script_ActorMoveRel_b, 6},        // 0x33
    {Script_ActorSetPosRel_b, 4},      // 0x34
    {Script_MathAdd_b, 3},             // 0x35
    {Script_MathSub_b, 3},             // 0x36
    {Script_MathMul_b, 3},             // 0x37
    {Script_MathDiv_b, 3},             // 0x38
    {Script_MathMod_b, 3},             // 0x39
    {Script_MathAddVal_b, 1},          // 0x3A
    {Script_MathSubVal_b, 1},          // 0x3B
    {Script_MathMulVal_b, 0},          // 0x3C
    {Script_MathDivVal_b, 0},          // 0x3D
    {Script_MathModVal_b, 0},          // 0x3E
    {Script_CopyVal_b, 0},             // 0x3F
    {Script_IfValueCompare_b, 3},      // 0x40
    {Script_LoadVectors_b, 4},         // 0x41
    {Script_ActorSetMoveSpeed_b, 1},   // 0x42
    {Script_ActorSetAnimSpeed_b, 1},   // 0x43
    {Script_TextSetAnimSpeed_b, 4},    // 0x44
    {Script_ScenePushState_b, 0},      // 0x45
    {Script_ScenePopState_b, 1},       // 0x46
    {Script_ActorInvoke_b, 0},         // 0x47
    {Script_StackPush_b, 0},           // 0x48
    {Script_StackPop_b, 0},            // 0x49
    {Script_SceneResetStack_b, 0},     // 0x4A
    {Script_ScenePopAllState_b, 1},    // 0x4B
    {Script_SetInputScript_b, 5},      // 0x4C
    {Script_RemoveInputScript_b, 1},   // 0x4D
    {Script_ActorSetFrame_b, 1},       // 0x4E
    {Script_ActorSetFlip_b, 1},        // 0x4F
    {Script_TextMulti_b, 1},           // 0x50
    {Script_ActorSetFrameToVal_b, 2},  // 0x51
    {Script_VariableAddFlags_b, 3},    // 0x52
    {Script_VariableClearFlags_b, 3},  // 0x53
    {Script_SoundPlayTone_b, 3},       // 0x54
    {Script_SoundStopTone_b, 0},       // 0x55
    {Script_SoundPlayBeep_b, 1},       // 0x56
    {Script_SoundPlayCrash_b, 0},      // 0x57
    {Script_SetTimerScript_b, 4},      // 0x58
    {Script_ResetTimer_b, 0},          // 0x59
    {Script_RemoveTimerScript_b, 0},   // 0x5A
    {Script_TextWithAvatar_b, 4},      // 0x5B
    {Script_TextMenu_b, 7},            // 0x5C
    {Script_ActorSetCollisions_b, 1},  // 0x5D
    {Script_LaunchProjectile_b, 5},    // 0x5E
    {Script_SetFlagProperty_b, 4},     // 0x5F
    {Script_ActorSetSprite_b, 2},      // 0x60
    {Script_IfActorRelActor_b, 4},     // 0x61
    {Script_PlayerBounce_b, 1},        // 0x62
    {Script_WeaponAttack_b, 3},        // 0x63
    {Script_PalSetBackground_b, 3},    // 0x64
    {Script_PalSetSprite_b, 2},        // 0x65
    {Script_PalSetUI_b, 2},            // 0x66
    {Script_ActorStopUpdate_b, 0},     // 0x67
    {Script_ActorSetAnimate_b, 1},     // 0x68
    {Script_IfColorSupported_b, 2},    // 0x69
    {Script_EngFieldSet_b, 3},         // 0x6A
    {Script_EngFieldSetWord_b, 4},     // 0x6B
    {Script_EngFieldSetVar_b, 4},      // 0x6C
    {Script_EngFieldSetWordVar_b, 6},  // 0x6D
    {Script_EngFieldStore_b, 4},       // 0x6E
    {Script_EngFieldStoreWord_b, 6},   // 0x6F    
};

void ScriptTimerUpdate_b() __banked {
  // Don't update timer while a non-background script is running
  if (script_ctxs[0].script_ptr != 0) {
    return;
  }

  // Check if timer is enabled
  if (timer_script_duration != 0) {
    if (timer_script_time == 0) {
      last_joy = last_joy & 0xF0;

      ScriptStartBg(&timer_script_ptr, 255);

      // Reset the countdown timer
      timer_script_time = timer_script_duration;
    } else {
      // Timer tick every 16 frames
      if ((game_time & 0x0F) == 0x00) {
        --timer_script_time;
      }
    }
  }
}

UBYTE ScriptUpdate_MoveActor() {
  BYTE new_dir_x = 0;
  BYTE new_dir_y = 0;

  tmp_actor = &actors[active_script_ctx.script_actor];

  // Actor reached destination
  if ((*tmp_actor).pos.x == active_script_ctx.actor_move_dest_x &&
      (*tmp_actor).pos.y == active_script_ctx.actor_move_dest_y) {
    (*tmp_actor).moving = FALSE;
    (*tmp_actor).script_control = FALSE;
    if (active_script_ctx.script_actor == 0) {
      pl_vel_x = 0;
      pl_vel_y = 0;
    }
    return TRUE;
  }

  (*tmp_actor).moving = TRUE;

  // Actor not at horizontal destination
  if ( (*tmp_actor).pos.x != active_script_ctx.actor_move_dest_x &&
      (!active_script_ctx.actor_move_type || ((*tmp_actor).pos.y == active_script_ctx.actor_move_dest_y)) ) {
    if (Lt16((*tmp_actor).pos.x, active_script_ctx.actor_move_dest_x)) {
      new_dir_x = 1;
    } else if (Gt16((*tmp_actor).pos.x, active_script_ctx.actor_move_dest_x)) {
      new_dir_x = -1;
    }
  } else {
    // Actor not at vertical destination
    (*tmp_actor).dir.x = 0;
    if (Lt16((*tmp_actor).pos.y, active_script_ctx.actor_move_dest_y)) {
      new_dir_y = 1;
    } else if (Gt16((*tmp_actor).pos.y, active_script_ctx.actor_move_dest_y)) {
      new_dir_y = -1;
    }
  }

  // If changed direction, trigger actor rerender
  if(((*tmp_actor).dir.x != new_dir_x) ||
     ((*tmp_actor).dir.y != new_dir_y) ) {
       (*tmp_actor).rerender = TRUE;
  }

  (*tmp_actor).dir.x = new_dir_x;
  (*tmp_actor).dir.y = new_dir_y;

  // Move actor
  if ((*tmp_actor).move_speed == 0) {
    // Half speed only move every other frame
    if (IS_FRAME_2) {
      (*tmp_actor).pos.x += (WORD)new_dir_x;
      (*tmp_actor).pos.y += (WORD)new_dir_y;
    }
  } else {
    (*tmp_actor).pos.x += (WORD)(new_dir_x * (*tmp_actor).move_speed);
    (*tmp_actor).pos.y += (WORD)(new_dir_y * (*tmp_actor).move_speed);        
  }

  return FALSE;
}

UBYTE ScriptUpdate_MoveActorDiag() {
  BYTE new_dir_x = 0;
  BYTE new_dir_y = 0;

  tmp_actor = &actors[active_script_ctx.script_actor];

  // Actor reached destination
  if ((*tmp_actor).pos.x == active_script_ctx.actor_move_dest_x &&
      (*tmp_actor).pos.y == active_script_ctx.actor_move_dest_y) {
    (*tmp_actor).moving = FALSE;
    (*tmp_actor).script_control = FALSE;
    if (active_script_ctx.script_actor == 0) {
      pl_vel_x = 0;
      pl_vel_y = 0;
    }
    return TRUE;
  }
  (*tmp_actor).moving = TRUE;

  // Actor not at horizontal destination
  if ((*tmp_actor).pos.x != active_script_ctx.actor_move_dest_x) {
    if (Lt16((*tmp_actor).pos.x, active_script_ctx.actor_move_dest_x)) {
      new_dir_x = 1;
    } else if (Gt16((*tmp_actor).pos.x, active_script_ctx.actor_move_dest_x)) {
      new_dir_x = -1;
    }
  }

  // Actor not at vertical destination
  if ((*tmp_actor).pos.y != active_script_ctx.actor_move_dest_y) {
    if (Lt16((*tmp_actor).pos.y, active_script_ctx.actor_move_dest_y)) {
      new_dir_y = 1;
    } else if (Gt16((*tmp_actor).pos.y, active_script_ctx.actor_move_dest_y)) {
      new_dir_y = -1;
    }
  }

  // If changed direction, trigger actor rerender
  if(((*tmp_actor).dir.x != new_dir_x) ||
     ((*tmp_actor).dir.y != new_dir_y)) {
       (*tmp_actor).rerender = TRUE;
  }

  (*tmp_actor).dir.x = new_dir_x;
  (*tmp_actor).dir.y = new_dir_y;

  // Move actor
  if ((*tmp_actor).move_speed == 0) {
    // Half speed only move every other frame
    if (IS_FRAME_2) {
      (*tmp_actor).pos.x += (WORD)new_dir_x;
      (*tmp_actor).pos.y += (WORD)new_dir_y;
    }
  } else {
    (*tmp_actor).pos.x += (WORD)(new_dir_x * (*tmp_actor).move_speed);
    (*tmp_actor).pos.y += (WORD)(new_dir_y * (*tmp_actor).move_speed);        
  }

  return FALSE;
}

UBYTE ScriptUpdate_AwaitFade() {
  FadeUpdate();
  return !IsFading();
}

UBYTE ScriptUpdate_AwaitUIClosed() {
  return UIIsClosed();
}

UBYTE ScriptUpdate_AwaitUIAtDest() {
  return UIAtDest();
}

UBYTE ScriptUpdate_AwaitInputPres() {
  return (joy != last_joy && joy & await_input) != 0;
}

UBYTE ScriptUpdate_Wait() {
  if (active_script_ctx.wait_time == 0) {
    return TRUE;
  }
  active_script_ctx.wait_time--;
  return FALSE;
}

UBYTE ScriptUpdate_Emote() {
  UINT16 screen_x;
  UINT16 screen_y;

  if (emote_timer == BUBBLE_TOTAL_FRAMES) {
    move_sprite(0, 0, 0);
    move_sprite(1, 0, 0);    
    return TRUE;
  } else {
    screen_x = 8u + actors[active_script_ctx.script_actor].pos.x - scroll_x;
    screen_y = 8u + actors[active_script_ctx.script_actor].pos.y - scroll_y;

    if (emote_timer < BUBBLE_ANIMATION_FRAMES) {
      screen_y += emote_offsets[emote_timer];
    }

    move_sprite(0, screen_x, screen_y - 16u);
    move_sprite(1, screen_x + 8u, screen_y - 16u);

    emote_timer++;
    return FALSE;
  }
}

UBYTE ScriptUpdate_MoveCamera() {
  if ((game_time & camera_speed) == 0) {
    if (camera_pos.x > camera_dest.x) {
      camera_pos.x--;
    } else if (camera_pos.x < camera_dest.x) {
      camera_pos.x++;
    }
    if (camera_pos.y > camera_dest.y) {
      camera_pos.y--;
    } else if (camera_pos.y < camera_dest.y) {
      camera_pos.y++;
    }
  }
  if ((camera_pos.x == camera_dest.x) && (camera_pos.y == camera_dest.y)) {
    if (after_lock_camera) {
      camera_settings = camera_settings | CAMERA_LOCK_FLAG;
    }
    return TRUE;
  }

  return FALSE;
}

UBYTE ScriptUpdate_CamShake() {
  if (shake_time == 0) {
    scroll_offset_x = 0;
    scroll_offset_y = 0;
    return TRUE;
  }

  shake_time--;

  // Handle Shake
  if (shake_time != 0) {
    if (should_shake_x)
      scroll_offset_x = (INT16)(shake_time & 0x5) * 2 - 5;
    if (should_shake_y)
      scroll_offset_y = (INT16)(shake_time & 0xA) - 5;
  }

  return FALSE;
}

/*
 * Command: Noop
 * ----------------------------
 * Perform no action, jump ahead by size of command.
 * Useful for skipping unimplemented commands.
 */
void Script_Noop_b() {}

/*
 * Command: End
 * ----------------------------
 * Stop current script from running and reset script pointer.
 */
void Script_End_b() {
  active_script_ctx.script_ptr_bank = 0;
  active_script_ctx.script_ptr = 0;
}

/*
 * Command: Text
 * ----------------------------
 * Display a line of dialogue.
 *
 *   arg0: High 8 bits for string index
 *   arg1: Low 8 bits for string index
 */
void Script_Text_b() {
  UIShowText(script_cmd_args[0], (script_cmd_args[1] * 256) + script_cmd_args[2]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitUIClosed;
}

/*
 * Command: Goto
 * ----------------------------
 * Jump to new script pointer position.
 *
 *   arg0: High 8 bits for new pointer
 *   arg1: Low 8 bits for new pointer
 */
void Script_Goto_b() {
  active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[0] * 256) + script_cmd_args[1];
}

/*
 * Command: IfFlag
 * ----------------------------
 * Jump to new script pointer position if specified flag is not false.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: High 8 bits for new pointer
 *   arg3: Low 8 bits for new pointer
 */
void Script_IfFlag_b() {
  if (script_variables[(script_cmd_args[0] * 256) +
                       script_cmd_args[1]]) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
  }
}

/*
 * Command: IfValue
 * ----------------------------
 * Jump to new script pointer position if specified flag is true when compared using operator to
 * comparator.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Operator
 *   arg3: Comparator
 *   arg4: High 8 bits for new pointer
 *   arg5: Low 8 bits for new pointer
 */
void Script_IfValue_b() {
  UBYTE value, match;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  value = script_variables[ptr];

  switch (script_cmd_args[2]) {
    case OPERATOR_EQ:
      match = value == script_cmd_args[3];
      break;
    case OPERATOR_LT:
      match = value < script_cmd_args[3];
      break;
    case OPERATOR_LTE:
      match = value <= script_cmd_args[3];
      break;
    case OPERATOR_GT:
      match = value > script_cmd_args[3];
      break;
    case OPERATOR_GTE:
      match = value >= script_cmd_args[3];
      break;
    case OPERATOR_NE:
      match = value != script_cmd_args[3];
      break;
    default:
      match = FALSE;
  }

  if (match) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[4] * 256) + script_cmd_args[5];
  }
}

/*
 * Command: SetFlag
 * ----------------------------
 * Set specified flag to be true.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 */
void Script_SetFlag_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_variables[ptr] = TRUE;
}

/*
 * Command: ClearFlag
 * ----------------------------
 * Set specified flag to be false.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 */
void Script_ClearFlag_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_variables[ptr] = FALSE;
}

/*
 * Command: ActorSetDir
 * ----------------------------
 * Set active actor facing direction.
 *
 *   arg0: Direction for active actor to face
 */
void Script_ActorSetDir_b() {
  if (ACTOR_ON_TILE(active_script_ctx.script_actor)) {
    actors[active_script_ctx.script_actor].dir.x = script_cmd_args[0] == 2 ? -1 : script_cmd_args[0] == 4 ? 1 : 0;
    actors[active_script_ctx.script_actor].dir.y = script_cmd_args[0] == 8 ? -1 : script_cmd_args[0] == 1 ? 1 : 0;
    actors[active_script_ctx.script_actor].rerender = TRUE;
  }
}

/*
 * Command: ActorActivate
 * ----------------------------
 * Set active actor.
 *
 *   arg0: Actor index
 */
void Script_ActorActivate_b() {
  active_script_ctx.script_actor = script_cmd_args[0];
  if (active_script_ctx_index == 0) {
    ActivateActor(active_script_ctx.script_actor);
  }
}

/*
 * Command: CameraMoveTo
 * ----------------------------
 * Move camera to specified locatopn.
 *
 *   arg0: Camera destination X (in Tiles)
 *   arg1: Camera destination Y (in Tiles)
 *   arg2: Camera settings
 */
void Script_CameraMoveTo_b() {
  camera_dest.x = (script_cmd_args[0] * 8) + SCREEN_WIDTH_HALF;
  camera_dest.y = (script_cmd_args[1] * 8) + SCREEN_HEIGHT_HALF;

  camera_settings = (UBYTE)script_cmd_args[2] & ~CAMERA_LOCK_FLAG;
  camera_speed = (UBYTE)script_cmd_args[2] & CAMERA_SPEED_MASK;

  ScriptHelper_ClampCamDest();

  if ((camera_settings & CAMERA_TRANSITION_FLAG) == CAMERA_TRANSITION_FLAG) {
    after_lock_camera = FALSE;
    active_script_ctx.script_update_fn = ScriptUpdate_MoveCamera;
  } else {
    camera_pos.x = camera_dest.x;
    camera_pos.y = camera_dest.y;
  }
}

/*
 * Command: CameraLock
 * ----------------------------
 * Move camera to specified locatopn.
 *
 *   arg0: Camera settings
 */
void Script_CameraLock_b() {
  camera_settings = script_cmd_args[0] & ~CAMERA_LOCK_FLAG;
  camera_speed = (UBYTE)script_cmd_args[0] & CAMERA_SPEED_MASK;
  camera_dest.x = player.pos.x;
  camera_dest.y = player.pos.y;

  ScriptHelper_ClampCamDest();

  if ((camera_settings & CAMERA_TRANSITION_FLAG) == CAMERA_TRANSITION_FLAG) {
    after_lock_camera = TRUE;
    active_script_ctx.script_update_fn = ScriptUpdate_MoveCamera;
  } else {
    camera_pos.x = camera_dest.x;
    camera_pos.y = camera_dest.y;
    camera_settings = camera_settings | CAMERA_LOCK_FLAG;
  }
}

void ScriptHelper_ClampCamDest() {
  // Clamp Camera Current X
  if (U_LESS_THAN(image_width - SCREEN_WIDTH_HALF, camera_pos.x)) {
    camera_pos.x = image_width - SCREEN_WIDTH_HALF;
  } else if (U_LESS_THAN(camera_pos.x, SCREEN_WIDTH_HALF)) {
    camera_pos.x = SCREEN_WIDTH_HALF;
  }

  // Clamp Camera Current Y
  if (U_LESS_THAN(image_height - SCREEN_HEIGHT_HALF, camera_pos.y)) {
    camera_pos.y = image_height - SCREEN_HEIGHT_HALF;
  } else if (U_LESS_THAN(camera_pos.y, SCREEN_HEIGHT_HALF)) {
    camera_pos.y = SCREEN_HEIGHT_HALF;
  }

  // Clamp Camera Destination
  if (Gt16(camera_dest.x, image_width - SCREEN_WIDTH_HALF)) {
    camera_dest.x = image_width - SCREEN_WIDTH_HALF;
  } else if (Lt16(camera_dest.x, SCREEN_WIDTH_HALF)) {
    camera_dest.x = SCREEN_WIDTH_HALF;
  }
  if (Gt16(camera_dest.y, image_height - SCREEN_HEIGHT_HALF)) {
    camera_dest.y = image_height - SCREEN_HEIGHT_HALF;
  } else if (Lt16(camera_dest.y, SCREEN_HEIGHT_HALF)) {
    camera_dest.y = SCREEN_HEIGHT_HALF;
  }
}

/*
 * Command: Wait
 * ----------------------------
 * Wait for a specified number of frames before continuing script.
 *
 *   arg0: Frames to wait
 */
void Script_Wait_b() {
  active_script_ctx.wait_time = script_cmd_args[0];
  active_script_ctx.script_update_fn = ScriptUpdate_Wait;
}

/*
 * Command: FadeOut
 * ----------------------------
 * Fade screen to white.
 *
 *   arg0: Fade speed
 */
void Script_FadeOut_b() {
  FadeOut();
  FadeSetSpeed(script_cmd_args[0]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitFade;
}

/*
 * Command: FadeIn
 * ----------------------------
 * Fade screen from white.
 *
 *   arg0: Fade speed
 */
void Script_FadeIn_b() {
  FadeIn();
  FadeSetSpeed(script_cmd_args[0]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitFade;
}

/*
 * Command: LoadScene
 * ----------------------------
 * Load a new scene.
 *
 *   arg0: High 8 bits for stage index
 *   arg1: Low 8 bits for stage index
 *   arg2: Starting X Pos
 *   arg3: Starting Y Pos
 *   arg4: Starting direction
 *   arg5: Fade speed
 */
void Script_LoadScene_b() {
  UINT16 scene_next_index = (script_cmd_args[0] * 256) + script_cmd_args[1];

  map_next_pos.x = 0;  // @wtf-but-needed
  map_next_pos.x = (script_cmd_args[2] * 8);
  map_next_pos.y = 0;  // @wtf-but-needed
  map_next_pos.y = (script_cmd_args[3] * 8);
  map_next_dir.x = script_cmd_args[4] == 2 ? -1 : script_cmd_args[4] == 4 ? 1 : 0;
  map_next_dir.y = script_cmd_args[4] == 8 ? -1 : script_cmd_args[4] == 1 ? 1 : 0;

  SetScene(scene_next_index);
  FadeSetSpeed(script_cmd_args[5]);

  active_script_ctx.script_update_fn = ScriptUpdate_AwaitFade;
}

/*
 * Command: ActorSetPos
 * ----------------------------
 * Instantly position actor at new location.
 *
 *   arg0: New X Pos
 *   arg1: New Y Pos
 */
void Script_ActorSetPos_b() {
  actors[active_script_ctx.script_actor].pos.x = script_cmd_args[0] * 8;
  actors[active_script_ctx.script_actor].pos.y = script_cmd_args[1] * 8;
}

/*
 * Command: ActorMoveTo
 * ----------------------------
 * Walk actor to new location.
 *
 *   arg0: New X Pos
 *   arg1: New Y Pos
 */
void Script_ActorMoveTo_b() {
  tmp_actor = &actors[active_script_ctx.script_actor];
  
  if ((*tmp_actor).script_control) {
    return;
  }

  active_script_ctx.actor_move_dest_x = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_x = (script_cmd_args[0] * 8);
  active_script_ctx.actor_move_dest_y = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_y = (script_cmd_args[1] * 8);
  active_script_ctx.actor_move_cols = script_cmd_args[2];
  active_script_ctx.actor_move_type = script_cmd_args[3];

  (*tmp_actor).script_control = TRUE; // @wtf Should already be true?

  if (active_script_ctx.actor_move_cols) {
    ScriptHelper_CalcDest();
  }

  if (active_script_ctx.actor_move_type == MOVE_DIAGONAL) {
    active_script_ctx.script_update_fn = ScriptUpdate_MoveActorDiag;
  } else {
    active_script_ctx.script_update_fn = ScriptUpdate_MoveActor;
  }
}

void ScriptHelper_CalcDest() {
  UBYTE check_dir = CHECK_DIR_LEFT;
  UWORD new_dest;
  if (active_script_ctx.actor_move_type) {
    if (active_script_ctx.actor_move_dest_y != (*tmp_actor).pos.y) {
      // Check vertical collisions in path
      if (Lt16(active_script_ctx.actor_move_dest_y, (*tmp_actor).pos.y)) {
        check_dir = CHECK_DIR_UP;
      } else {
        check_dir = CHECK_DIR_DOWN;
      }
      new_dest = CheckCollisionInDirection(DIV_8((*tmp_actor).pos.x),
                                           DIV_8((*tmp_actor).pos.y),
                                           DIV_8(active_script_ctx.actor_move_dest_y), check_dir) *
                 8u;
      if (new_dest != active_script_ctx.actor_move_dest_y) {
        active_script_ctx.actor_move_dest_y = new_dest;
      }
    }
    // Check horizontal collisions in path
    if (Lt16(active_script_ctx.actor_move_dest_x, (*tmp_actor).pos.x)) {
      check_dir = CHECK_DIR_LEFT;
    } else {
      check_dir = CHECK_DIR_RIGHT;
    }
    new_dest =
        CheckCollisionInDirection(DIV_8((*tmp_actor).pos.x), DIV_8(active_script_ctx.actor_move_dest_y),
                                  DIV_8(active_script_ctx.actor_move_dest_x), check_dir) *
        8u;
    if (new_dest != active_script_ctx.actor_move_dest_x) {
      active_script_ctx.actor_move_dest_x = new_dest;
      return;
    }
  } else {
    // Check horizontal collisions in path
    if (active_script_ctx.actor_move_dest_x != (*tmp_actor).pos.x) {
      if (Lt16(active_script_ctx.actor_move_dest_x, (*tmp_actor).pos.x)) {
        check_dir = CHECK_DIR_LEFT;
      } else {
        check_dir = CHECK_DIR_RIGHT;
      }
      new_dest = CheckCollisionInDirection(DIV_8((*tmp_actor).pos.x),
                                           DIV_8((*tmp_actor).pos.y),
                                           DIV_8(active_script_ctx.actor_move_dest_x), check_dir) *
                 8u;
      if (new_dest != active_script_ctx.actor_move_dest_x) {
        active_script_ctx.actor_move_dest_x = new_dest;
      }
    }
    // Check vertical collisions in path
    if (Lt16(active_script_ctx.actor_move_dest_y, (*tmp_actor).pos.y)) {
      check_dir = CHECK_DIR_UP;
    } else {
      check_dir = CHECK_DIR_DOWN;
    }
    new_dest =
        CheckCollisionInDirection(DIV_8(active_script_ctx.actor_move_dest_x), DIV_8((*tmp_actor).pos.y),
                                  DIV_8(active_script_ctx.actor_move_dest_y), check_dir) *
        8;
    if (new_dest != active_script_ctx.actor_move_dest_y) {
      active_script_ctx.actor_move_dest_y = new_dest;
      return;
    }
  }
}

/*
 * Command: ShowSprites
 * ----------------------------
 * Make all sprites visible
 */
void Script_ShowSprites_b() {
  hide_sprites = FALSE;
  SHOW_SPRITES;
}

/*
 * Command: HideSprites
 * ----------------------------
 * Hide all sprites
 */
void Script_HideSprites_b() {
  hide_sprites = TRUE;
  HIDE_SPRITES;
}

/*
 * Command: ActorShow
 * ----------------------------
 * Unhide actor
 */
void Script_ActorShow_b() {
  actors[active_script_ctx.script_actor].enabled = TRUE;
  ActivateActor(active_script_ctx.script_actor);
}

/*
 * Command: ActorHide
 * ----------------------------
 * Hide actor
 */
void Script_ActorHide_b() {
  actors[active_script_ctx.script_actor].enabled = FALSE;
  DeactivateActor(active_script_ctx.script_actor);
}

/*
 * Command: ActorSetCollisions
 * ----------------------------
 * Set collisions enabled flag for actor.
 *
 *   arg0: Enabled
 */
void Script_ActorSetCollisions_b() {
  actors[active_script_ctx.script_actor].collisionsEnabled = script_cmd_args[0];
}

/*
 * Command: ActorSetEmote
 * ----------------------------
 * Display emote bubble over actor.
 *
 *   arg0: Emote Id
 */
void Script_ActorSetEmote_b() {
  unsigned char* emote_ptr;
  UBYTE palette = actors[active_script_ctx.script_actor].palette_index;
  emote_timer = 1;
  active_script_ctx.script_update_fn = ScriptUpdate_Emote;
  emote_ptr = (BankDataPtr(EMOTES_SPRITE_BANK)) + EMOTES_SPRITE_BANK_OFFSET;
  SetBankedSpriteData(EMOTE_SPRITE, 4,
                      emote_ptr + ((UWORD)script_cmd_args[0] * 64), EMOTES_SPRITE_BANK);
  set_sprite_prop(0, palette);
  set_sprite_prop(1, palette);
  set_sprite_tile(0, EMOTE_SPRITE);
  set_sprite_tile(1, EMOTE_SPRITE + 2);
}

/*
 * Command: CameraShake
 * ----------------------------
 * Shake camera for earthquake effect.
 *
 *   arg0: Number of frames to shake for
 */
void Script_CameraShake_b() {
  should_shake_x = script_cmd_args[0];
  should_shake_y = script_cmd_args[1];
  shake_time = script_cmd_args[2];
  active_script_ctx.script_update_fn = ScriptUpdate_CamShake;
}

/*
 * Command: ShowOverlay
 * ----------------------------
 * Load image into window buffer and position.
 */
void Script_ShowOverlay_b() {
  UISetColor(script_cmd_args[0]);
  UISetPos(script_cmd_args[1] << 3, script_cmd_args[2] << 3);
}

/*
 * Command: HideOverlay
 * ----------------------------
 * Hide window buffer
 */
void Script_HideOverlay_b() {
  UISetPos(0, MENU_CLOSED_Y);
}

/*
 * Command: OverlaySetPos
 * ----------------------------
 * Window buffer set position to X/Y
 */
void Script_OverlaySetPos_b() {
  UISetPos(script_cmd_args[0] << 3, script_cmd_args[1] << 3);
}

/*
 * Command: OverlaySetPos
 * ----------------------------
 * Window buffer move position to X/Y with speed
 */
void Script_OverlayMoveTo_b() {
  UIMoveTo(script_cmd_args[0] << 3, script_cmd_args[1] << 3, script_cmd_args[2]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitUIAtDest;
}

/*
 * Command: AwaitInput
 * ----------------------------
 * Pause script until joy overlaps bits with provided input
 */
void Script_AwaitInput_b() {
  await_input = script_cmd_args[0];
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitInputPres;
}

/*
 * Command: MusicPlay
 * ----------------------------
 * Play the music track with given index
 */
void Script_MusicPlay_b() {
  MusicPlay(script_cmd_args[0], script_cmd_args[1], SCRIPT_RUNNER_BANK);
}

/*
 * Command: MusicStop
 * ----------------------------
 * Stop any playing music
 */
void Script_MusicStop_b() {
  MusicStop(SCRIPT_RUNNER_BANK);
}

/*
 * Command: ResetVariables
 * ----------------------------
 * Reset all variables back to false
 */
void Script_ResetVariables_b() {
  UWORD i;
  for (i = 0; i != NUM_VARIABLES; ++i) {
    script_variables[i] = FALSE;
  }
}

/*
 * Command: NextFrame
 * ----------------------------
 * Wait until next frame
 */
void Script_NextFrame_b() {
  active_script_ctx.script_await_next_frame = TRUE;
}

/*
 * Command: IncFlag
 * ----------------------------
 * Increase value stored in flag
 */
void Script_IncFlag_b() {
  UBYTE value;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  value = script_variables[ptr];
  if (value != 255) {
    script_variables[ptr] = value + 1;
  }
}

/*
 * Command: DecFlag
 * ----------------------------
 * Decrease value stored in flag
 */
void Script_DecFlag_b() {
  UBYTE value;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  value = script_variables[ptr];
  if (value != 0) {
    script_variables[ptr] = value - 1;
  }
}

/*
 * Command: SetFlagValue
 * ----------------------------
 * Set flag to specific value
 */
void Script_SetFlagValue_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_variables[ptr] = script_cmd_args[2];
}

/*
 * Command: SetFlagProperty
 * ----------------------------
 * Set flag to an actor property
 */
void Script_SetFlagProperty_b() {
  UBYTE value = 0;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];

  switch (script_cmd_args[2]) {
    case 0:
      // Actor pos x
      value = actors[script_cmd_args[3]].pos.x >> 3;
      break;
    case 1:
      // Actor pos y
      value = actors[script_cmd_args[3]].pos.y >> 3;
      break;
    case 2:
      // Actor direction
      if (actors[script_cmd_args[3]].dir.y == 1) {
        value = 1;
      } else if (actors[script_cmd_args[3]].dir.x == -1) {
        value = 2;
      } else if (actors[script_cmd_args[3]].dir.x == 1) {
        value = 4;
      } else {
        value = 8;
      }
      break;
    case 3:
      // Actor movement speed
      value = actors[script_cmd_args[3]].move_speed;
      break;
    case 4:
      // Actor animation speed
      value = actors[script_cmd_args[3]].anim_speed;
      break;
    case 5:
      // Actor frame
      value = actors[script_cmd_args[3]].frame;
      break;
  }
  script_variables[ptr] = value;
}

/*
 * Command: IfInput
 * ----------------------------
 * Goto true path if joy mask overlaps
 */
void Script_IfInput_b() {
  UBYTE mask;
  mask = 0;
  mask = script_cmd_args[0];
  if ((joy & mask) != 0) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[1] * 256) + script_cmd_args[2];
  }
}

/*
 * Command: Choice
 * ----------------------------
 * Display multiple choice input
 */
void Script_Choice_b() {
  UIShowChoice((script_cmd_args[0] * 256) + script_cmd_args[1], script_cmd_args[2],
               (script_cmd_args[3] * 256) + script_cmd_args[4]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitUIClosed;
}

/*
 * Command: Menu
 * ----------------------------
 * Display multiple choice menu
 */
void Script_TextMenu_b() {
  UIShowMenu((script_cmd_args[0] * 256) + script_cmd_args[1], script_cmd_args[2],
             (script_cmd_args[3] * 256) + script_cmd_args[4], script_cmd_args[5],
             script_cmd_args[6]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitUIClosed;
}

/*
 * Command: PlayerBounce
 * ----------------------------
 * Cause player to bounce (Platform scenes only)
 */
void Script_PlayerBounce_b() {
  if (script_cmd_args[0] == 0) {
    pl_vel_y = -0x2000;
  } else if (script_cmd_args[0] == 1) {
    pl_vel_y = -0x4000;
  } else if (script_cmd_args[0] == 2) {
    pl_vel_y = -0x6000;
  }
}

/*
 * Command: ActorSetSprite
 * ----------------------------
 * Change sprite used by player
 */
void Script_ActorSetSprite_b() {
  UBYTE sprite_frames;

  if (active_script_ctx.script_actor == 0) {
    // Don't allow ActorSetSprite to be used for the player
    // Should use PlayerSetSprite instead. Events should
    // handle this automatically
    return;
  }

  sprite_frames = script_cmd_args[1];

  actors[active_script_ctx.script_actor].sprite = script_cmd_args[0];
  actors[active_script_ctx.script_actor].frame = 0;
  actors[active_script_ctx.script_actor].sprite_type = sprite_frames == 6
                                         ? SPRITE_ACTOR_ANIMATED
                                         : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  actors[active_script_ctx.script_actor].frames_len = sprite_frames == 6 ? 2 : sprite_frames == 3 ? 1 : sprite_frames;
  actors[active_script_ctx.script_actor].rerender = TRUE;
}

/*
 * Command: PlayerSetSprite
 * ----------------------------
 * Change sprite used by player
 */
void Script_PlayerSetSprite_b() {
  UWORD sprite_index;
  UBYTE sprite_frames;

  // Load Player Sprite
  sprite_index = (script_cmd_args[0] * 256) + script_cmd_args[1];

  sprite_frames = DIV_4(LoadSprite(sprite_index, 0));

  player.sprite = 0;
  player.frame = 0;

 if (sprite_frames > 6) {
    // Limit player to 6 frames to prevent overflow into scene actor vram
    player.sprite_type = SPRITE_STATIC;
    player.frames_len = 6;
  } else if (sprite_frames == 6) {
    player.sprite_type = SPRITE_ACTOR_ANIMATED;
    player.frames_len = 2;
  } else if (sprite_frames == 3) {
    player.sprite_type = SPRITE_ACTOR;
    player.frames_len = 1;    
  } else {
    player.sprite_type = SPRITE_STATIC;
    player.frames_len = sprite_frames;    
  }

  player.rerender = TRUE;

  // Keep new sprite when switching scene
  if (script_cmd_args[2]) {
    map_next_sprite = sprite_index;
  }
}

/*
 * Command: ActorPush
 * ----------------------------
 * Push actor in direction player is facing
 */
void Script_ActorPush_b() {
  UINT16 dest_x, dest_y;
  tmp_actor = &actors[active_script_ctx.script_actor];
  
  if ((*tmp_actor).script_control) {
    return;
  }

  if (script_cmd_args[0]) {
    // If pushing until collision set destination at scene bounds
    // Collision check happens in ScriptHelper_CalcDest()
    if (actors[0].dir.x < 0) {
      dest_x = 0;
    } else if (actors[0].dir.x > 0) {
      dest_x = image_width;
    } else {
      dest_x = (*tmp_actor).pos.x;
    }
    if (actors[0].dir.y < 0) {
      dest_y = 0;
    } else if (actors[0].dir.y > 0) {
      dest_y = image_height;
    } else {
      dest_y = (*tmp_actor).pos.y;
    }
  } else {
    // If not continuing until collision just push on 16px tile
    dest_x = (*tmp_actor).pos.x + (actors[0].dir.x * 16);
    dest_y = (*tmp_actor).pos.y + (actors[0].dir.y * 16);
  }

  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings &= ~ACTOR_NOCLIP;
  active_script_ctx.actor_move_dest_x = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_x = dest_x;
  active_script_ctx.actor_move_dest_y = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_y = dest_y;
  (*tmp_actor).script_control = TRUE;

  ScriptHelper_CalcDest();

  active_script_ctx.script_update_fn = ScriptUpdate_MoveActor;
}

/*
 * Command: IfActorPos
 * ----------------------------
 * Jump to new script pointer position if specified actor is at desired position.
 *
 *   arg0: Actor index
 *   arg1: Actor X Pos
 *   arg2: Actor Y Pos
 *   arg3: High 8 bits for new pointer
 *   arg4: Low 8 bits for new pointer
 */
void Script_IfActorPos_b() {
  UBYTE tile_x, tile_y;
  tile_x = actors[active_script_ctx.script_actor].pos.x >> 3;
  tile_y = actors[active_script_ctx.script_actor].pos.y >> 3;
  if ((script_cmd_args[0] == tile_x) &&
      (script_cmd_args[1] == tile_y)) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
  }
}

/*
 * Command: SaveData
 * ----------------------------
 * Store current scene, player position and direction, current sprite and variable values into RAM
 */
void Script_SaveData_b() {
  UWORD i;

  ENABLE_RAM;

  RAMPtr = (UBYTE*)RAM_START_PTR;
  RAMPtr[0] = TRUE;  // Flag to determine if data has been stored

  RAMPtr[1] = current_state >> 8;
  RAMPtr[2] = current_state & 0xFF;

  // Save player position
  RAMPtr[3] = (player.pos.x >> 3) & 0xFF;
  RAMPtr[4] = (player.pos.y >> 3) & 0xFF;
  if (player.dir.x < 0) {
    RAMPtr[5] = 2;
  } else if (player.dir.x > 0) {
    RAMPtr[5] = 4;
  } else if (player.dir.y < 0) {
    RAMPtr[5] = 8;
  } else {
    RAMPtr[5] = 1;
  }

  // Save player sprite
  RAMPtr[6] = map_next_sprite >> 8;
  RAMPtr[7] = map_next_sprite & 0xFF;

  // Save variable values
  RAMPtr = (UBYTE*)RAM_START_VARS_PTR;
  for (i = 0; i < NUM_VARIABLES; i++) {
    RAMPtr[i] = script_variables[i];
  }

  DISABLE_RAM;
}

/*
 * Command: LoadData
 * ----------------------------
 * Restore current scene, player position and direction, current sprite and variable values from RAM
 */
void Script_LoadData_b() {
  UINT16 scene_next_index;
  UWORD i;

  ENABLE_RAM;

  RAMPtr = (UBYTE*)RAM_START_PTR;
  if (*RAMPtr == TRUE) {
    // Set scene index
    RAMPtr++;
    scene_next_index = (UWORD)((*(RAMPtr++)) * 256) + *RAMPtr;

    // Position player
    RAMPtr++;
    map_next_pos.x = 0;  // @wtf-but-needed
    map_next_pos.x = (WORD)(*RAMPtr) * 8;
    RAMPtr++;
    map_next_pos.y = 0;  // @wtf-but-needed
    map_next_pos.y = (WORD)(*RAMPtr) * 8;
    RAMPtr++;
    map_next_dir.x = *RAMPtr == 2 ? -1 : *RAMPtr == 4 ? 1 : 0;
    map_next_dir.y = *RAMPtr == 8 ? -1 : *RAMPtr == 1 ? 1 : 0;

    // Load player sprite
    RAMPtr++;
    map_next_sprite = (UWORD)((*(RAMPtr++)) * 256) + *RAMPtr;

    // Load variable values
    RAMPtr = (UBYTE*)RAM_START_VARS_PTR;
    for (i = 0; i < NUM_VARIABLES; i++) {
      script_variables[i] = RAMPtr[i];
    }

    // Switch to next scene
    SetScene(scene_next_index);
    FadeSetSpeed(2);

    active_script_ctx.script_update_fn = ScriptUpdate_AwaitFade;
  }

  DISABLE_RAM;
}

/*
 * Command: ClearData
 * ----------------------------
 * Clear current data in RAM
 */
void Script_ClearData_b() {
  ENABLE_RAM;
  RAMPtr = (UBYTE*)RAM_START_PTR;
  RAMPtr[0] = FALSE;
  DISABLE_RAM;
}

/*
 * Command: IfSavedData
 * ----------------------------
 * Jump to new script pointer position if data is saved in RAM.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 */
void Script_IfSavedData_b() {
  UBYTE jump;

  ENABLE_RAM;
  RAMPtr = (UBYTE*)RAM_START_PTR;
  jump = 0;
  jump = *RAMPtr == TRUE;
  DISABLE_RAM;

  if (jump) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[0] * 256) + script_cmd_args[1];
  }
}

/*
 * Command: IfActorDirection
 * ----------------------------
 * Jump to new script pointer position if actor direction matches.
 *
 *   arg0: Actor index
 *   arg1: Direction for active actor to match
 *   arg2: High 8 bits for new pointer
 *   arg3: Low 8 bits for new pointer
 */
void Script_IfActorDirection_b() {
  if ((actors[active_script_ctx.script_actor].dir.x == 1 && script_cmd_args[0] == 4 ||
       actors[active_script_ctx.script_actor].dir.x == -1 && script_cmd_args[0] == 2) ||
      (actors[active_script_ctx.script_actor].dir.y == 1 && script_cmd_args[0] == 1 ||
       actors[active_script_ctx.script_actor].dir.y == -1 &&
           script_cmd_args[0] == 8)) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[1] * 256) + script_cmd_args[2];
  }
}

/*
 * Command: IfActorRelActor
 * ----------------------------
 * Jump to new script pointer position if actor position is in specificied direction relative to
 * second actor.
 *
 *   arg0: Operation
 *   arg1: Second actor index
 *   arg2: High 8 bits for new pointer
 *   arg3: Low 8 bits for new pointer
 */
void Script_IfActorRelActor_b() {
  if (script_cmd_args[0] == 0) {  // Above
    if (Lt16(actors[active_script_ctx.script_actor].pos.y, actors[script_cmd_args[1]].pos.y)) {
      active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
    }
  } else if (script_cmd_args[0] == 1) {  // Down
    if (Gt16(actors[active_script_ctx.script_actor].pos.y, actors[script_cmd_args[1]].pos.y)) {
      active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
    }
  } else if (script_cmd_args[0] == 2) {  // Left
    if (Lt16(actors[active_script_ctx.script_actor].pos.x, actors[script_cmd_args[1]].pos.x)) {
      active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
    }
  } else if (script_cmd_args[0] == 3) {  // Right
    if (Gt16(actors[active_script_ctx.script_actor].pos.x, actors[script_cmd_args[1]].pos.x)) {
      active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
    }
  }
}

/*
 * Command: SetFlagRandomValue
 * ----------------------------
 * Set flag to random value
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Max value
 */
void Script_SetFlagRandomValue_b() {
  UBYTE rand_val;
  UBYTE modulo;
  UBYTE offset;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  rand_val = rand();
  offset = script_cmd_args[2];
  modulo = script_cmd_args[3] + 1;
  script_variables[ptr] = offset + (rand_val % modulo);
}

/*
 * Command: ActorGetPos
 * ----------------------------
 * Store Actor position in variables
 */
void Script_ActorGetPos_b() {
  script_variables[active_script_ctx.script_ptr_x] = actors[active_script_ctx.script_actor].pos.x >> 3;
  script_variables[active_script_ctx.script_ptr_y] = actors[active_script_ctx.script_actor].pos.y >> 3;
}

/*
 * Command: ActorSetPosToVal
 * ----------------------------
 * Set Actor position from variables
 */
void Script_ActorSetPosToVal_b() {
  actors[active_script_ctx.script_actor].pos.x = 0;  // @wtf-but-needed
  actors[active_script_ctx.script_actor].pos.x = script_variables[active_script_ctx.script_ptr_x] * 8;
  actors[active_script_ctx.script_actor].pos.y = 0;  // @wtf-but-needed
  actors[active_script_ctx.script_actor].pos.y = script_variables[active_script_ctx.script_ptr_y] * 8;
}

/*
 * Command: ActorMoveToVal
 * ----------------------------
 * Set Actor position from variables
 */
void Script_ActorMoveToVal_b() {  
  tmp_actor = &actors[active_script_ctx.script_actor];
  if (actors[active_script_ctx.script_actor].script_control) {
    return;
  }
  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings |= ACTOR_NOCLIP;
  active_script_ctx.actor_move_dest_x = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_x = script_variables[active_script_ctx.script_ptr_x] * 8;
  active_script_ctx.actor_move_dest_y = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_y = script_variables[active_script_ctx.script_ptr_y] * 8;
  active_script_ctx.actor_move_cols = script_cmd_args[0];
  active_script_ctx.actor_move_type = script_cmd_args[1];
  (*tmp_actor).script_control = TRUE; // @wtf should already be True?

  if (active_script_ctx.actor_move_cols) {
    ScriptHelper_CalcDest();
  }

  if (active_script_ctx.actor_move_type == MOVE_DIAGONAL) {
    active_script_ctx.script_update_fn = ScriptUpdate_MoveActorDiag;
  } else {
    active_script_ctx.script_update_fn = ScriptUpdate_MoveActor;
  }
}

/*
 * Command: ActorMoveRel
 * ----------------------------
 * Walk actor to relative location.
 *
 *   arg0: Offset X Pos
 *   arg1: Offset Y Pos
 */
void Script_ActorMoveRel_b() {
  tmp_actor = &actors[active_script_ctx.script_actor];  
    
  if ((*tmp_actor).script_control) {
    return;
  }

  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings |= ACTOR_NOCLIP;
  active_script_ctx.actor_move_dest_x = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_x = (*tmp_actor).pos.x;
  if (script_cmd_args[0] != 0) {
    if (script_cmd_args[1] == 1) {
      active_script_ctx.actor_move_dest_x = active_script_ctx.actor_move_dest_x - (script_cmd_args[0] * 8);
      // If destination wrapped past left edge set to min X
      if (U_LESS_THAN((*tmp_actor).pos.x, active_script_ctx.actor_move_dest_x)) {
        active_script_ctx.actor_move_dest_x = ACTOR_MIN_X;
      } else if (U_LESS_THAN(active_script_ctx.actor_move_dest_x, ACTOR_MIN_X)) {
        active_script_ctx.actor_move_dest_x = ACTOR_MIN_X;
      }
    } else {
      active_script_ctx.actor_move_dest_x = active_script_ctx.actor_move_dest_x + (script_cmd_args[0] * 8);
      // If destination beyond max X set to max X
      if (active_script_ctx.actor_move_dest_x > image_width - 16) {
        active_script_ctx.actor_move_dest_x = image_width - 16;
      }
    }
  }

  active_script_ctx.actor_move_dest_y = 0;  // @wtf-but-needed
  active_script_ctx.actor_move_dest_y = (*tmp_actor).pos.y;
  if (script_cmd_args[2] != 0) {
    if (script_cmd_args[3] == 1) {
      active_script_ctx.actor_move_dest_y = active_script_ctx.actor_move_dest_y - (script_cmd_args[2] * 8);
      // If destination wrapped past top edge set to min Y
      if (active_script_ctx.actor_move_dest_y > (*tmp_actor).pos.y) {
        active_script_ctx.actor_move_dest_y = ACTOR_MIN_Y;
      } else if (active_script_ctx.actor_move_dest_y < ACTOR_MIN_Y) {
        active_script_ctx.actor_move_dest_y = ACTOR_MIN_Y;
      }
    } else {
      active_script_ctx.actor_move_dest_y = active_script_ctx.actor_move_dest_y + (script_cmd_args[2] * 8);
      // If destination beyond max Y set to max Y
      if (active_script_ctx.actor_move_dest_y > image_height - 8) {
        active_script_ctx.actor_move_dest_y = image_height - 8;
      }
    }
  }

  active_script_ctx.actor_move_cols = script_cmd_args[4];
  active_script_ctx.actor_move_type = script_cmd_args[5];

  (*tmp_actor).script_control = TRUE;

  if (active_script_ctx.actor_move_cols) {
    ScriptHelper_CalcDest();
  }

  if (active_script_ctx.actor_move_type == MOVE_DIAGONAL) {
    active_script_ctx.script_update_fn = ScriptUpdate_MoveActorDiag;
  } else {
    active_script_ctx.script_update_fn = ScriptUpdate_MoveActor;
  }
}

/*
 * Command: ActorSetPosRel
 * ----------------------------
 * Instantly position actor at relative location.
 *
 *   arg0: Offset X Pos
 *   arg1: Offset Y Pos
 */
void Script_ActorSetPosRel_b() {
  if (script_cmd_args[0] != 0) {
    if (script_cmd_args[1]) {
      actors[active_script_ctx.script_actor].pos.x = actors[active_script_ctx.script_actor].pos.x - (script_cmd_args[0] * 8);
    } else {
      actors[active_script_ctx.script_actor].pos.x = actors[active_script_ctx.script_actor].pos.x + (script_cmd_args[0] * 8);
    }
  }

  if (script_cmd_args[2] != 0) {
    if (script_cmd_args[3]) {
      actors[active_script_ctx.script_actor].pos.y = actors[active_script_ctx.script_actor].pos.y - (script_cmd_args[2] * 8);
    } else {
      actors[active_script_ctx.script_actor].pos.y = actors[active_script_ctx.script_actor].pos.y + (script_cmd_args[2] * 8);
    }
  }
}

/*
 * Command: MathAdd
 * ----------------------------
 * Add value to flag
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_MathAdd_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a + b;
}

/*
 * Command: MathSub
 * ----------------------------
 * Subtract value from flag
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_MathSub_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a - b;
}

/*
 * Command: MathMul
 * ----------------------------
 * Multiply flag by value
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_MathMul_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a * b;
}

/*
 * Command: MathDiv
 * ----------------------------
 * Divide flag by value
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_MathDiv_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a / b;
}

/*
 * Command: MathMod
 * ----------------------------
 * Flag modulo by value
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_MathMod_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a % b;
}

/*
 * Command: MathAddVal
 * ----------------------------
 * Add value from flag to flag
 */
void Script_MathAddVal_b() {
  UBYTE a = script_variables[active_script_ctx.script_ptr_x];
  UBYTE b = script_variables[active_script_ctx.script_ptr_y];
  UBYTE clamp = script_cmd_args[0];

  if (!clamp || a < 255 - b) {
    script_variables[active_script_ctx.script_ptr_x] = a + b;
  } else {
    script_variables[active_script_ctx.script_ptr_x] = 255;
  }
  
}

/*
 * Command: MathSubVal
 * ----------------------------
 * Subtract value from flag to flag
 */
void Script_MathSubVal_b() {
  UBYTE a = script_variables[active_script_ctx.script_ptr_x];
  UBYTE b = script_variables[active_script_ctx.script_ptr_y];
  UBYTE clamp = script_cmd_args[0];

  if (!clamp || a > b) {
    script_variables[active_script_ctx.script_ptr_x] = a - b;
  } else {
    script_variables[active_script_ctx.script_ptr_x] = 0;
  }
}

/*
 * Command: MathMulVal
 * ----------------------------
 * Multiply value from flag to flag
 */
void Script_MathMulVal_b() {
  UBYTE a = script_variables[active_script_ctx.script_ptr_x];
  UBYTE b = script_variables[active_script_ctx.script_ptr_y];
  script_variables[active_script_ctx.script_ptr_x] = a * b;
}

/*
 * Command: MathDiv
 * ----------------------------
 * Divide value from flag to flag
 */
void Script_MathDivVal_b() {
  UBYTE a = script_variables[active_script_ctx.script_ptr_x];
  UBYTE b = script_variables[active_script_ctx.script_ptr_y];
  script_variables[active_script_ctx.script_ptr_x] = a / b;
}

/*
 * Command: MathModVal
 * ----------------------------
 * Modulo value from flag to flag
 */
void Script_MathModVal_b() {
  UBYTE a = script_variables[active_script_ctx.script_ptr_x];
  UBYTE b = script_variables[active_script_ctx.script_ptr_y];
  script_variables[active_script_ctx.script_ptr_x] = a % b;
}

/*
 * Command: CopyVal
 * ----------------------------
 * Copy value from flag to flag
 */
void Script_CopyVal_b() {
  UBYTE value = script_variables[active_script_ctx.script_ptr_y];
  script_variables[active_script_ctx.script_ptr_x] = value;
}

/*
 * Command: IfValue
 * ----------------------------
 * Jump to new script pointer position if specified flag is true when compared using operator to
 * comparator.
 *
 *   arg0: Operator
 *   arg1: High 8 bits for new pointer
 *   arg2: Low 8 bits for new pointer
 */
void Script_IfValueCompare_b() {
  UBYTE match;
  UBYTE a = script_variables[active_script_ctx.script_ptr_x];
  UBYTE b = script_variables[active_script_ctx.script_ptr_y];

  switch (script_cmd_args[0]) {
    case OPERATOR_EQ:
      match = a == b;
      break;
    case OPERATOR_LT:
      match = a < b;
      break;
    case OPERATOR_LTE:
      match = a <= b;
      break;
    case OPERATOR_GT:
      match = a > b;
      break;
    case OPERATOR_GTE:
      match = a >= b;
      break;
    case OPERATOR_NE:
      match = a != b;
      break;
    default:
      match = FALSE;
  }

  if (match) {  // True path, jump to position specified by ptr
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[1] * 256) + script_cmd_args[2];
  }
}

/*
 * Command: LoadVectors
 * ----------------------------
 * Loads a vector pair
 *
 *   arg0: High 8 bits for first pointer
 *   arg1: Low 8 bits for first pointer
 *   arg2: High 8 bits for second pointer
 *   arg3: Low 8 bits for second pointer
 */
void Script_LoadVectors_b() {
  active_script_ctx.script_ptr_x = (script_cmd_args[0] * 256) + script_cmd_args[1];
  active_script_ctx.script_ptr_y = (script_cmd_args[2] * 256) + script_cmd_args[3];
}

/*
 * Command: ActorSetMoveSpeed
 * ----------------------------
 * Set active actor movement speed.
 *
 *   arg0: Movement speed to use
 */
void Script_ActorSetMoveSpeed_b() {
  actors[active_script_ctx.script_actor].move_speed = script_cmd_args[0];
  actors[active_script_ctx.script_actor].pos.x = actors[active_script_ctx.script_actor].pos.x & 0xFFFC;
  actors[active_script_ctx.script_actor].pos.y = actors[active_script_ctx.script_actor].pos.y & 0xFFFC;
}

/*
 * Command: ActorSetAnimSpeed
 * ----------------------------
 * Set active actor animation speed.
 *
 *   arg0: Animation speed to use
 */
void Script_ActorSetAnimSpeed_b() {
  actors[active_script_ctx.script_actor].anim_speed = script_cmd_args[0];
}

/*
 * Command: TextSetAnimSpeed
 * ----------------------------
 * Set global text animation speed.
 *
 *   arg0: Animation speed to use
 *   arg1: Animation speed to use fading out
 */
void Script_TextSetAnimSpeed_b() {
  text_in_speed = script_cmd_args[0];
  text_out_speed = script_cmd_args[1];
  text_draw_speed = script_cmd_args[2];
  text_ff_joypad = script_cmd_args[3] ? (J_A | J_B) : 0;
}

/*
 * Command: ActorInvoke
 * ----------------------------
 * Invoke Actor script
 */
void Script_ActorInvoke_b() {
  BankPtr* events_ptr;

  Script_StackPush_b();

  events_ptr = &actors[active_script_ctx.script_actor].events_ptr;
  active_script_ctx.script_ptr_bank = events_ptr->bank;
  active_script_ctx.script_ptr = (BankDataPtr(script_ctxs[ctx].active_script_ctx.script_ptr_bank)) + events_ptr->offset;
  active_script_ctx.script_update_fn = FALSE;
  active_script_ctx.script_start_ptr = active_script_ctx.script_ptr;
}

/*
 * Command: StackPush
 * ----------------------------
 * Push the current script pointer to the stack
 * Store script start ptr for if statements, script bank for long scripts.
 */
void Script_StackPush_b() {
  script_bank_stack[script_stack_ptr] = active_script_ctx.script_ptr_bank;
  script_stack[script_stack_ptr] = active_script_ctx.script_ptr;
  script_start_stack[script_stack_ptr] = active_script_ctx.script_start_ptr;
  script_stack[script_stack_ptr] += 1 + script_cmd_args_len;
  script_stack_ptr++;
}

/*
 * Command: StackPop
 * ----------------------------
 * Pop the script pointer from the stack
 * Retrieve script start ptr for if statements, script bank for long scripts.
 */
void Script_StackPop_b() __banked {
  script_stack_ptr--;
  active_script_ctx.script_ptr_bank = script_bank_stack[script_stack_ptr];
  active_script_ctx.script_ptr = script_stack[script_stack_ptr];
  active_script_ctx.script_start_ptr = script_start_stack[script_stack_ptr];
}

/*
 * Command: ScenePushState
 * ----------------------------
 * Stores the state of the current scene
 */
void Script_ScenePushState_b() {
  if (scene_stack_ptr < MAX_SCENE_STATES) {
    scene_stack[scene_stack_ptr].scene_index = current_state;
    scene_stack[scene_stack_ptr].player_dir.x = actors[0].dir.x;
    scene_stack[scene_stack_ptr].player_dir.y = actors[0].dir.y;
    scene_stack[scene_stack_ptr].player_pos.x = 0;  // @wtf-but-needed
    scene_stack[scene_stack_ptr].player_pos.x = actors[0].pos.x >> 3;
    scene_stack[scene_stack_ptr].player_pos.y = 0;  // @wtf-but-needed
    scene_stack[scene_stack_ptr].player_pos.y = actors[0].pos.y >> 3;
    scene_stack_ptr++;
  }
}

/*
 * Command: ScenePopState
 * ----------------------------
 * Restores the saved scene state
 *
 *   arg0: Fade speed
 */
void Script_ScenePopState_b() {
  UINT16 scene_next_index;

  if (scene_stack_ptr) {
    scene_stack_ptr--;

    scene_next_index = scene_stack[scene_stack_ptr].scene_index;

    map_next_pos.x = 0;  // @wtf-but-needed
    map_next_pos.x = scene_stack[scene_stack_ptr].player_pos.x * 8;
    map_next_pos.y = 0;  // @wtf-but-needed
    map_next_pos.y = scene_stack[scene_stack_ptr].player_pos.y * 8;
    map_next_dir.x = scene_stack[scene_stack_ptr].player_dir.x;
    map_next_dir.y = scene_stack[scene_stack_ptr].player_dir.y;

    SetScene(scene_next_index);
    FadeSetSpeed(script_cmd_args[0]);
    active_script_ctx.script_update_fn = ScriptUpdate_AwaitFade;

    return;
  }
}

/*
 * Command: SceneResetStack
 * ----------------------------
 * Clear all saved scene state
 */
void Script_SceneResetStack_b() {
  scene_stack_ptr = 0;
}

/*
 * Command: ScenePopAllState
 * ----------------------------
 * Restores the first saved scene state
 */
void Script_ScenePopAllState_b() {
  UINT16 scene_next_index;

  if (scene_stack_ptr) {
    scene_stack_ptr = 0;

    scene_next_index = scene_stack[scene_stack_ptr].scene_index;

    map_next_pos.x = 0;  // @wtf-but-needed
    map_next_pos.x = scene_stack[scene_stack_ptr].player_pos.x * 8;
    map_next_pos.y = 0;  // @wtf-but-needed
    map_next_pos.y = scene_stack[scene_stack_ptr].player_pos.y * 8;
    map_next_dir.x = scene_stack[scene_stack_ptr].player_dir.x;
    map_next_dir.y = scene_stack[scene_stack_ptr].player_dir.y;

    SetScene(scene_next_index);
    FadeSetSpeed(script_cmd_args[0]);
    active_script_ctx.script_update_fn = ScriptUpdate_AwaitFade;

    return;
  }
}

/*
 * Command: SetInputScript
 * ----------------------------
 * Attach script to button press
 */
void Script_SetInputScript_b() {
  UBYTE input, index;

  input = script_cmd_args[0];

  if (script_cmd_args[1]) {
    SET_BIT_MASK(input_script_persist, input);
  } else {
    UNSET_BIT_MASK(input_script_persist, input);
  }

  SET_BIT_MASK(input_override_default, input);

  index = 0;
  for (index = 0; index != 8; ++index) {
    if (input & 1) {
      input_script_ptrs[index].bank = script_cmd_args[2];
      input_script_ptrs[index].offset = (script_cmd_args[3] * 256) + script_cmd_args[4];
    }
    input = input >> 1;
  }
}

/*
 * Command: RemoveInputScript
 * ----------------------------
 * Remove script from button press
 */
void Script_RemoveInputScript_b() {
  UBYTE input, index;

  input = script_cmd_args[0];

  UNSET_BIT_MASK(input_override_default, input);

  index = 0;
  for (index = 0; index != 8; ++index) {
    if (input & 1) {
      input_script_ptrs[index].bank = 0;
    }
    input = input >> 1;
  }
}

/*
 * Command: ActorSetFrame
 * ----------------------------
 * Set animation frame of current actor
 */
void Script_ActorSetFrame_b() {
  actors[active_script_ctx.script_actor].frame = 0;
  actors[active_script_ctx.script_actor].frame = script_cmd_args[0] % actors[active_script_ctx.script_actor].frames_len;
  actors[active_script_ctx.script_actor].rerender = TRUE;
}

/*
 * Command: ActorSetFrameToVal
 * ----------------------------
 * Set animation frame of current actor using variable
 */
void Script_ActorSetFrameToVal_b() {
  actors[active_script_ctx.script_actor].frame = 0;
  actors[active_script_ctx.script_actor].frame = script_variables[(script_cmd_args[0] * 256) + script_cmd_args[1]] %
                               actors[active_script_ctx.script_actor].frames_len;
  actors[active_script_ctx.script_actor].rerender = TRUE;
}

/*
 * Command: ActorSetFlip
 * ----------------------------
 * Set flip state of current actor
 */
void Script_ActorSetFlip_b() { /* NOOP - This command has been removed */
}

/*
 * Command: TextMulti
 * ----------------------------
 * Set multi text box mode
 * mode - 0 (store text close speed and set to instant)
 *      - 1 (store open speed and set to instant)
 *      - 2 (restore close speed)
 *      - 3 (restore open and close speed)
 */
void Script_TextMulti_b() {
  UBYTE mode;
  mode = script_cmd_args[0];

  

  if (mode == 0) {
    tmp_text_out_speed = text_out_speed;
    text_out_speed = 0;
  } else if (mode == 1) {
    tmp_text_in_speed = text_in_speed;
    text_in_speed = 0;
  } else if (mode == 2) {
    text_out_speed = tmp_text_out_speed;
  } else if (mode == 3) {
    text_in_speed = tmp_text_in_speed;
    text_out_speed = tmp_text_out_speed;
  }

  
}

/*
 * Command: VariableAddFlags
 * ----------------------------
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_VariableAddFlags_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a | b;
}

/*
 * Command: VariableClearFlags
 * ----------------------------
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_VariableClearFlags_b() {
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a & ~b;
}

/*
 * Command: SoundStartTone
 * ----------------------------
 */
void Script_SoundPlayTone_b() {
  SoundPlayTone((script_cmd_args[0] * 256) + script_cmd_args[1], script_cmd_args[2]);
}

/*
 * Command: SoundStopTone
 * ----------------------------
 */
void Script_SoundStopTone_b() {
  SoundStopTone();
}

/*
 * Command: SoundPlayBeep
 * ----------------------------
 */
void Script_SoundPlayBeep_b() {
  SoundPlayBeep(script_cmd_args[0]);
}

/*
 * Command: SoundPlayCrash
 * ----------------------------
 */
void Script_SoundPlayCrash_b() {
  SoundPlayCrash();
}

/*
 * Command: SetTimerScript
 * ----------------------------
 * Attach script to timer
 */
void Script_SetTimerScript_b() {
  timer_script_duration = script_cmd_args[0];
  timer_script_time = script_cmd_args[0];
  timer_script_ptr.bank = script_cmd_args[1];
  timer_script_ptr.offset = (script_cmd_args[2] * 256) + script_cmd_args[3];
}

/*
 * Command: ResetTimer
 * ----------------------------
 * Reset the countdown timer
 */
void Script_ResetTimer_b() {
  timer_script_time = timer_script_duration;
}

/*
 * Command: RemoveTimerScript
 * ----------------------------
 * Disable timer script
 */
void Script_RemoveTimerScript_b() {
  timer_script_duration = 0;
}

/*
 * Command: Text with Avatar
 * ----------------------------
 * Display a line of dialogue with a 16x16 avatar on the left
 *
 *   arg0: High 8 bits for string index
 *   arg1: Low 8 bits for string index
 *   arg2: Spritesheet to use as the dialogue avatar
 */
void Script_TextWithAvatar_b() {
  avatar_enabled = TRUE;
  UIShowText(script_cmd_args[0], (script_cmd_args[1] * 256) + script_cmd_args[2]);
  UIShowAvatar(script_cmd_args[3]);
  active_script_ctx.script_update_fn = ScriptUpdate_AwaitUIClosed;
}

void Script_LaunchProjectile_b() {
  UBYTE dir_value;
  BYTE dir_x, dir_y;
  UBYTE palette = actors[active_script_ctx.script_actor].palette_index;

  dir_x = 0;
  dir_y = 0;
  dir_value = script_variables[(script_cmd_args[1] * 256) + script_cmd_args[2]];

  if (dir_value == 1) {
    dir_x = 0;
    dir_y = 1;
  } else if (dir_value == 2) {
    dir_x = -1;
    dir_y = 0;
  } else if (dir_value == 4) {
    dir_x = 1;
    dir_y = 0;
  } else if (dir_value == 8) {
    dir_x = 0;
    dir_y = -1;
  }

  ProjectileLaunch(script_cmd_args[0],                         // Sprite
                   palette,                                    // Palette index
                   actors[active_script_ctx.script_actor].pos.x + (dir_x * 16),  // Launch X
                   actors[active_script_ctx.script_actor].pos.y + (dir_y * 16),  // Launch Y
                   dir_x,                                      // Dir x
                   dir_y,                                      // Dir y
                   1,                                          // Moving
                   script_cmd_args[3],                         // Move Speed
                   60,                                         // Life time
                   script_cmd_args[4] & 0xF,                   // Collision group
                   script_cmd_args[4] >> 4);                   // Collision mask
}

void Script_WeaponAttack_b() {
  UBYTE palette = actors[active_script_ctx.script_actor].palette_index;
  WeaponAttack(script_cmd_args[0],  // Sprite
               palette,             // Palette index
               active_script_ctx.script_actor,
               script_cmd_args[1],
               script_cmd_args[2] & 0xF,  // Collision group
               script_cmd_args[2] >> 4);  // Collision mask
}

void Script_PalSetBackground_b() {
  palette_update_mask = script_cmd_args[0];
  LoadPalette((script_cmd_args[1] * 256) + script_cmd_args[2]);
  ApplyPaletteChange();
}

void Script_PalSetSprite_b() {
  LoadSpritePalette((script_cmd_args[0] * 256) + script_cmd_args[1]);
  ApplyPaletteChange();  
}

void Script_PalSetUI_b() {
  LoadUIPalette((script_cmd_args[0] * 256) + script_cmd_args[1]);
  ApplyPaletteChange();
}

void Script_ActorStopUpdate_b() {
  actors[active_script_ctx.script_actor].moving = FALSE;
  if (actors[active_script_ctx.script_actor].movement_ctx) {
    ScriptCtxPoolReturn(actors[active_script_ctx.script_actor].movement_ctx, active_script_ctx.script_actor);
  }
  actors[active_script_ctx.script_actor].movement_ctx = 0; //@wtf fixes crash but still will not stop update script from same update script
}

void Script_ActorSetAnimate_b() {
  actors[active_script_ctx.script_actor].animate = script_cmd_args[0];
}

void Script_IfColorSupported_b() {
  if (_cpu == CGB_TYPE) {
    active_script_ctx.script_ptr = active_script_ctx.script_start_ptr + (script_cmd_args[0] * 256) + script_cmd_args[1];
  }
}

void Script_EngFieldSet_b()
{
  UBYTE *ptr;
  ptr = engine_fields_addr + ((script_cmd_args[0] * 256) + script_cmd_args[1]);
  *ptr = script_cmd_args[2];
}

void Script_EngFieldSetWord_b()
{
  UWORD *ptr;
  ptr = engine_fields_addr + ((script_cmd_args[0] * 256) + script_cmd_args[1]);
  *ptr = (script_cmd_args[2] * 256) + script_cmd_args[3];
}

void Script_EngFieldSetVar_b()
{
  UBYTE *ptr;
  UBYTE var_lo;
  ptr = engine_fields_addr + ((script_cmd_args[0] * 256) + script_cmd_args[1]);
  var_lo = script_variables[(script_cmd_args[2] * 256) + script_cmd_args[3]];
  *ptr = var_lo;
}

void Script_EngFieldSetWordVar_b()
{
  UWORD *ptr;
  UBYTE var_lo, var_hi;
  ptr = engine_fields_addr + ((script_cmd_args[0] * 256) + script_cmd_args[1]);
  var_hi = script_variables[(script_cmd_args[2] * 256) + script_cmd_args[3]];
  var_lo = script_variables[(script_cmd_args[4] * 256) + script_cmd_args[5]];
  *ptr = (var_hi * 256) + var_lo;
}

void Script_EngFieldStore_b()
{
  UBYTE *ptr;
  ptr = engine_fields_addr + ((script_cmd_args[0] * 256) + script_cmd_args[1]);
  script_variables[(script_cmd_args[2] * 256) + script_cmd_args[3]] = *ptr;
}

void Script_EngFieldStoreWord_b()
{
  UBYTE *ptr;
  ptr = engine_fields_addr + ((script_cmd_args[0] * 256) + script_cmd_args[1]);
  script_variables[(script_cmd_args[2] * 256) + script_cmd_args[3]] = *ptr;
  ptr += 1;
  script_variables[(script_cmd_args[4] * 256) + script_cmd_args[5]] = *ptr;
}

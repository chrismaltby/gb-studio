// clang-format off
#pragma bank=4
// clang-format on

#include "ScriptRunner.h"
#include "Scene.h"
#include "MusicManager.h"
#include "FadeManager.h"
#include "BankData.h"
#include "UI.h"
#include "Macros.h"
#include "Math.h"

#define RAM_START_PTR 0xA000
#define RAM_START_VARS_PTR 0xA0FF

UINT8 scriptrunner_bank = 4;

UBYTE *RAMPtr;

/*
 * Command: Noop
 * ----------------------------
 * Perform no action, jump ahead by size of command.
 * Useful for skipping unimplemented commands.
 */
void Script_Noop_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: End
 * ----------------------------
 * Stop current script from running and reset script pointer.
 */
void Script_End_b()
{
  script_ptr_bank = 0;
  script_ptr = 0;
}

/*
 * Command: Text
 * ----------------------------
 * Display a line of dialogue.
 *
 *   arg0: High 8 bits for string index
 *   arg1: Low 8 bits for string index
 */
void Script_Text_b()
{
  script_ptr += 1 + script_cmd_args_len;
  UIShowText((script_cmd_args[0] * 256) + script_cmd_args[1]);
  script_action_complete = FALSE;
}

/*
 * Command: Goto
 * ----------------------------
 * Jump to new script pointer position.
 *
 *   arg0: High 8 bits for new pointer
 *   arg1: Low 8 bits for new pointer
 */
void Script_Goto_b()
{
  script_ptr = script_start_ptr + (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_continue = TRUE;
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
void Script_IfFlag_b()
{
  if (script_variables[(script_cmd_args[0] * 256) + script_cmd_args[1]])
  { // True path, jump to position specified by ptr
    script_ptr = script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
  }
  else
  { // False path, skip to next command
    script_ptr += 1 + script_cmd_args_len;
  }
  script_continue = TRUE;
}

/*
 * Command: IfValue
 * ----------------------------
 * Jump to new script pointer position if specified flag is true when compared using operator to comparator.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Operator
 *   arg3: Comparator
 *   arg4: High 8 bits for new pointer
 *   arg5: Low 8 bits for new pointer
 */
void Script_IfValue_b()
{
  UBYTE value, match;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  value = script_variables[ptr];

  switch (script_cmd_args[2])
  {
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

  if (match)
  { // True path, jump to position specified by ptr
    script_ptr = script_start_ptr + (script_cmd_args[4] * 256) + script_cmd_args[5];
  }
  else
  { // False path, skip to next command
    script_ptr += 1 + script_cmd_args_len;
  }
  script_continue = TRUE;
}

/*
 * Command: SetFlag
 * ----------------------------
 * Set specified flag to be true.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 */
void Script_SetFlag_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_variables[ptr] = TRUE;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ClearFlag
 * ----------------------------
 * Set specified flag to be false.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 */
void Script_ClearFlag_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_variables[ptr] = FALSE;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetDir
 * ----------------------------
 * Set active actor facing direction.
 *
 *   arg0: Direction for active actor to face
 */
void Script_ActorSetDir_b()
{
  actors[script_actor].dir.x = script_cmd_args[0] == 2 ? -1 : script_cmd_args[0] == 4 ? 1 : 0;
  actors[script_actor].dir.y = script_cmd_args[0] == 8 ? -1 : script_cmd_args[0] == 1 ? 1 : 0;
  actors[script_actor].redraw = TRUE;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorActivate
 * ----------------------------
 * Set active actor.
 *
 *   arg0: Actor index
 */
void Script_ActorActivate_b()
{
  script_actor = script_cmd_args[0];
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_CameraMoveTo_b()
{
  camera_dest.x = script_cmd_args[0] << 3;
  camera_dest.y = 0; // @wtf-but-needed
  camera_dest.y = script_cmd_args[1] << 3;
  camera_settings = (UBYTE)script_cmd_args[2] & ~CAMERA_LOCK_FLAG;
  camera_speed = (UBYTE)script_cmd_args[2] & CAMERA_SPEED_MASK;
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: CameraLock
 * ----------------------------
 * Move camera to specified locatopn.
 *
 *   arg0: Camera settings
 */
void Script_CameraLock_b()
{
  UBYTE cam_x, cam_y;

  camera_settings = script_cmd_args[0] & ~CAMERA_LOCK_FLAG;

  cam_x = ClampUBYTE(actors[0].pos.x, SCREEN_WIDTH_HALF, MUL_8(scene_width) - SCREEN_WIDTH_HALF);
  camera_dest.x = cam_x - SCREEN_WIDTH_HALF;
  cam_y = ClampUBYTE(actors[0].pos.y, SCREEN_HEIGHT_HALF, MUL_8(scene_height) - SCREEN_HEIGHT_HALF);
  camera_dest.y = cam_y - SCREEN_HEIGHT_HALF;

  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: Wait
 * ----------------------------
 * Wait for a specified number of frames before continuing script.
 *
 *   arg0: Frames to wait
 */
void Script_Wait_b()
{
  wait_time = script_cmd_args[0];
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: FadeOut
 * ----------------------------
 * Fade screen to white.
 *
 *   arg0: Fade speed
 */
void Script_FadeOut_b()
{
  FadeOut();
  FadeSetSpeed(script_cmd_args[0]);
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: FadeIn
 * ----------------------------
 * Fade screen from white.
 *
 *   arg0: Fade speed
 */
void Script_FadeIn_b()
{
  FadeIn();
  FadeSetSpeed(script_cmd_args[0]);
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
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
void Script_LoadScene_b()
{
  scene_next_index = (script_cmd_args[0] * 256) + script_cmd_args[1];
  scene_index = scene_next_index + 1;

  map_next_pos.x = 0; // @wtf-but-needed
  map_next_pos.x = (script_cmd_args[2] << 3) + 8;
  map_next_pos.y = 0; // @wtf-but-needed
  map_next_pos.y = (script_cmd_args[3] << 3) + 8;
  map_next_dir.x = script_cmd_args[4] == 2 ? -1 : script_cmd_args[4] == 4 ? 1 : 0;
  map_next_dir.y = script_cmd_args[4] == 8 ? -1 : script_cmd_args[4] == 1 ? 1 : 0;

  stage_next_type = SCENE;
  script_action_complete = FALSE;

  FadeSetSpeed(script_cmd_args[5]);
  FadeOut();

  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: ActorSetPos
 * ----------------------------
 * Instantly position actor at new location.
 *
 *   arg0: New X Pos
 *   arg1: New Y Pos
 */
void Script_ActorSetPos_b()
{
  actors[script_actor].pos.x = 0; // @wtf-but-needed
  actors[script_actor].pos.x = (script_cmd_args[0] << 3) + 8;
  actors[script_actor].pos.y = 0; // @wtf-but-needed
  actors[script_actor].pos.y = (script_cmd_args[1] << 3) + 8;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorMoveTo
 * ----------------------------
 * Walk actor to new location.
 *
 *   arg0: New X Pos
 *   arg1: New Y Pos
 */
void Script_ActorMoveTo_b()
{
  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings |= ACTOR_NOCLIP;
  actor_move_dest.x = 0; // @wtf-but-needed
  actor_move_dest.x = (script_cmd_args[0] << 3) + 8;
  actor_move_dest.y = 0; // @wtf-but-needed
  actor_move_dest.y = (script_cmd_args[1] << 3) + 8;
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: ShowSprites
 * ----------------------------
 * Make all sprites visible
 */
void Script_ShowSprites_b()
{
  SHOW_SPRITES;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: HideSprites
 * ----------------------------
 * Hide all sprites
 */
void Script_HideSprites_b()
{
  HIDE_SPRITES;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorShow
 * ----------------------------
 * Unhide actor
 */
void Script_ActorShow_b()
{
  actors[script_cmd_args[0]].enabled = TRUE;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorHide
 * ----------------------------
 * Hide actor
 */
void Script_ActorHide_b()
{
  actors[script_cmd_args[0]].enabled = FALSE;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetEmote
 * ----------------------------
 * Display emote bubble over actor.
 *
 *   arg0: Emote Id
 */
void Script_ActorSetEmote_b()
{
  script_ptr += 1 + script_cmd_args_len;
  SceneSetEmote(script_cmd_args[0], script_cmd_args[1]);
  script_action_complete = FALSE;
}

/*
 * Command: CameraShake
 * ----------------------------
 * Shake camera for earthquake effect.
 *
 *   arg0: Number of frames to shake for
 */
void Script_CameraShake_b()
{
  shake_time = script_cmd_args[0];
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: ShowOverlay
 * ----------------------------
 * Load image into window buffer and position.
 */
void Script_ShowOverlay_b()
{
  UISetColor(script_cmd_args[0]);
  UISetPos(script_cmd_args[1] << 3, script_cmd_args[2] << 3);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: HideOverlay
 * ----------------------------
 * Hide window buffer
 */
void Script_HideOverlay_b()
{
  UISetPos(0, MENU_CLOSED_Y);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: OverlaySetPos
 * ----------------------------
 * Window buffer set position to X/Y
 */
void Script_OverlaySetPos_b()
{
  UISetPos(script_cmd_args[0] << 3, script_cmd_args[1] << 3);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: OverlaySetPos
 * ----------------------------
 * Window buffer move position to X/Y with speed
 */
void Script_OverlayMoveTo_b()
{
  UIMoveTo(script_cmd_args[0] << 3, script_cmd_args[1] << 3, script_cmd_args[2]);
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: AwaitInput
 * ----------------------------
 * Pause script until joy overlaps bits with provided input
 */
void Script_AwaitInput_b()
{
  await_input = script_cmd_args[0];
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: MusicPlay
 * ----------------------------
 * Play the music track with given index
 */
void Script_MusicPlay_b()
{
  MusicPlay(script_cmd_args[0], script_cmd_args[1], scriptrunner_bank);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: MusicStop
 * ----------------------------
 * Stop any playing music
 */
void Script_MusicStop_b()
{
  MusicStop(scriptrunner_bank);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ResetVariables
 * ----------------------------
 * Reset all variables back to false
 */
void Script_ResetVariables_b()
{
  UBYTE i;
  for (i = 0; i != NUM_VARIABLES; ++i)
  {
    script_variables[i] = FALSE;
  }
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: NextFrame
 * ----------------------------
 * Wait until next frame
 */
void Script_NextFrame_b()
{
  script_ptr += 1 + script_cmd_args_len;
  script_continue = FALSE;
}

/*
 * Command: IncFlag
 * ----------------------------
 * Increase value stored in flag
 */
void Script_IncFlag_b()
{
  UBYTE value;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  value = script_variables[ptr];
  if (value != 255)
  {
    script_variables[ptr] = value + 1;
  }
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: DecFlag
 * ----------------------------
 * Decrease value stored in flag
 */
void Script_DecFlag_b()
{
  UBYTE value;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  value = script_variables[ptr];
  if (value != 0)
  {
    script_variables[ptr] = value - 1;
  }
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: SetFlagValue
 * ----------------------------
 * Set flag to specific value
 */
void Script_SetFlagValue_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_variables[ptr] = script_cmd_args[2];
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: IfInput
 * ----------------------------
 * Goto true path if joy mask overlaps
 */
void Script_IfInput_b()
{
  UBYTE mask;
  mask = 0;
  mask = script_cmd_args[0];
  if ((joy & mask) != 0)
  { // True path, jump to position specified by ptr
    script_ptr = script_start_ptr + (script_cmd_args[1] * 256) + script_cmd_args[2];
  }
  else
  { // False path, skip to next command
    script_ptr += 1 + script_cmd_args_len;
  }
  script_continue = TRUE;
}

/*
 * Command: Choice
 * ----------------------------
 * Display multiple choice input
 */
void Script_Choice_b()
{
  script_ptr += 1 + script_cmd_args_len;
  UIShowChoice((script_cmd_args[0] * 256) + script_cmd_args[1], (script_cmd_args[2] * 256) + script_cmd_args[3]);
  script_action_complete = FALSE;
}

/*
 * Command: PlayerSetSprite
 * ----------------------------
 * Change sprite used by player
 */
void Script_PlayerSetSprite_b()
{
  BANK_PTR sprite_bank_ptr;
  UWORD sprite_ptr;
  UBYTE sprite_index, sprite_frames, sprite_len;

  // Load Player Sprite
  sprite_index = script_cmd_args[0];
  ReadBankedBankPtr(DATA_PTRS_BANK, &sprite_bank_ptr, &sprite_bank_ptrs[sprite_index]);
  sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
  sprite_frames = ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr);
  sprite_len = MUL_4(sprite_frames);
  SetBankedSpriteData(sprite_bank_ptr.bank, 0, sprite_len, sprite_ptr + 1);
  actors[0].sprite = 0;
  actors[0].sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  actors[0].redraw = TRUE;

  // Keep new sprite when switching scene
  map_next_sprite = sprite_index;

  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorPush
 * ----------------------------
 * Push actor in direction player is facing
 */
void Script_ActorPush_b()
{
  UBYTE dest_x, dest_y;

  if (script_cmd_args[0])
  {
    if (actors[0].dir.x < 0)
    {
      dest_x = 0;
    }
    else if (actors[0].dir.x > 0)
    {
      dest_x = 240;
    }
    else
    {
      dest_x = actors[script_actor].pos.x;
    }
    if (actors[0].dir.y < 0)
    {
      dest_y = 0;
    }
    else if (actors[0].dir.y > 0)
    {
      dest_y = 240;
    }
    else
    {
      dest_y = actors[script_actor].pos.y;
    }
  }
  else
  {
    dest_x = actors[script_actor].pos.x + (actors[0].dir.x * 16);
    dest_y = actors[script_actor].pos.y + (actors[0].dir.y * 16);
  }

  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings &= ~ACTOR_NOCLIP;
  actor_move_dest.x = 0; // @wtf-but-needed
  actor_move_dest.x = dest_x;
  actor_move_dest.y = 0; // @wtf-but-needed
  actor_move_dest.y = dest_y;
  // script_ptr += 1 + script_cmd_args_len;
  // script_action_complete = FALSE;

  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
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
void Script_IfActorPos_b()
{
  if (
      ((script_cmd_args[1] << 3) + 8 == actors[script_cmd_args[0]].pos.x) &&
      ((script_cmd_args[2] << 3) + 8 == actors[script_cmd_args[0]].pos.y))
  { // True path, jump to position specified by ptr
    script_ptr = script_start_ptr + (script_cmd_args[3] * 256) + script_cmd_args[4];
  }
  else
  { // False path, skip to next command
    script_ptr += 1 + script_cmd_args_len;
  }
  script_continue = TRUE;
}

/*
 * Command: SaveData
 * ----------------------------
 * Store current scene, player position and direction, current sprite and variable values into RAM
 */
void Script_SaveData_b()
{
  UWORD i;

  ENABLE_RAM_MBC1;

  RAMPtr = (UBYTE *)RAM_START_PTR;
  RAMPtr[0] = TRUE; // Flag to determine if data has been stored

  // Save current scene
  RAMPtr[1] = scene_index;

  // Save player position
  RAMPtr[2] = actors[0].pos.x;
  RAMPtr[3] = actors[0].pos.y;
  if (actors[0].dir.x < 0)
  {
    RAMPtr[4] = 2;
  }
  else if (actors[0].dir.x > 0)
  {
    RAMPtr[4] = 4;
  }
  else if (actors[0].dir.y < 0)
  {
    RAMPtr[4] = 8;
  }
  else
  {
    RAMPtr[4] = 1;
  }

  // Save player sprite
  RAMPtr[5] = map_next_sprite;

  // Save variable values
  RAMPtr = (UBYTE *)RAM_START_VARS_PTR;  
  for (i = 0; i < NUM_VARIABLES; i++)
  {
    RAMPtr[i] = script_variables[i];
  }

  DISABLE_RAM_MBC1;

  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: LoadData
 * ----------------------------
 * Restore current scene, player position and direction, current sprite and variable values from RAM
 */
void Script_LoadData_b()
{
  UWORD i;

  ENABLE_RAM_MBC1;

  RAMPtr = (UBYTE *)RAM_START_PTR;
  if (*RAMPtr == TRUE)
  {
    // Set scene index
    RAMPtr++;
    scene_next_index = *RAMPtr;
    scene_index = scene_next_index + 1;

    // Position player
    RAMPtr++;
    map_next_pos.x = 0; // @wtf-but-needed
    map_next_pos.x = *RAMPtr;
    RAMPtr++;
    map_next_pos.y = 0; // @wtf-but-needed
    map_next_pos.y = *RAMPtr;
    RAMPtr++;
    map_next_dir.x = *RAMPtr == 2 ? -1 : *RAMPtr == 4 ? 1 : 0;
    map_next_dir.y = *RAMPtr == 8 ? -1 : *RAMPtr == 1 ? 1 : 0;

    // Load player sprite
    RAMPtr++;
    map_next_sprite = *RAMPtr;

    // Load variable values
    RAMPtr = (UBYTE *)RAM_START_VARS_PTR;
    for (i = 0; i < NUM_VARIABLES; i++)
    {
      script_variables[i] = RAMPtr[i];
    }

    // Switch to next scene
    stage_next_type = SCENE;
    FadeSetSpeed(2);
    FadeOut();

    script_action_complete = FALSE;
  }

  DISABLE_RAM_MBC1;

  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: ClearData
 * ----------------------------
 * Clear current data in RAM
 */
void Script_ClearData_b()
{
  ENABLE_RAM_MBC1;
  RAMPtr = (UBYTE *)RAM_START_PTR;
  RAMPtr[0] = FALSE;
  DISABLE_RAM_MBC1;

  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: IfSavedData
 * ----------------------------
 * Jump to new script pointer position if data is saved in RAM.
 *
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 */
void Script_IfSavedData_b()
{
  UBYTE jump;

  ENABLE_RAM_MBC1;
  RAMPtr = (UBYTE *)RAM_START_PTR;
  jump = 0;
  jump = *RAMPtr == TRUE;
  DISABLE_RAM_MBC1;

  if (jump)
  { // True path, jump to position specified by ptr
    script_ptr = script_start_ptr + (script_cmd_args[0] * 256) + script_cmd_args[1];
  }
  else
  { // False path, skip to next command
    script_ptr += 1 + script_cmd_args_len;
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
void Script_IfActorDirection_b()
{
  script_actor = script_cmd_args[0];

  if (
    (
      actors[script_actor].dir.x == 1 && script_cmd_args[1] == 4 ||
      actors[script_actor].dir.x == -1 && script_cmd_args[1] == 2
    ) ||
    (
      actors[script_actor].dir.y == 1 && script_cmd_args[1] == 1 ||
      actors[script_actor].dir.y == -1 && script_cmd_args[1] == 8
    ))
  { // True path, jump to position specified by ptr
    script_ptr = script_start_ptr + (script_cmd_args[2] * 256) + script_cmd_args[3];
  }
  else
  { // False path, skip to next command
    script_ptr += 1 + script_cmd_args_len;
  }

  script_continue = TRUE;
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
void Script_SetFlagRandomValue_b()
{
  UBYTE rand_val;
  UBYTE modulo;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  rand_val = rand();
  modulo = script_cmd_args[2] + 1;
  script_variables[ptr] = rand_val % modulo;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

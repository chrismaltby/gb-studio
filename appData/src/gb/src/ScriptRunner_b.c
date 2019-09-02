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
#include "game.h"
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
  SceneRenderActor(script_actor);
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
  camera_speed = (UBYTE)script_cmd_args[0] & CAMERA_SPEED_MASK;
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
  scene_loaded = FALSE;
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
  actors[script_actor].enabled = TRUE;
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
  actors[script_actor].enabled = FALSE;
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
  SceneSetEmote(script_actor, script_cmd_args[0]);
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
  UWORD i;
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
  actors[0].frame = 0;
  actors[0].sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  actors[0].frames_len = sprite_frames == 6 ? 2 : sprite_frames == 3 ? 1 : sprite_frames;
  SceneRenderActor(0);

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
      ((script_cmd_args[0] << 3) + 8 == actors[script_actor].pos.x) &&
      ((script_cmd_args[1] << 3) + 8 == actors[script_actor].pos.y))
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
 * Command: SaveData
 * ----------------------------
 * Store current scene, player position and direction, current sprite and variable values into RAM
 */
void Script_SaveData_b()
{
  UWORD i;

  ENABLE_RAM_MBC5;

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

  DISABLE_RAM_MBC5;

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

  ENABLE_RAM_MBC5;

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
    scene_loaded = FALSE;
    FadeSetSpeed(2);
    FadeOut();

    script_action_complete = FALSE;
  }

  DISABLE_RAM_MBC5;

  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: ClearData
 * ----------------------------
 * Clear current data in RAM
 */
void Script_ClearData_b()
{
  ENABLE_RAM_MBC5;
  RAMPtr = (UBYTE *)RAM_START_PTR;
  RAMPtr[0] = FALSE;
  DISABLE_RAM_MBC5;

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

  ENABLE_RAM_MBC5;
  RAMPtr = (UBYTE *)RAM_START_PTR;
  jump = 0;
  jump = *RAMPtr == TRUE;
  DISABLE_RAM_MBC5;

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

  if (
      (
          actors[script_actor].dir.x == 1 && script_cmd_args[0] == 4 ||
          actors[script_actor].dir.x == -1 && script_cmd_args[0] == 2) ||
      (actors[script_actor].dir.y == 1 && script_cmd_args[0] == 1 ||
       actors[script_actor].dir.y == -1 && script_cmd_args[0] == 8))
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
  UBYTE offset;
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  rand_val = rand();
  offset = script_cmd_args[2];
  modulo = script_cmd_args[3] + 1;
  script_variables[ptr] = offset + (rand_val % modulo);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorGetPos
 * ----------------------------
 * Store Actor position in variables
 */
void Script_ActorGetPos_b()
{
  script_variables[script_ptr_x] = actors[script_actor].pos.x - 8 >> 3;
  script_variables[script_ptr_y] = actors[script_actor].pos.y - 8 >> 3;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetPosToVal
 * ----------------------------
 * Set Actor position from variables
 */
void Script_ActorSetPosToVal_b()
{
  actors[script_actor].pos.x = 0; // @wtf-but-needed
  actors[script_actor].pos.x = (script_variables[script_ptr_x] << 3) + 8;
  actors[script_actor].pos.y = 0; // @wtf-but-needed
  actors[script_actor].pos.y = (script_variables[script_ptr_y] << 3) + 8;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorMoveToVal
 * ----------------------------
 * Set Actor position from variables
 */
void Script_ActorMoveToVal_b()
{
  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings |= ACTOR_NOCLIP;
  actor_move_dest.x = 0; // @wtf-but-needed
  actor_move_dest.x = (script_variables[script_ptr_x] << 3) + 8;
  actor_move_dest.y = 0; // @wtf-but-needed
  actor_move_dest.y = (script_variables[script_ptr_y] << 3) + 8;
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: ActorMoveRel
 * ----------------------------
 * Walk actor to relative location.
 *
 *   arg0: Offset X Pos
 *   arg1: Offset Y Pos
 */
void Script_ActorMoveRel_b()
{
  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_settings |= ACTOR_NOCLIP;
  actor_move_dest.x = 0; // @wtf-but-needed
  actor_move_dest.x = actors[script_actor].pos.x;
  if (script_cmd_args[0] != 0)
  {
    if (script_cmd_args[1] == 1)
    {
      actor_move_dest.x = actor_move_dest.x - (script_cmd_args[0] << 3);
    }
    else
    {
      actor_move_dest.x = actor_move_dest.x + (script_cmd_args[0] << 3);
    }
  }

  actor_move_dest.y = 0; // @wtf-but-needed
  actor_move_dest.y = actors[script_actor].pos.y;
  if (script_cmd_args[2] != 0)
  {
    if (script_cmd_args[3] == 1)
    {
      actor_move_dest.y = actor_move_dest.y - (script_cmd_args[2] << 3);
    }
    else
    {
      actor_move_dest.y = actor_move_dest.y + (script_cmd_args[2] << 3);
    }
  }

  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: ActorSetPosRel
 * ----------------------------
 * Instantly position actor at relative location.
 *
 *   arg0: Offset X Pos
 *   arg1: Offset Y Pos
 */
void Script_ActorSetPosRel_b()
{
  if (script_cmd_args[0] != 0)
  {
    if (script_cmd_args[1])
    {
      actors[script_actor].pos.x = actors[script_actor].pos.x - (script_cmd_args[0] << 3);
    }
    else
    {
      actors[script_actor].pos.x = actors[script_actor].pos.x + (script_cmd_args[0] << 3);
    }
  }

  if (script_cmd_args[2] != 0)
  {
    if (script_cmd_args[3])
    {
      actors[script_actor].pos.y = actors[script_actor].pos.y - (script_cmd_args[2] << 3);
    }
    else
    {
      actors[script_actor].pos.y = actors[script_actor].pos.y + (script_cmd_args[2] << 3);
    }
  }

  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_MathAdd_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a + b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_MathSub_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a - b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_MathMul_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a * b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_MathDiv_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a / b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_MathMod_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a % b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: MathAddVal
 * ----------------------------
 * Add value from flag to flag
 */
void Script_MathAddVal_b()
{
  UBYTE a = script_variables[script_ptr_x];
  UBYTE b = script_variables[script_ptr_y];
  script_variables[script_ptr_x] = a + b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: MathSubVal
 * ----------------------------
 * Subtract value from flag to flag
 */
void Script_MathSubVal_b()
{
  UBYTE a = script_variables[script_ptr_x];
  UBYTE b = script_variables[script_ptr_y];
  script_variables[script_ptr_x] = a - b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: MathMulVal
 * ----------------------------
 * Multiply value from flag to flag
 */
void Script_MathMulVal_b()
{
  UBYTE a = script_variables[script_ptr_x];
  UBYTE b = script_variables[script_ptr_y];
  script_variables[script_ptr_x] = a * b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: MathDiv
 * ----------------------------
 * Divide value from flag to flag
 */
void Script_MathDivVal_b()
{
  UBYTE a = script_variables[script_ptr_x];
  UBYTE b = script_variables[script_ptr_y];
  script_variables[script_ptr_x] = a / b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: MathModVal
 * ----------------------------
 * Modulo value from flag to flag
 */
void Script_MathModVal_b()
{
  UBYTE a = script_variables[script_ptr_x];
  UBYTE b = script_variables[script_ptr_y];
  script_variables[script_ptr_x] = a % b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: CopyVal
 * ----------------------------
 * Copy value from flag to flag
 */
void Script_CopyVal_b()
{
  UBYTE value = script_variables[script_ptr_y];
  script_variables[script_ptr_x] = value;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: IfValue
 * ----------------------------
 * Jump to new script pointer position if specified flag is true when compared using operator to comparator.
 *
 *   arg0: Operator
 *   arg1: High 8 bits for new pointer
 *   arg2: Low 8 bits for new pointer
 */
void Script_IfValueCompare_b()
{
  UBYTE match;
  UBYTE a = script_variables[script_ptr_x];
  UBYTE b = script_variables[script_ptr_y];

  switch (script_cmd_args[0])
  {
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

  if (match)
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
 * Command: LoadVectors
 * ----------------------------
 * Loads a vector pair
 *
 *   arg0: High 8 bits for first pointer
 *   arg1: Low 8 bits for first pointer
 *   arg2: High 8 bits for second pointer
 *   arg3: Low 8 bits for second pointer
 */
void Script_LoadVectors_b()
{
  script_ptr_x = (script_cmd_args[0] * 256) + script_cmd_args[1];
  script_ptr_y = (script_cmd_args[2] * 256) + script_cmd_args[3];
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetMoveSpeed
 * ----------------------------
 * Set active actor movement speed.
 *
 *   arg0: Movement speed to use
 */
void Script_ActorSetMoveSpeed_b()
{
  actors[script_actor].move_speed = script_cmd_args[0];
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetAnimSpeed
 * ----------------------------
 * Set active actor animation speed.
 *
 *   arg0: Animation speed to use
 */
void Script_ActorSetAnimSpeed_b()
{
  actors[script_actor].anim_speed = script_cmd_args[0];
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: TextSetAnimSpeed
 * ----------------------------
 * Set global text animation speed.
 *
 *   arg0: Animation speed to use
 *   arg1: Animation speed to use fading out
 */
void Script_TextSetAnimSpeed_b()
{
  text_in_speed = script_cmd_args[0];
  text_out_speed = script_cmd_args[1];
  text_draw_speed = script_cmd_args[2];
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorInvoke
 * ----------------------------
 * Invoke Actor script
 */
void Script_ActorInvoke_b()
{
  Script_StackPush_b();
  ScriptStart(&actors[script_actor].events_ptr);
}

/*
 * Command: StackPush
 * ----------------------------
 * Push the current script pointer to the stack
 */
void Script_StackPush_b()
{
  script_stack[script_stack_ptr] = script_ptr;
  script_start_stack[script_stack_ptr] = script_start_ptr;
  script_stack[script_stack_ptr] += 1 + script_cmd_args_len;
  script_stack_ptr++;
}

/*
 * Command: StackPop
 * ----------------------------
 * Pop the script pointer from the stack
 */
void Script_StackPop_b()
{
  script_stack_ptr--;
  script_ptr = script_stack[script_stack_ptr];
  script_start_ptr = script_start_stack[script_stack_ptr];
  script_continue = TRUE;
}

/*
 * Command: ScenePushState
 * ----------------------------
 * Stores the state of the current scene
 */
void Script_ScenePushState_b()
{
  if (scene_stack_ptr < MAX_SCENE_STATES)
  {
    scene_stack[scene_stack_ptr].scene_index = scene_index;
    scene_stack[scene_stack_ptr].player_dir.x = actors[0].dir.x;
    scene_stack[scene_stack_ptr].player_dir.y = actors[0].dir.y;
    scene_stack[scene_stack_ptr].player_pos.x = 0; // @wtf-but-needed
    scene_stack[scene_stack_ptr].player_pos.x = actors[0].pos.x >> 3;
    scene_stack[scene_stack_ptr].player_pos.y = 0; // @wtf-but-needed
    scene_stack[scene_stack_ptr].player_pos.y = actors[0].pos.y >> 3;
    scene_stack_ptr++;
  }

  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ScenePopState
 * ----------------------------
 * Restores the saved scene state
 *
 *   arg0: Fade speed
 */
void Script_ScenePopState_b()
{
  if (scene_stack_ptr)
  {
    scene_stack_ptr--;

    scene_next_index = scene_stack[scene_stack_ptr].scene_index;
    scene_index = scene_next_index + 1;

    map_next_pos.x = 0; // @wtf-but-needed
    map_next_pos.x = scene_stack[scene_stack_ptr].player_pos.x << 3;
    map_next_pos.y = 0; // @wtf-but-needed
    map_next_pos.y = scene_stack[scene_stack_ptr].player_pos.y << 3;
    map_next_dir.x = scene_stack[scene_stack_ptr].player_dir.x;
    map_next_dir.y = scene_stack[scene_stack_ptr].player_dir.y;

    stage_next_type = SCENE;
    scene_loaded = FALSE;
    script_action_complete = FALSE;
    FadeSetSpeed(script_cmd_args[0]);
    FadeOut();
    script_ptr += 1 + script_cmd_args_len;

    return;
  }

  script_action_complete = TRUE;
  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: SceneResetStack
 * ----------------------------
 * Clear all saved scene state
 */
void Script_SceneResetStack_b()
{
  scene_stack_ptr = 0;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ScenePopAllState
 * ----------------------------
 * Restores the first saved scene state
 */
void Script_ScenePopAllState_b()
{
  if (scene_stack_ptr)
  {
    scene_stack_ptr = 0;

    scene_next_index = scene_stack[scene_stack_ptr].scene_index;
    scene_index = scene_next_index + 1;

    map_next_pos.x = 0; // @wtf-but-needed
    map_next_pos.x = scene_stack[scene_stack_ptr].player_pos.x << 3;
    map_next_pos.y = 0; // @wtf-but-needed
    map_next_pos.y = scene_stack[scene_stack_ptr].player_pos.y << 3;
    map_next_dir.x = scene_stack[scene_stack_ptr].player_dir.x;
    map_next_dir.y = scene_stack[scene_stack_ptr].player_dir.y;

    stage_next_type = SCENE;
    scene_loaded = FALSE;
    script_action_complete = FALSE;
    FadeSetSpeed(script_cmd_args[0]);
    FadeOut();
    script_ptr += 1 + script_cmd_args_len;

    return;
  }

  script_action_complete = TRUE;
  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: SetInputScript
 * ----------------------------
 * Attach script to button press
 */
void Script_SetInputScript_b()
{
  UBYTE input, index;

  input = script_cmd_args[0];

  index = 0;
  while (!(input & 1) && input != 0)
  {
    index += 1;
    input = input >> 1;
  }

  input_script_ptrs[index].bank = script_cmd_args[1];
  input_script_ptrs[index].offset = (script_cmd_args[2] * 256) + script_cmd_args[3];

  script_action_complete = TRUE;
  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: RemoveInputScript
 * ----------------------------
 * Remove script from button press
 */
void Script_RemoveInputScript_b()
{
  UBYTE input, index;

  input = script_cmd_args[0];

  index = 0;
  for (index = 0; index != 8; ++index)
  {
    if (input & 1)
    {
      input_script_ptrs[index].bank = 0;
    }
    input = input >> 1;
  }

  script_action_complete = TRUE;
  script_ptr += 1 + script_cmd_args_len;
}

/*
 * Command: ActorSetFrame
 * ----------------------------
 * Set animation frame of current actor
 */
void Script_ActorSetFrame_b()
{
  actors[script_actor].frame = 0;
  actors[script_actor].flip = 0;
  actors[script_actor].frame = script_cmd_args[0] % actors[script_actor].frames_len;
  SceneRenderActor(script_actor);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetFrameToVal
 * ----------------------------
 * Set animation frame of current actor using variable
 */
void Script_ActorSetFrameToVal_b()
{
  actors[script_actor].frame = 0;
  actors[script_actor].flip = 0;
  actors[script_actor].frame = script_variables[(script_cmd_args[0] * 256) + script_cmd_args[1]] % actors[script_actor].frames_len;
  SceneRenderActor(script_actor);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: ActorSetFlip
 * ----------------------------
 * Set flip state of current actor
 */
void Script_ActorSetFlip_b()
{
  actors[script_actor].flip = 0;
  actors[script_actor].flip = script_cmd_args[0];
  SceneRenderActor(script_actor);
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
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
void Script_TextMulti_b()
{
  UBYTE mode;
  mode = script_cmd_args[0];

  if (mode == 0)
  {
    tmp_text_out_speed = text_out_speed;
    text_out_speed = 0;
  }
  else if (mode == 1)
  {
    tmp_text_in_speed = text_in_speed;
    text_in_speed = 0;
  }
  else if (mode == 2)
  {
    text_out_speed = tmp_text_out_speed;
  }
  else if (mode == 3)
  {
    text_in_speed = tmp_text_in_speed;
    text_out_speed = tmp_text_out_speed;
  }

  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: VariableAddFlags
 * ----------------------------
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_VariableAddFlags_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a | b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: VariableClearFlags
 * ----------------------------
 *   arg0: High 8 bits for flag index
 *   arg1: Low 8 bits for flag index
 *   arg2: Value
 */
void Script_VariableClearFlags_b()
{
  UWORD ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
  UBYTE a = script_variables[ptr];
  UBYTE b = script_cmd_args[2];
  script_variables[ptr] = a & ~b;
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}


/*
 * Command: SoundStartTone
 * ----------------------------
 */
void Script_SoundStartTone_b()
{
  UWORD tone = (script_cmd_args[0] * 256) + script_cmd_args[1];

  // enable sound
  NR52_REG = 0x80;

  // play tone on channel 1
  NR10_REG = 0x00;
  NR11_REG = (0x00 << 6) | 0x01;
  NR12_REG = (0x0F << 4) | 0x00;
  NR13_REG = (tone & 0x00FF);
  NR14_REG = 0x80 | ((tone & 0x0700) >> 8);

  // enable volume
  NR50_REG = 0x77;

  // enable channel 1
  NR51_REG |= 0x11;
  
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}


/*
 * Command: SoundStopTone
 * ----------------------------
 */
void Script_SoundStopTone_b()
{
  // stop tone on channel 1
  NR12_REG = 0x00;
  
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}


/*
 * Command: SoundPlayBeep
 * ----------------------------
 */
void Script_SoundPlayBeep_b()
{
  UBYTE pitch = script_cmd_args[0];

  // enable sound
  NR52_REG = 0x80;

  // play beep sound on channel 4
  NR41_REG = 0x01;
  NR42_REG = (0x0F << 4);
  NR43_REG = 0x20 | 0x08 | pitch;
  NR44_REG = 0x80 | 0x40;

  // enable volume
  NR50_REG = 0x77;

  // enable channel 4
  NR51_REG |= 0x88;
  
  // no delay
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

/*
 * Command: SoundPlayCrash
 * ----------------------------
 */
void Script_SoundPlayCrash_b()
{
  // enable sound
  NR52_REG = 0x80;

  // play crash sound on channel 4
  NR41_REG = 0x01;
  NR42_REG = (0x0F << 4) | 0x02;
  NR43_REG = 0x13;
  NR44_REG = 0x80;

  // enable volume
  NR50_REG = 0x77;

  // enable channel 4
  NR51_REG |= 0x88;
  
  // no delay
  script_ptr += 1 + script_cmd_args_len;
  script_continue = TRUE;
}

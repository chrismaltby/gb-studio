// clang-format off
#pragma bank=4
// clang-format on

#include "ScriptRunner.h"
#include "Scene.h"

UINT8 scriptrunner_bank = 4;

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
  script_ptr = (script_cmd_args[0] * 256) + script_cmd_args[1];
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
  LOG("IF FLAG ((%u * 256) +  %u) = %u\n", script_cmd_args[0], script_cmd_args[1], (script_cmd_args[0] * 256) + script_cmd_args[1]);
  if (script_flags[(script_cmd_args[0] * 256) + script_cmd_args[1]])
  {
    // Trup path, jump to position specified by ptr
    LOG("TRUE PATH\n");
    script_ptr = (script_cmd_args[2] * 256) + script_cmd_args[3];
  }
  else
  {
    // False path, skip to next command
    LOG("FALSE PATH\n");
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
  script_flags[(script_cmd_args[0] * 256) + script_cmd_args[1]] = TRUE;
  script_ptr += 1 + script_cmd_args_len;
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
  script_flags[(script_cmd_args[0] * 256) + script_cmd_args[1]] = FALSE;
  script_ptr += 1 + script_cmd_args_len;
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
  camera_settings = script_cmd_args[2] & ~CAMERA_LOCK_FLAG;
  script_ptr += 1 + script_cmd_args_len;
  script_action_complete = FALSE;
}

/*
 * Command: CameraLock
 * ----------------------------
 * Move camera to specified locatopn.
 *
 *   arg0: Camera destination X (in Tiles)
 *   arg1: Camera destination Y (in Tiles)
 *   arg2: Camera settings
 */
void Script_CameraLock_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_Wait_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_FadeOut_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_FadeIn_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_LoadScene_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_ActorSetPos_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_ActorMoveTo_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_ShowSprites_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_HideSprites_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_ShowPlayer_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_HidePlayer_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_ActorSetEmote_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_CameraShake_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

void Script_ReturnToTitle_b()
{
  script_ptr += 1 + script_cmd_args_len;
}

#pragma bank=11

#include "script_cmds.h"
#include "Scene.h"
#include "FadeManager.h"
#include "data_ptrs.h"

void script_cmd_end()
{
  script_ptr = 0;
}

void script_cmd_goto()
{
  script_ptr = (script_arg1 * 256) + script_arg2;
  script_continue = TRUE;
}

void script_cmd_if_flag()
{
  if (script_flags[script_arg1]) {
    script_ptr = (script_arg2 * 256) + script_arg3;
  } else {
    script_ptr += 4;
  }
  script_continue = TRUE;
}

void script_cmd_unless_flag()
{
  if (script_flags[script_arg1]) {
    script_ptr += 4;
  } else {
    script_ptr = (script_arg2 * 256) + script_arg3;
  }
  script_continue = TRUE;
}

void script_cmd_set_flag()
{
  script_flags[script_arg1] = TRUE;
  script_ptr += 2;
  script_continue = TRUE;
}

void script_cmd_clear_flag()
{
  script_flags[script_arg1] = FALSE;
  script_ptr += 2;
  script_continue = TRUE;
}

void script_cmd_actor_dir()
{
  actors[script_actor].dir.x = script_arg1 == 2 ? -1 : script_arg1 == 4 ? 1 : 0;
  actors[script_actor].dir.y = script_arg1 == 8 ? -1 : script_arg1 == 1 ? 1 : 0;
  actors[script_actor].redraw = TRUE;
  script_ptr += 2;
  script_continue = TRUE;
}

void script_cmd_active_actor()
{
  script_actor = script_arg1;
  script_ptr += 2;
  script_continue = TRUE;
}

void script_cmd_camera_move()
{
  camera_dest.x = script_arg1 << 3;
  camera_dest.y = 0;            // @wtf-but-needed
  camera_dest.y = script_arg2 << 3;
  camera_settings = script_arg3 & ~CAMERA_LOCK_FLAG;
  script_ptr += 4;
  script_action_complete = FALSE;
}

void script_cmd_camera_lock()
{
  camera_settings = script_arg1 | CAMERA_LOCK_FLAG;
  script_ptr += 2;
  script_action_complete = FALSE;
}

void script_cmd_wait()
{
  wait_time = script_arg1;
  script_ptr += 2;
  script_action_complete = FALSE;
}

void script_fade_out()
{
  FadeOut();
  FadeSetSpeed(script_arg1);
  script_ptr += 2;
  script_action_complete = FALSE;
}

void script_fade_in()
{
  FadeIn();
  FadeSetSpeed(script_arg1);  
  script_ptr += 2;
  script_action_complete = FALSE;
}

void script_load_map()
{
  map_next_index = script_arg1;

  map_next_pos.x = 0;           // @wtf-but-needed
  map_next_pos.x = (script_arg2 << 3) + 8;
  map_next_pos.y = 0;           // @wtf-but-needed
  map_next_pos.y = (script_arg3 << 3) + 8;
  map_next_dir.x = script_arg4 == 2 ? -1 : script_arg4 == 4 ? 1 : 0;
  map_next_dir.y = script_arg4 == 8 ? -1 : script_arg4 == 1 ? 1 : 0;

  actors[0].redraw = TRUE;

  script_ptr += 6;
  stage_next_type = MAP;
  script_action_complete = FALSE;

  FadeSetSpeed(script_arg5);
  FadeOut();
}

void script_cmd_actor_pos()
{
  LOG("SET actor=%d x=%d, y=%d\n", script_actor, script_arg1, script_arg2);
  actors[script_actor].pos.x = 0;       // @wtf-but-needed
  actors[script_actor].pos.x = (script_arg1 << 3) + 8;
  actors[script_actor].pos.y = 0;       // @wtf-but-needed
  actors[script_actor].pos.y = (script_arg2 << 3) + 8;

  LOG("MOVE TO %d %d\n", (script_arg1 << 3) + 8, (script_arg2 << 3) + 8);

  script_ptr += 3;
  script_continue = TRUE;
}

void script_actor_move_to()
{
  LOG("SET MOVE actor=%d x=%d, y=%d\n", script_actor, script_arg1, script_arg2);
  actor_move_settings |= ACTOR_MOVE_ENABLED;
  actor_move_dest.x = 0;        // @wtf-but-needed
  actor_move_dest.x = (script_arg1 << 3) + 8;
  actor_move_dest.y = 0;        // @wtf-but-needed
  actor_move_dest.y = (script_arg2 << 3) + 8;

  script_ptr += 3;
  script_action_complete = FALSE;
}

void script_cmd_show_sprites()
{
  SHOW_SPRITES;
  script_ptr += 1;
  script_continue = TRUE;
}

void script_cmd_hide_sprites()
{
  HIDE_SPRITES;
  script_ptr += 1;
  script_continue = TRUE;
}

void script_load_battle()
{
  script_ptr += 2;
  stage_next_type = BATTLE;
  script_action_complete = FALSE;
  FadeSetSpeed(3);
  FadeOut();
}

void script_cmd_show_player()
{
  actors[0].enabled = TRUE;
  script_ptr += 1;
  script_continue = TRUE;
}

void script_cmd_hide_player()
{
  actors[0].enabled = FALSE;
  script_ptr += 1;
  script_continue = TRUE;
}

void script_cmd_camera_shake()
{
  shake_time = script_arg1;
  script_ptr += 2;
  script_action_complete = FALSE;
}

void script_cmd_return_title()
{
  script_ptr += 1;
  stage_next_type = TITLE;
  script_action_complete = FALSE;
  FadeSetSpeed(3);
  FadeOut();  
}

// void script_load_image()
// {
// MAYBE DONT NEED COULD LOAD A MAP AND HIDE SPRITES???
// PROBABLY NOT THO
// }

// void script_actor_set_bg_movement_type()
// {
//   actors[script_actor].movement_type = script_arg1;
//   script_ptr += 2;
//   script_continue = TRUE;    
// }

// void script_actor_set_sprite()
// {
// }

// void script_load_battle()
// {

// }

// void script_add_item()
// {

// }

// void script_take_item()
// {

// }

#include "game.h"
#include "UI.h"
#include "Logo.h"
#include "Title.h"
#include "Scene.h"
#include "FadeManager.h"
#include "data_ptrs.h"

UBYTE joy;
UBYTE prev_joy;
UBYTE time;

POS camera_dest;
UBYTE camera_settings = CAMERA_LOCK_FLAG;
UBYTE wait_time = 0;
UBYTE shake_time = 0;
UBYTE actor_move_settings;
POS actor_move_dest;
STAGE_TYPE stage_type;
STAGE_TYPE stage_next_type = MAP;
typedef void (*STAGE_UPDATE_FN)();
STAGE_UPDATE_FN UpdateFn;

UWORD script_ptr = 0;
SCRIPT_CMD_FN last_fn;
UBYTE script_continue;
UBYTE script_arg1;
UBYTE script_arg2;
UBYTE script_arg3;
UBYTE script_arg4;
UBYTE script_arg5;
UBYTE script_action_complete = TRUE;
UBYTE script_actor;

SCRIPT_CMD_FN script_fns[] = {
    script_cmd_end,          // 0x00
    script_cmd_line,         // 0x01
    script_cmd_goto,         // 0x02
    script_cmd_if_flag,      // 0x03
    script_cmd_unless_flag,  // 0x04
    script_cmd_set_flag,     // 0x05
    script_cmd_clear_flag,   // 0x06
    script_cmd_actor_dir,    // 0x07
    script_cmd_active_actor, // 0x08
    script_cmd_camera_move,  // 0x09
    script_cmd_camera_lock,  // 0x0A
    script_cmd_wait,         // 0x0B
    script_fade_out,         // 0x0C
    script_fade_in,          // 0x0D
    script_load_map,         // 0x0E
    script_cmd_actor_pos,    // 0x0F
    script_actor_move_to,    // 0x10
    script_cmd_show_sprites, // 0x11
    script_cmd_hide_sprites, // 0x12
    script_load_battle,      // 0x13
    script_cmd_show_player,  // 0x14
    script_cmd_hide_player,  // 0x15
    script_cmd_set_emotion,  // 0x16
    script_cmd_camera_shake, // 0x17
    script_cmd_return_title, // 0x18
};

int main()
{
  // Init LCD
  LCDC_REG = 0x67;
  set_interrupts(VBL_IFLAG | LCD_IFLAG);
  STAT_REG = 0x45;

  // Set palettes
  BGP_REG = 0xE4U;
  OBP0_REG = 0xD2U;

  // Position Window Layer
  WY_REG = MAXWNDPOSY - 7;
  WY_REG = MAXWNDPOSY + 1;

  actors[0].sprite = 0;
  actors[0].redraw = TRUE;
  map_next_pos.x = actors[0].pos.x = (START_SCENE_X << 3) + 8;
  map_next_pos.y = actors[0].pos.y = (START_SCENE_Y << 3) + 8;
  map_next_dir.x = actors[0].dir.x =
      START_SCENE_DIR == 2 ? -1 : START_SCENE_DIR == 4 ? 1 : 0;
  map_next_dir.y = actors[0].dir.y =
      START_SCENE_DIR == 8 ? -1 : START_SCENE_DIR == 1 ? 1 : 0;
  actors[0].animated = TRUE;
  actors[0].movement_type = PLAYER_INPUT;
  actors[0].enabled = TRUE;

  // scene_index = START_SCENE_INDEX;
  // scene_next_index = START_SCENE_INDEX;

  scene_index = 12;
  scene_next_index = 12;

  UIInit();

  UpdateFn = SceneUpdate;

  DISPLAY_ON;
  SHOW_SPRITES;

  FadeInit();

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(game_loop, 60, 1);
#else
  while (1)
  {
    game_loop();
  }
#endif
}

void game_loop()
{

#ifdef __EMSCRIPTEN__
  emscripten_update_registers(SCX_REG, SCY_REG,
                              WX_REG, WY_REG,
                              LYC_REG, LCDC_REG, BGP_REG, OBP0_REG, OBP1_REG);
#endif

  wait_vbl_done();
  LYC_REG = 0x0;

  joy = joypad();

  // Handle stage switch
  if (stage_type != stage_next_type && !IsFading())
  {

    if (stage_type == TITLE)
    {
      TitleCleanup();
    }

    stage_type = stage_next_type;
    scene_index = scene_next_index;

    map_next_pos.x = actors[0].pos.x;
    map_next_pos.y = actors[0].pos.y;
    map_next_dir.x = actors[0].dir.x;
    map_next_dir.y = actors[0].dir.y;

    if (stage_type == MAP)
    {
      SceneInit();
      UpdateFn = SceneUpdate;
    }
    else if (stage_type == LOGO)
    {
      LogoInit();
      UpdateFn = LogoUpdate;
    }
    else if (stage_type == TITLE)
    {
      TitleInit();
      UpdateFn = TitleUpdate;
    }
  }

  UpdateFn();

  // Move to map update?
  run_script();

  // Handle Fade
  FadeUpdate();

  prev_joy = joy;
  time++;
}

void run_script()
{
  UBYTE cmd;
  if (!script_ptr || !ScriptLastFnComplete())
  {
    return;
  }

  cmd = 5;

  return;

  /*
  script_continue = FALSE;
  script_action_complete = TRUE;

  SWITCH_ROM_MBC1(4);
  cmd = script[script_ptr];
  script_arg1 = script[script_ptr + 1];
  script_arg2 = script[script_ptr + 2];
  script_arg3 = script[script_ptr + 3];
  script_arg4 = script[script_ptr + 4];
  script_arg5 = script[script_ptr + 5];
 
  SWITCH_ROM_MBC1(11);
  last_fn = script_fns[cmd];
  last_fn();

  if (script_continue) {
    run_script();
  }
  */
}

void script_cmd_line()
{
  script_action_complete = FALSE;
  script_ptr += 3;
  set_text_line((script_arg1 * 256) + script_arg2);
}

void script_cmd_set_emotion()
{
  script_ptr += 3;
  // MapSetEmotion(script_arg1, script_arg2);
  script_action_complete = FALSE;
  script_continue = FALSE;
}

UBYTE ScriptLastFnComplete()
{

  if (script_action_complete)
  {
    return TRUE;
  }

  if (last_fn == script_fade_in && !IsFading())
  {
    return TRUE;
  }

  if (last_fn == script_fade_out && !IsFading())
  {
    return TRUE;
  }

  if (last_fn == script_load_map && !IsFading())
  {
    return TRUE;
  }

  // Disabled until implemented in scene
  // if(last_fn == script_cmd_set_emotion && !IsEmoting()) {
  //   return TRUE;
  // }

  return FALSE;
}

#include "game.h"
// #include "gbt_player.h"
#include "UI.h"
#include "Logo.h"
#include "Title.h"
#include "Pong.h"
#include "Scene.h"
#include "FadeManager.h"
#include "data_ptrs.h"

extern const unsigned char *song_mymod3_Data[];
extern const unsigned char *song_tetris_Data[];
extern const unsigned char *song_effects_Data[];
// extern const unsigned char * song_instr_Data[];
extern const unsigned char *song_instrcm_Data[];

UBYTE running = TRUE;
UBYTE joy;
UBYTE prev_joy;
UBYTE time;
UBYTE frame_offset = 1;
ACTOR actors[MAX_ACTORS];
TRIGGER triggers[MAX_TRIGGERS];

UWORD map_index = 0;
UBYTE map_actor_num = 5;
UBYTE map_trigger_num = 0;

POS camera_dest;
UBYTE camera_settings = CAMERA_LOCK_FLAG;
UBYTE wait_time = 0;
UBYTE shake_time = 0;
UBYTE actor_move_settings;
POS actor_move_dest;
VEC2D update_actor_dir;
UBYTE first_frame_on_tile = FALSE;
STAGE_TYPE stage_type;
STAGE_TYPE stage_next_type = TITLE;
typedef void (*STAGE_UPDATE_FN) ();
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
  script_cmd_end,               // 0x00
  script_cmd_line,              // 0x01
  script_cmd_goto,              // 0x02
  script_cmd_if_flag,           // 0x03
  script_cmd_unless_flag,       // 0x04
  script_cmd_set_flag,          // 0x05
  script_cmd_clear_flag,        // 0x06
  script_cmd_actor_dir,         // 0x07
  script_cmd_active_actor,      // 0x08
  script_cmd_camera_move,       // 0x09
  script_cmd_camera_lock,       // 0x0A
  script_cmd_wait,              // 0x0B
  script_fade_out,              // 0x0C
  script_fade_in,               // 0x0D
  script_load_map,              // 0x0E
  script_cmd_actor_pos,         // 0x0F
  script_actor_move_to,         // 0x10
  script_cmd_show_sprites,      // 0x11
  script_cmd_hide_sprites,      // 0x12
  script_load_battle,           // 0x13
  script_cmd_show_player,       // 0x14
  script_cmd_hide_player,       // 0x15 
  script_cmd_set_emotion,       // 0x16 
  script_cmd_camera_shake,      // 0x17
  script_cmd_return_title,      // 0x18
};

UBYTE bit_mask[] = { 128, 64, 32, 16, 8, 4, 2, 1 };


// const unsigned char *map;
// const unsigned char *map_col;

int main()
{
  // UBYTE ptr_l, ptr_h;
  // Init LCD
  LCDC_REG = 0x67;
  set_interrupts(VBL_IFLAG | LCD_IFLAG);
  STAT_REG = 0x45;

  // Set palettes
  BGP_REG = 0xE4U;
  OBP0_REG = 0xD2U;

  // Position Window Layer
  WX_REG = 7;
  // WY_REG = MAXWNDPOSY - 7;
  // WY_REG = MAXWNDPOSY + 1;

  WY_REG = 96;

  SWITCH_ROM_MBC1(3);
  // set_sprite_data(0, 128, village_sprites);

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

  map_index = START_SCENE_INDEX;
  map_next_index = START_SCENE_INDEX;

  UIInit();

  UpdateFn = SceneUpdate;
  // UpdateFn = BattleUpdate;

  // set_text_line(0);

  DISPLAY_ON;
  SHOW_SPRITES;

  FadeInit();

  /*
     if (map_index != 0) {
     gbt_play(song_tetris_Data, 28, 7);
     // gbt_play(song_effects_Data, 28, 7);   // Bank 28  
     gbt_loop(1); 
     } else {
     // gbt_play(song_mymod3_Data, 2, 7);
     // gbt_play(song_tetris_Data, 2, 7);
     // gbt_play(song_effects_Data, 2, 7);
     gbt_play(song_instrcm_Data, 28, 7);    // Bank 28
     gbt_loop(1); 
     }
   */

  running = TRUE;

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(game_loop, 60, 1);
#else
  while (1) {
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

  if (!running) {
    return;
  }

  UpdateFn();


  // Move to map update?
  run_script();

  // Handle Fade
  FadeUpdate();

  // Handle stage switch
  if (stage_type != stage_next_type && !IsFading()) {

    if (stage_type == TITLE) {
      TitleCleanup();
    }

    stage_type = stage_next_type;
    map_index = map_next_index;

    map_next_pos.x = actors[0].pos.x;
    map_next_pos.y = actors[0].pos.y;
    map_next_dir.x = actors[0].dir.x;
    map_next_dir.y = actors[0].dir.y;

    if (stage_type == MAP) {
      SceneInit();
      UpdateFn = SceneUpdate;
    } else if (stage_type == BATTLE) {
      PongInit();
      UpdateFn = PongUpdate;
    } else if (stage_type == LOGO) {
      LogoInit();
      UpdateFn = LogoUpdate;
    } else if (stage_type == TITLE) {
      TitleInit();
      UpdateFn = TitleUpdate;
    } else if (stage_type == PONG) {
      PongInit();
      UpdateFn = PongUpdate;
    }
  }


  prev_joy = joy;
  time++;


  // gbt_update();

}

void run_script()
{
  UBYTE cmd;
  if (!script_ptr || !ScriptLastFnComplete()) {
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

  if (script_action_complete) {
    return TRUE;
  }

  if (last_fn == script_fade_in && !IsFading()) {
    return TRUE;
  }

  if (last_fn == script_fade_out && !IsFading()) {
    return TRUE;
  }

  if (last_fn == script_load_map && !IsFading()) {
    return TRUE;
  }

  if (last_fn == script_load_battle && stage_type != BATTLE && !IsFading()) {
    return TRUE;
  }

  // Disabled until implemented in scene
  // if(last_fn == script_cmd_set_emotion && !IsEmoting()) {
  //   return TRUE;
  // }

  return FALSE;
}

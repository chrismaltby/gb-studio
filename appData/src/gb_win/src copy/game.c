#include "game.h"
#include "UI.h"
#include "Scene.h"
#include "FadeManager.h"
#include "data_ptrs.h"
#include "ScriptRunner.h"

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
STAGE_TYPE stage_next_type = LOGO;
typedef void (*STAGE_UPDATE_FN)();
STAGE_UPDATE_FN UpdateFn;
UBYTE script_continue;
UBYTE script_action_complete = TRUE;
UBYTE script_actor;
//SCRIPT_CMD_FN last_fn;

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
  map_next_dir.x = actors[0].dir.x = 1;
  map_next_dir.y = actors[0].dir.y = 0;
  actors[0].movement_type = PLAYER_INPUT;
  actors[0].enabled = TRUE;

  scene_index = START_SCENE_INDEX;
  scene_next_index = START_SCENE_INDEX;

  UIInit();

  LogoInit();
  // UpdateFn = SceneUpdate;

  DISPLAY_ON;
  SHOW_SPRITES;

  FadeInit();

  game_loop();
}

void game_loop()
{
  wait_vbl_done();
  LYC_REG = 0x0;

  joy = joypad();

  // Handle stage switch
  if (stage_type != stage_next_type && !IsFading())
  {
    stage_type = stage_next_type;
    scene_index = scene_next_index;

    map_next_pos.x = actors[0].pos.x;
    map_next_pos.y = actors[0].pos.y;
    map_next_dir.x = actors[0].dir.x;
    map_next_dir.y = actors[0].dir.y;

    // if (stage_type == MAP)
    // {
    //   LogoInit();
    //   UpdateFn = LogoUpdate;
    // }
  }

  LogoUpdate();

  // Handle Fade
  FadeUpdate();

  prev_joy = joy;
  time++;
}

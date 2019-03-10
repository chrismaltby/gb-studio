#include "game.h"
#include "UI.h"
#include "Scene.h"
#include "FadeManager.h"
#include "data_ptrs.h"
#include "ScriptRunner.h"
#include "Logo.h"
#include "gbt_player.h"

UBYTE joy;
UBYTE prev_joy;
UBYTE time;

UBYTE actor_move_settings;
POS actor_move_dest;
STAGE_TYPE stage_type;
STAGE_TYPE stage_next_type = MAP;
typedef void (*STAGE_UPDATE_FN)();
STAGE_UPDATE_FN UpdateFn;
UBYTE script_continue;
UBYTE script_action_complete = TRUE;
UBYTE script_actor;

extern const unsigned char song_palette_town0[];
extern const unsigned char *song_palette_town_Data[];

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
  FadeInit();

  UpdateFn = SceneUpdate;

  DISPLAY_ON;
  SHOW_SPRITES;

  gbt_play(song_palette_town_Data, 28, 7);
  gbt_loop(TRUE);

  while (1)
  {
    game_loop();
  }
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

    if (stage_type == MAP)
    {
      SceneInit();
    }
    else if (stage_type == LOGO)
    {
      LogoInit();
    }
  }

  if (stage_type == MAP)
  {
    SceneUpdate();
  }
  else if (stage_type == LOGO)
  {
    LogoUpdate();
  }
  // UpdateFn();

  // Handle Fade
  FadeUpdate();

  prev_joy = joy;
  time++;

  gbt_update();
}

#include "game.h"
#include "UI.h"
#include "Scene.h"
#include "FadeManager.h"
#include "BankData.h"
#include "ScriptRunner.h"
#include "Macros.h"
#include "gbt_player.h"

UBYTE joy;
UBYTE prev_joy;
UBYTE time;

UBYTE actor_move_settings;
POS actor_move_dest;
STAGE_TYPE stage_type;
STAGE_TYPE stage_next_type = SCENE;
typedef void (*STAGE_UPDATE_FN)();
UBYTE script_continue;
UBYTE script_action_complete = TRUE;
UBYTE script_actor;

extern const unsigned char song_palette_town0[];
extern const unsigned char *song_palette_town_Data[];

void game_loop();

int main()
{
  BANK_PTR sprite_bank_ptr;
  UWORD sprite_ptr;
  UBYTE sprite_index, sprite_frames, sprite_len;

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
  actors[0].moving = TRUE;
  map_next_pos.x = actors[0].pos.x = (START_SCENE_X << 3) + 8;
  map_next_pos.y = actors[0].pos.y = (START_SCENE_Y << 3) + 8;
  map_next_dir.x = actors[0].dir.x = START_SCENE_DIR_X;
  map_next_dir.y = actors[0].dir.y = START_SCENE_DIR_Y;
  actors[0].movement_type = PLAYER_INPUT;
  actors[0].enabled = TRUE;

  // Load Player Sprite
  sprite_index = START_PLAYER_SPRITE;
  ReadBankedBankPtr(16, &sprite_bank_ptr, &sprite_bank_ptrs[sprite_index]);
  sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
  sprite_frames = ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr);
  sprite_len = MUL_4(sprite_frames);
  SetBankedSpriteData(sprite_bank_ptr.bank, 0, sprite_len, sprite_ptr + 1);
  actors[0].sprite = 0;
  actors[0].sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  actors[0].redraw = TRUE;

  scene_index = START_SCENE_INDEX;
  scene_next_index = START_SCENE_INDEX;

  FadeInit();

  DISPLAY_ON;
  SHOW_SPRITES;

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

    if (stage_type == SCENE)
    {
      SceneInit();
    }
  }

  if (stage_type == SCENE)
  {
    SceneUpdate();
  }

  // Handle Fade
  FadeUpdate();

  prev_joy = joy;
  time++;

  gbt_update();
}

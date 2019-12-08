#include "game.h"
#include "FadeManager.h"

UBYTE fade_running;

static UBYTE fade_frame;
static UBYTE fade_frames_per_step;
static UBYTE fade_timer;
static FADE_DIRECTION fade_direction;

static const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};
static const UBYTE obj_fade_vals[] = {0x00, 0x00, 0x42, 0x82, 0xD2, 0xD2};
static const UBYTE bgp_fade_vals[] = {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4};
//static const UBYTE obj_fade_to_black_vals[] = {0xF3, 0xF3, 0xE3, 0xE2, 0xD2, 0xD2};
//static const UBYTE bgp_fade_to_black_vals[] = {0xFF, 0xFF, 0xFE, 0xF9, 0xE9, 0xE4};

static UINT16 custom_bg_pal_fade_steps[][4] = {
  { 0, 0, 0, 0 }, // 0
  { 0, 0, 0, 0 }, // 1
  { 0, 0, 0, 0 }, // 2
  { 0, 0, 0, 0 }, // 3
  { 0, 0, 0, 0 }, // 4
  { 0, 0, 0, 0 }  // 5
};
static UINT16 custom_spr1_pal_fade_steps[][4] = {
  { 0, 0, 0, 0 }, // 0
  { 0, 0, 0, 0 }, // 1
  { 0, 0, 0, 0 }, // 2
  { 0, 0, 0, 0 }, // 3
  { 0, 0, 0, 0 }, // 4
  { 0, 0, 0, 0 }  // 5
};

static const UBYTE bg_fade_indexes[][4] = {
  { 4, 4, 4, 4 }, // 0
  { 4, 4, 4, 0 }, // 1
  { 4, 4, 0, 1 }, // 2 
  { 4, 0, 1, 2 }, // 3
  { 0, 1, 2, 3 }, // 4
  { 0, 1, 2, 3 }  // 5
};

void ApplyPaletteChange(UBYTE index)
{
  #ifdef CUSTOM_COLORS
  if (_cpu == CGB_TYPE) {
    set_bkg_palette(0, 1, custom_bg_pal_fade_steps[index]);
    // set_sprite_palette(0, 1, custom_spr1_pal_fade_steps[index]);
  } 
  else 
  #endif
  {
    OBP0_REG = obj_fade_vals[index];
    BGP_REG = bgp_fade_vals[index];
  }
}

void FadeInit()
{
  fade_frames_per_step = fade_speeds[2];
}

void FadeIn()
{
  fade_frame = 0;
  fade_direction = FADE_IN;
  fade_running = TRUE;
  fade_timer = 0;
  ApplyPaletteChange(fade_timer);
}

void FadeOut()
{
  fade_frame = 0;
  fade_direction = FADE_OUT;
  fade_running = TRUE;
  fade_timer = 5;
  ApplyPaletteChange(fade_timer);
}

void FadeUpdate()
{
  if (fade_running)
  {
    if ((fade_frame & fade_frames_per_step) == 0)
    {
      if (fade_direction == FADE_IN)
      {
        fade_timer++;
        if (fade_timer == 5)
        {
          fade_running = FALSE;
        }
      }
      else
      {
        fade_timer--;
        if (fade_timer == 0)
        {
          fade_running = FALSE;
        }
      }
    }

    ApplyPaletteChange(fade_timer);
    fade_frame++;
  }
}

void FadeSetSpeed(UBYTE speed)
{
  fade_frames_per_step = fade_speeds[speed];
}

#ifdef CUSTOM_COLORS
void FadeSetBackgroundPalette(UBYTE palette_index) {
  UBYTE i, j, fade_index;
  UINT16 c;
  for (i = 0; i < 6; i++)
  {
    for (j = 0; j < 4; j++)
    {
      fade_index = bg_fade_indexes[i][j];

      c = fade_index == 4 ? RGB_WHITE : custom_pal[palette_index][fade_index];
      custom_bg_pal_fade_steps[i][j] = c;
    }
  }
}
#endif

UBYTE IsFading()
{
  return fade_running;
}

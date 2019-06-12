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

void ApplyPaletteChange(UBYTE index)
{
  #ifdef CUSTOM_COLORS
  if (_cpu == CGB_TYPE) {
    if (index == 0 || index == 1)
    {
      set_bkg_palette(0, 1, custom_bg_pal_fade_step4);
      set_sprite_palette(0, 1, custom_spr1_pal_fade_step4);
    } 
    else if (index == 2)
    {
      set_bkg_palette(0, 1, custom_bg_pal_fade_step3);
      set_sprite_palette(0, 1, custom_spr1_pal_fade_step3);
    }
    else if (index == 3)
    {
      set_bkg_palette(0, 1, custom_bg_pal_fade_step2);
      set_sprite_palette(0, 1, custom_spr1_pal_fade_step2);
    }
    else if (index == 4)
    {
      set_bkg_palette(0, 1, custom_bg_pal_fade_step1);
      set_sprite_palette(0, 1, custom_spr1_pal_fade_step1);
    }
    else if (index == 5)
    {
      set_bkg_palette(0, 1, custom_bg_pal);
      set_sprite_palette(0, 1, custom_spr1_pal);
    }
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

UBYTE IsFading()
{
  return fade_running;
}

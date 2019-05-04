#include "FadeManager.h"

UBYTE fade_running;

static UBYTE fade_frame;
static UBYTE fade_frames_per_step;
static UBYTE fade_timer;
static FADE_DIRECTION fade_direction;

static const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};
static const UBYTE obj_fade_vals[] = {0x00, 0x00, 0x42, 0x82, 0xD2, 0xD2};
static const UBYTE bgp_fade_vals[] = {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4};

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
  OBP0_REG = obj_fade_vals[fade_timer];
  BGP_REG = bgp_fade_vals[fade_timer];
}

void FadeOut()
{
  fade_frame = 0;
  fade_direction = FADE_OUT;
  fade_running = TRUE;
  fade_timer = 5;
  OBP0_REG = obj_fade_vals[fade_timer];
  BGP_REG = bgp_fade_vals[fade_timer];
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
    OBP0_REG = obj_fade_vals[fade_timer];
    BGP_REG = bgp_fade_vals[fade_timer];
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

// clang-format off
#pragma bank=1
// clang-format on

#include "FadeManager.h"

static UBYTE fade_frame;
static UBYTE fade_timer;
static FADE_DIRECTION fade_direction;

static const UBYTE obj_fade_vals[] = {0x00, 0x00, 0x42, 0x82, 0xD2, 0xD2};
static const UBYTE bgp_fade_vals[] = {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4};

void ApplyPaletteChange(UBYTE index) {
  LOG("ApplyPaletteChange index=%u\n", index);
  //   #ifdef CUSTOM_COLORS
  //   if (_cpu == CGB_TYPE) {
  //     if (index == 0 || index == 1) {
  //       set_bkg_palette(0, 1, obj_fade_vals);
  //       set_sprite_palette(0, 1, obj_fade_vals);
  //     } else if (index == 2) {
  //       set_bkg_palette(0, 1, obj_fade_vals);
  //       set_sprite_palette(0, 1, obj_fade_vals);
  //     } else if (index == 3) {
  //       set_bkg_palette(0, 1, obj_fade_vals);
  //       set_sprite_palette(0, 1, obj_fade_vals);
  //     } else if (index == 4) {
  //       set_bkg_palette(0, 1, obj_fade_vals);
  //       set_sprite_palette(0, 1, obj_fade_vals);
  //     } else if (index == 5) {
  //       set_bkg_palette(0, 1, obj_fade_vals);
  //       set_sprite_palette(0, 1, obj_fade_vals);
  //     }
  //   } else
  //   #endif
  //   {
  //     OBP0_REG = obj_fade_vals[index];
  //     BGP_REG = bgp_fade_vals[index];
  //   }
  OBP0_REG = obj_fade_vals[index];
  BGP_REG = bgp_fade_vals[index];
}

void FadeIn_b() {
  fade_frame = 0;
  fade_direction = FADE_IN;
  fade_running = TRUE;
  fade_timer = 0;
  ApplyPaletteChange(fade_timer);
}

void FadeOut_b() {
  fade_frame = 0;
  fade_direction = FADE_OUT;
  fade_running = TRUE;
  fade_timer = 5;
  ApplyPaletteChange(fade_timer);
}

void FadeUpdate_b() {
  if (fade_running) {
    if ((fade_frame & fade_frames_per_step) == 0) {
      if (fade_direction == FADE_IN) {
        fade_timer++;
        if (fade_timer == 5) {
          fade_running = FALSE;
        }
      } else {
        fade_timer--;
        if (fade_timer == 0) {
          fade_running = FALSE;
        }
      }
    }

    ApplyPaletteChange(fade_timer);
    fade_frame++;
  }
}
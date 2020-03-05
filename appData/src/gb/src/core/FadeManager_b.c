// clang-format off
#pragma bank=1
// clang-format on

#include "FadeManager.h"
#include <gb/cgb.h>
#include "Palette.h"
#include "Math.h"

static UBYTE fade_frame;
static UBYTE fade_timer;
static FADE_DIRECTION fade_direction;

static const UBYTE obj_fade_vals[] = {0x00, 0x00, 0x42, 0x82, 0xD2, 0xD2};
static const UBYTE bgp_fade_vals[] = {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4};

UWORD UpdateColor(UINT8 i, UWORD col) {
  return RGB2(PAL_RED(col) | DespRight(0x1F, i), PAL_GREEN(col) | DespRight(0x1F, i),
              PAL_BLUE(col) | DespRight(0x1F, i));
}

void ApplyPaletteChange(UBYTE index) {
  UINT8 pal, c;
  UWORD palette[4];
  UWORD palette_s[4];
  UWORD *col = BkgPalette;
  UWORD *col_s = SprPalette;

  for (pal = 0; pal < 8; pal++) {
    for (c = 0; c < 4; ++c, ++col, ++col_s) {
      palette[c] = UpdateColor(index, *col);
      palette_s[c] = UpdateColor(index, *col_s);
    };
    set_bkg_palette(pal, 1, palette);
    set_sprite_palette(pal, 1, palette_s);
  }

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

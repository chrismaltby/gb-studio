#pragma bank 1

#include "FadeManager.h"
#include <gb/cgb.h>
#include "Palette.h"
#include "Math.h"

static UBYTE fade_frame;
static FADE_DIRECTION fade_direction;

static const UBYTE obj_fade_vals[] = {0x00, 0x00, 0x40, 0x80, 0x90, 0xD0, 0xD0};
static const UBYTE bgp_fade_vals[] = {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4, 0xE4};

static const UBYTE obj_fade_black_vals[] = {0xFF, 0xFF, 0xF8, 0xE4, 0xD4, 0xD0, 0xD0};
static const UBYTE bgp_fade_black_vals[] = {0xFF, 0xFF, 0xFE, 0xE9, 0xE5, 0xE4, 0xE4};

UWORD UpdateColorBlack(UINT8 i, UWORD col) {
  return RGB2(DespRight(PAL_RED(col), 6 - i),  DespRight(PAL_GREEN(col), 6 - i),
              DespRight(PAL_BLUE(col), 6 - i));
}

UWORD UpdateColorWhite(UINT8 i, UWORD col) {
  return RGB2(PAL_RED(col) | DespRight(0x1F, i - 1), PAL_GREEN(col) | DespRight(0x1F, i - 1),
              PAL_BLUE(col) | DespRight(0x1F, i - 1));
}

void ApplyPaletteChangeColor(UBYTE index) {
  UINT8 pal, c;
  UWORD palette[4];
  UWORD palette_s[4];
  UWORD* col = BkgPalette;
  UWORD* col_s = SprPalette;

  if (index == 0) {
    index = 1;
  }

  if (fade_black) {
    for (pal = 0; pal != 8; pal++) {
      for (c = 0; c != 4; ++c, ++col, ++col_s) {
        palette[c] = UpdateColorBlack(index, *col);
        palette_s[c] = UpdateColorBlack(index, *col_s);
      };
      set_bkg_palette(pal, 1, palette);
      set_sprite_palette(pal, 1, palette_s);
    }
  } else { 
    for (pal = 0; pal != 8; pal++) {
      for (c = 0; c != 4; ++c, ++col, ++col_s) {
        palette[c] = UpdateColorWhite(index, *col);
        palette_s[c] = UpdateColorWhite(index, *col_s);
      };
      set_bkg_palette(pal, 1, palette);
      set_sprite_palette(pal, 1, palette_s);
    }
  }
}

void ApplyPaletteChangeDMG(UBYTE index) {
  if (!fade_black) {
    OBP0_REG = obj_fade_vals[index];
    BGP_REG = bgp_fade_vals[index];
  }
  else {
    OBP0_REG = obj_fade_black_vals[index];
    BGP_REG = bgp_fade_black_vals[index];
  }
}

void FadeIn_b() {
  fade_frame = 0;
  fade_direction = FADE_IN;
  fade_running = TRUE;
  fade_timer = 0;
#ifdef CGB
  if (_cpu == CGB_TYPE) {
    ApplyPaletteChangeColor(fade_timer);
  } else
#endif
    ApplyPaletteChangeDMG(fade_timer);
}

void FadeOut_b() {
  fade_frame = 0;
  fade_direction = FADE_OUT;
  fade_running = TRUE;
  fade_timer = 5;
#ifdef CGB
  if (_cpu == CGB_TYPE) {
    ApplyPaletteChangeColor(fade_timer);
  } else
#endif
    ApplyPaletteChangeDMG(fade_timer);
}

void FadeUpdate_b() {
  if (fade_running) {
    if ((fade_frame & fade_frames_per_step) == 0) {
      if (fade_direction == FADE_IN) {
        fade_timer++;
        if (fade_timer == 6) {
          fade_running = FALSE;
        }
      } else {
        fade_timer--;
        if (fade_timer == 0) {
          fade_running = FALSE;
        }
      }
#ifdef CGB
      if (_cpu == CGB_TYPE) {
        ApplyPaletteChangeColor(fade_timer);
      } else
#endif
        ApplyPaletteChangeDMG(fade_timer);
    }
    fade_frame++;
  }
}

void ApplyPaletteChange_b() {
#ifdef CGB
  if (_cpu == CGB_TYPE) {
    ApplyPaletteChangeColor(6);
  } else
#endif
    ApplyPaletteChangeDMG(6);
}

void ForcePaletteFade_b() {
#ifdef CGB
  if (_cpu == CGB_TYPE) {
    ApplyPaletteChangeColor(0);
  } else
#endif
    ApplyPaletteChangeDMG(0);
}

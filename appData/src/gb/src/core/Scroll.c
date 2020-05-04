#include "Scroll.h"

#include "ASMHelpers.h"
#include "Actor.h"
#include "BankManager.h"
#include "Core_Main.h"
#include "DataManager.h"
#include "GameTime.h"

INT16 scroll_x = 0;
INT16 scroll_y = 0;

INT16 scroll_offset_x = 0;

INT16 pending_h_x, pending_h_y;
UINT8 pending_h_i;
unsigned char *pending_h_map = 0;
unsigned char *pending_w_map = 0;
#ifdef CGB
unsigned char *pending_h_cmap = 0;
unsigned char *pending_w_cmap = 0;
#endif
INT16 pending_w_x, pending_w_y;
UINT8 pending_w_i;
Pos *scroll_target = 0;

void ScrollUpdateRow(INT16 x, INT16 y);
void RenderScreen();
void RefreshScroll_b();

/* Update pending (up to 5) rows */
void ScrollUpdateRowR() {
  UINT8 i = 0u;
  UINT16 id;
  UBYTE y_offset;

  y_offset = MOD_32(pending_w_y);

  PUSH_BANK(image_bank);

#ifdef CGB
  if (_cpu == CGB_TYPE) {  // Color Row Load
    for (i = 0u; i != 5 && pending_w_i != 0; ++i, --pending_w_i) {
      id = 0x9800 + MOD_32(pending_w_x++) + ((UINT16)y_offset << 5);
      PUSH_BANK(image_attr_bank);
      VBK_REG = 1;
      // set_bkg_tiles(MOD_32(pending_w_x), y_offset, 1, 1, pending_w_cmap++);
      SetTile(id, *pending_w_cmap);
      VBK_REG = 0;
      POP_BANK;
      // set_bkg_tiles(MOD_32(pending_w_x++), y_offset, 1, 1, pending_w_map++);
      SetTile(id, *pending_w_map);
      pending_w_map++;
      pending_w_cmap++;
    }
  } else
#endif
  {  // DMG Row Load
    for (i = 0u; i != 5 && pending_w_i != 0; ++i, --pending_w_i) {
      // set_bkg_tiles(MOD_32(pending_w_x++), MOD_32(pending_w_y), 1, 1, pending_w_map++);
      id = 0x9800 + MOD_32(pending_w_x++) + ((UINT16)y_offset << 5);
      SetTile(id, *pending_w_map);
      pending_w_map++;
    }
  }

  POP_BANK;
}

void ScrollUpdateRowWithDelay(INT16 x, INT16 y) {
  UBYTE i;

  while (pending_w_i) {
    ScrollUpdateRowR();
  }

  pending_w_x = x;
  pending_w_y = y;

  pending_w_i = SCREEN_TILE_REFRES_W;
  pending_w_map = image_ptr + image_tile_width * y + x;

  for (i = 1; i != actors_len; i++) {
    // LOG("CHECK ROW %u - %d - %u - %u\n", i, y, actors[i].pos.y, actors[i].pos.y >> 3);
    if (actors[i].pos.y >> 3 == y) {
      ActivateActor(i);
    }
  }

#ifdef CGB
  pending_w_cmap = image_attr_ptr + image_tile_width * y + x;
#endif

  // ActivateActor(2);
}

void ScrollUpdateRow(INT16 x, INT16 y) {
  UINT8 i = 0u;
  UBYTE screen_x, screen_y;
  unsigned char *map = image_ptr + image_tile_width * y + x;
#ifdef CGB
  unsigned char *cmap = image_attr_ptr + image_tile_width * y + x;
#endif

  PUSH_BANK(image_bank);

  LOG("INIT ScrollUpdateRow [%d, %d]\n", x, y);

  screen_x = MOD_32(x);
  screen_y = MOD_32(y);

  if (screen_x <= 9) {
    // If screen doesn't wrap in X direction can draw entire row in single draw call
#ifdef CGB
    PUSH_BANK(image_attr_bank);
    VBK_REG = 1;
    set_bkg_tiles(screen_x, screen_y, 23, 1, cmap);
    VBK_REG = 0;
    POP_BANK;
#endif
    set_bkg_tiles(screen_x, screen_y, 23, 1, map);
  } else {
    // If screen does wrap render right hand side first then left hand side
#ifdef CGB
    PUSH_BANK(image_attr_bank);
    VBK_REG = 1;
    set_bkg_tiles(screen_x, screen_y, 32 - screen_x, 1, cmap);
    cmap += 32 - screen_x;
    set_bkg_tiles(MOD_32(screen_x + (32 - screen_x)), screen_y, 23 - (32 - screen_x), 1, cmap);
    VBK_REG = 0;
    POP_BANK;
#endif
    set_bkg_tiles(screen_x, screen_y, 32 - screen_x, 1, map);
    map += 32 - screen_x;
    set_bkg_tiles(MOD_32(screen_x + (32 - screen_x)), screen_y, 23 - (32 - screen_x), 1, map);
  }

  // Activate Actors in Row
  for (i = 1; i != actors_len; i++) {
    if (actors[i].pos.y >> 3 == y) {
      INT16 tx = actors[i].pos.x >> 3;
      if (tx >= x && tx <= x + 23) {
        ActivateActor(i);
      }
    }
  }

  POP_BANK;
}

void ScrollUpdateColumnR() {
  UINT8 i = 0u;
  UBYTE a = 0;
  UINT16 id = 0;
  UBYTE x_offset;

  PUSH_BANK(image_bank);

  x_offset = MOD_32(pending_h_x);

#ifdef CGB
  if (_cpu == CGB_TYPE) {  // Color Column Load
    for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--) {
      id = 0x9800 + (0x1F & (x_offset)) + ((0x1F & (MOD_32(pending_h_y))) << 5);
      PUSH_BANK(image_attr_bank);
      VBK_REG = 1;
      // set_bkg_tiles(x_offset, MOD_32(pending_h_y), 1, 1, pending_h_cmap);
      SetTile(id, *pending_h_cmap);
      VBK_REG = 0;
      POP_BANK;
      // set_bkg_tiles(x_offset, MOD_32(pending_h_y++), 1, 1, pending_h_map);
      SetTile(id, *pending_h_map);
      pending_h_y++;
      pending_h_map += image_tile_width;
      pending_h_cmap += image_tile_width;
    }
  } else
#endif
  {  // DMG Column Load
    for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--) {
      // set_bkg_tiles(x_offset, MOD_32(pending_h_y++), 1, 1, pending_h_map);
      id = 0x9800 + (0x1F & (x_offset)) + ((0x1F & (MOD_32(pending_h_y++))) << 5);
      SetTile(id, *pending_h_map);
      pending_h_map += image_tile_width;
    }
  }

  POP_BANK;
}

void ScrollUpdateColumnWithDelay(INT16 x, INT16 y) {
  UBYTE i;

  while (pending_h_i) {
    // If previous column wasn't fully rendered
    // render it now before starting next column
    ScrollUpdateColumnR();
  }

  for (i = 1; i != actors_len; i++) {
    if (actors[i].pos.x >> 3 == x) {
      ActivateActor(i);
    }
  }

  pending_h_x = x;
  pending_h_y = y;
  pending_h_i = SCREEN_TILE_REFRES_H;
  pending_h_map = image_ptr + image_tile_width * y + x;

#ifdef CGB
  pending_h_cmap = image_attr_ptr + image_tile_width * y + x;
#endif
}

void RefreshScroll() {
  PUSH_BANK(SCROLL_BANK);
  RefreshScroll_b();
  POP_BANK;
}

void InitScroll() {
  pending_w_i = 0;
  pending_h_i = 0;
  RefreshScroll();
  RenderScreen();
}

void RenderScreen() {
  UINT8 i;
  INT16 y;

  DISPLAY_OFF;

  // Clear pending rows/ columns
  pending_w_i = 0;
  pending_h_i = 0;

  PUSH_BANK(image_bank);
  y = scroll_y >> 3;
  for (i = 0u; i != (SCREEN_TILE_REFRES_H) && y != image_height; ++i, y++) {
    ScrollUpdateRow((scroll_x >> 3) - SCREEN_PAD_LEFT, y - SCREEN_PAD_TOP);
  }
  POP_BANK;

  DISPLAY_ON;
}

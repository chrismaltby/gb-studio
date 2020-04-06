#include "Scroll.h"

#include "Actor.h"
#include "BankManager.h"
#include "Core_Main.h"
#include "DataManager.h"
#include "GameTime.h"

#define SCREEN_TILES_W 20  // 160 >> 3 = 20
#define SCREEN_TILES_H 18  // 144 >> 3 = 18
#define SCREEN_PAD_LEFT 1
#define SCREEN_PAD_RIGHT 2
#define SCREEN_PAD_TOP 1
#define SCREEN_PAD_BOTTOM 2

#define SCREEN_TILE_REFRES_W (SCREEN_TILES_W + SCREEN_PAD_LEFT + SCREEN_PAD_RIGHT)
#define SCREEN_TILE_REFRES_H (SCREEN_TILES_H + SCREEN_PAD_TOP + SCREEN_PAD_BOTTOM)

INT16 scroll_x = 0;
INT16 scroll_y = 0;

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

extern UINT8 scroll_top_movement_limit;
extern UINT8 scroll_bottom_movement_limit;

void ScrollUpdateRow(INT16 x, INT16 y);
void RenderScreen();

void MoveScroll(INT16 x, INT16 y) {
  INT16 current_column, new_column, current_row, new_row;
  UBYTE render = FALSE;

  PUSH_BANK(image_bank);

  if (U_LESS_THAN(x, 0u)) {
    x = 0u;
  }
  if (U_LESS_THAN(y, 0u)) {
    y = 0u;
  }
  if (x > (image_width - ((UINT16)SCREENWIDTH))) {
    x = (image_width - (SCREENWIDTH));
  }
  if (y > (image_height - ((UINT16)SCREENHEIGHT))) {
    y = (image_height - (SCREENHEIGHT));
  }

  current_column = scroll_x >> 3;
  new_column = x >> 3;
  current_row = scroll_y >> 3;
  new_row = y >> 3;

  // If column is +/- 1 just render next column
  if (current_column == new_column - 1) {
    // Render right column
    ScrollUpdateColumnWithDelay(new_column - SCREEN_PAD_LEFT + SCREEN_TILE_REFRES_W - 1,
                                new_row - SCREEN_PAD_TOP);
  } else if (current_column == new_column + 1) {
    // Render left column
    ScrollUpdateColumnWithDelay(new_column - SCREEN_PAD_LEFT, new_row - SCREEN_PAD_TOP);
  } else if (current_column != new_column) {
    // If column differs by more than 1 render entire screen
    render = TRUE;
  }

  // If row is +/- 1 just render next row
  if (current_row == new_row - 1) {
    // Render bottom row
    ScrollUpdateRowWithDelay(new_column - SCREEN_PAD_LEFT,
                             new_row - SCREEN_PAD_TOP + SCREEN_TILE_REFRES_H - 1);
  } else if (current_row == new_row + 1) {
    // Render top row
    ScrollUpdateRowWithDelay(new_column - SCREEN_PAD_LEFT, new_row - SCREEN_PAD_TOP);
  } else if (current_row != new_row) {
    // If row differs by more than 1 render entire screen
    render = TRUE;
  }

  scroll_x = x;
  scroll_y = y;

  if (render) {
    RenderScreen();
  } else if (IS_FRAME_2) {
    if (pending_w_i) {
      // Render next pending chunk of row
      ScrollUpdateRowR();
    }
    if (pending_h_i) {
      // Render next pending chunk of column
      ScrollUpdateColumnR();
    }
  }

  POP_BANK;
}

/* Update pending (up to 5) rows */
void ScrollUpdateRowR() {
  UINT8 i = 0u;

#ifdef CGB
  if (_cpu == CGB_TYPE) {  // Color Row Load
    for (i = 0u; i != 5 && pending_w_i != 0; ++i, --pending_w_i) {
      PUSH_BANK(image_attr_bank);
      VBK_REG = 1;
      set_bkg_tiles(MOD_32(pending_w_x), MOD_32(pending_w_y), 1, 1, pending_w_cmap++);
      VBK_REG = 0;
      POP_BANK;
      set_bkg_tiles(MOD_32(pending_w_x++), MOD_32(pending_w_y), 1, 1, pending_w_map++);
    }
  } else
#endif
  {  // DMG Row Load
    for (i = 0u; i != 5 && pending_w_i != 0; ++i, --pending_w_i) {
      set_bkg_tiles(MOD_32(pending_w_x++), MOD_32(pending_w_y), 1, 1, pending_w_map++);
    }
  }
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
  unsigned char *map = image_ptr + image_tile_width * y + x;

#ifdef CGB
  unsigned char *cmap = image_attr_ptr + image_tile_width * y + x;
#endif

  LOG("INIT ScrollUpdateRow [%d, %d]\n", x, y);

  for (i = 0u; i != 23; i++) {
#ifdef CGB
    PUSH_BANK(image_attr_bank);
    VBK_REG = 1;
    set_bkg_tiles(MOD_32(x + i), MOD_32(y), 1, 1, cmap++);
    VBK_REG = 0;
    POP_BANK;
#endif
    // LOG("SET TILE x= %u\n", x + i);
    set_bkg_tiles(MOD_32(x + i), MOD_32(y), 1, 1, map++);
  }

  for (i = 1; i != actors_len; i++) {
    // LOG("CHECK ROW %u - %d - %u - %u\n", i, y, actors[i].pos.y, actors[i].pos.y >> 3);
    if (actors[i].pos.y >> 3 == y) {
      INT16 tx = actors[i].pos.x >> 3;
      if (tx >= x && tx <= x + 23) {
        // LOG("ROW ACTIVATE %u\n", i);
        ActivateActor(i);
      }
    }
  }
}

void ScrollUpdateColumnR() {
  UINT8 i = 0u;
  UBYTE a = 0;

#ifdef CGB
  if (_cpu == CGB_TYPE) {  // Color Column Load
    for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--) {
      PUSH_BANK(image_attr_bank);
      VBK_REG = 1;
      set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y), 1, 1, pending_h_cmap);
      VBK_REG = 0;
      POP_BANK;
      set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y++), 1, 1, pending_h_map);
      pending_h_map += image_tile_width;
      pending_h_cmap += image_tile_width;
    }
  } else
#endif
  {  // DMG Column Load
    for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--) {
      set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y++), 1, 1, pending_h_map);
      pending_h_map += image_tile_width;
    }
  }
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
  // UINT16 ny = scroll_y;

  if (scroll_target) {
    // if(U_LESS_THAN(scroll_bottom_movement_limit, scroll_target->y - scroll_y)) {
    // 	ny = scroll_target->y - scroll_bottom_movement_limit;
    // } else if(U_LESS_THAN(scroll_target->y - scroll_y, scroll_top_movement_limit)) {
    // 	ny = scroll_target->y - scroll_top_movement_limit;
    // }

    MoveScroll(scroll_target->x - (SCREENWIDTH >> 1), scroll_target->y - (SCREENHEIGHT >> 1));
  }
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

#pragma bank 1

#include "DataManager.h"
#include "GameTime.h"
#include "Scroll.h"

void ScrollUpdateRowWithDelay(INT16 x, INT16 y);
void ScrollUpdateColumnWithDelay(INT16 x, INT16 y);
void ScrollUpdateRowR();
void ScrollUpdateColumnR();

void RefreshScroll_b() __banked {
  INT16 x, y;
  INT16 current_column, new_column, current_row, new_row;
  UBYTE render = FALSE;

  x = scroll_target->x - (SCREENWIDTH >> 1);
  y = scroll_target->y - (SCREENHEIGHT >> 1);

  if (x & 0x8000u) {  // check for negative signed bit
    x = 0u;
  } else if (x > scroll_x_max) {
    x = scroll_x_max;
  }
  if (y & 0x8000u) {
    y = 0u;
  } else if (y > scroll_y_max) {
    y = scroll_y_max;
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
  draw_scroll_x = x + scroll_offset_x;
  draw_scroll_y = y + scroll_offset_y;

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
}

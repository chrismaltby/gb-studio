#include "Scroll.h"
#include "Math.h"
#include "DataManager.h"
#include "BankManager.h"
#include "Data.h"

#define SCREEN_TILES_W 20 // 160 >> 3 = 20
#define SCREEN_TILES_H 18 // 144 >> 3 = 18
#define SCREEN_PAD_LEFT 1
#define SCREEN_PAD_RIGHT 2
#define SCREEN_PAD_TOP 1
#define SCREEN_PAD_BOTTOM 2

#define SCREEN_TILE_REFRES_W (SCREEN_TILES_W + SCREEN_PAD_LEFT + SCREEN_PAD_RIGHT)
#define SCREEN_TILE_REFRES_H (SCREEN_TILES_H + SCREEN_PAD_TOP + SCREEN_PAD_BOTTOM)

INT16 scroll_x = 0;
INT16 scroll_y = 0;
// UINT16 image_width = 640U;
// UINT16 image_height = 640U;
// UINT16 image_width = 256U;
// UINT16 image_height = 256U;

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
Pos* scroll_target = 0;

extern UINT8 scroll_top_movement_limit;
extern UINT8 scroll_bottom_movement_limit;

void MoveScroll(INT16 x, INT16 y)
{
  INT16 current_column, new_column, current_row, new_row;

  PUSH_BANK(image_bank);

  // ClampScrollLimits(&x, &y);

  if (U_LESS_THAN(x, 0u))
  {
    x = 0u;
  }
  if (U_LESS_THAN(y, 0u))
  {
    y = 0u;
  }
  if (x > (image_width - ((UINT16)SCREENWIDTH)))
  {
    x = (image_width - (SCREENWIDTH));
  }
  if (y > (image_height - ((UINT16)SCREENHEIGHT)))
  {
    y = (image_height - (SCREENHEIGHT));
  }

  current_column = scroll_x >> 3;
  new_column = x >> 3;
  current_row = scroll_y >> 3;
  new_row = y >> 3;

  if (current_column != new_column)
  {
    if (new_column > current_column)
    {
      ScrollUpdateColumnWithDelay(new_column - SCREEN_PAD_LEFT + SCREEN_TILE_REFRES_W - 1, new_row - SCREEN_PAD_TOP);
    }
    else
    {
      ScrollUpdateColumnWithDelay(new_column - SCREEN_PAD_LEFT, new_row - SCREEN_PAD_TOP);
    }
  }

  if (current_row != new_row)
  {
    if (new_row > current_row)
    {
      ScrollUpdateRowWithDelay(new_column - SCREEN_PAD_LEFT, new_row - SCREEN_PAD_TOP + SCREEN_TILE_REFRES_H - 1);
      // ScrollUpdateRowWithDelay(new_column - SCREEN_PAD_LEFT, 5U);
    }
    else
    {
      ScrollUpdateRowWithDelay(new_column - SCREEN_PAD_LEFT, new_row - SCREEN_PAD_TOP);
    }
  }

  scroll_x = x;
  scroll_y = y;

  if (pending_w_i)
  {
    ScrollUpdateRowR();
  }
  if (pending_h_i)
  {
    ScrollUpdateColumnR();
  }

  POP_BANK;
}

INT8 image_height_border = 0;
UINT8 clamp_enabled = 1;
void ClampScrollLimits(UINT16 *x, UINT16 *y)
{
  // if (clamp_enabled)
  // {
  // if (*y > (image_height - ((UINT16)SCREENHEIGHT)))
  // {
  //   *y = (image_height - ((UINT16)SCREENHEIGHT));
  // }
  if (*x > (image_width - ((UINT16)SCREENWIDTH)))
  {
    *x = (image_width - (SCREENWIDTH));
  }
  if (*y > (image_height - ((UINT16)SCREENHEIGHT)))
  {
    *y = (image_height - (SCREENHEIGHT));
  }

  // if (*y > (image_height - ((UINT16)SCREENHEIGHT) + ((UINT16)image_height_border)))
  // {
  //   *y = (image_height - ((UINT16)SCREENHEIGHT) + ((UINT16)image_height_border));
  // }
  if (U_LESS_THAN(*x, 0u))
  {
    *x = 0u;
  }

  if (U_LESS_THAN(*y, 0u))
  {
    *y = 0u;
  }

  // }
}

/* Update pending (up to 5) rows */
void ScrollUpdateRowR()
{
  UINT8 i = 0u;

  for (i = 0u; i != 5 && pending_w_i != 0; ++i, --pending_w_i)
  {
#ifdef CGB
    PUSH_BANK(image_attr_bank);
    VBK_REG = 1;
    set_bkg_tiles(MOD_32(pending_w_x), MOD_32(pending_w_y), 1, 1, pending_w_cmap++);
    VBK_REG = 0;
    POP_BANK;
    set_bkg_tiles(MOD_32(pending_w_x++), MOD_32(pending_w_y), 1, 1, pending_w_map++);
    // UPDATE_TILE(pending_w_x++, pending_w_y, pending_w_map++, pending_w_cmap++);
#else
    // UPDATE_TILE(pending_w_x ++, pending_w_y, pending_w_map ++,0);
    set_bkg_tiles(MOD_32(pending_w_x++), MOD_32(pending_w_y), 1, 1, pending_w_map++);
#endif
  }
}

void ScrollUpdateRowWithDelay(INT16 x, INT16 y)
{
  while (pending_w_i)
  {
    ScrollUpdateRowR();
  }

  pending_w_x = x;
  pending_w_y = y;

  pending_w_i = SCREEN_TILE_REFRES_W;
  pending_w_map = image_ptr + image_tile_width * y + x;

#ifdef CGB
  pending_w_cmap = image_attr_ptr + image_tile_width * y + x;
#endif
}

void ScrollUpdateColumnR()
{
  UINT8 i = 0u;

/*
#ifdef CGB
  VBK_REG = 1;
  PUSH_BANK(image_attr_bank);
  for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--)
  {
    // set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y), 1, 1, pending_h_cmap);
    set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y++), 1, 1, pending_h_cmap);
    pending_h_cmap += image_tile_width;
  }
  POP_BANK;
  VBK_REG = 0;
#endif

  for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--)
  {
    // UPDATE_TILE(pending_h_x, pending_h_y ++, pending_h_map, 0);
    set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y++), 1, 1, pending_h_map);
    pending_h_map += image_tile_width;

  }
*/


  for (i = 0u; i != 5 && pending_h_i != 0; ++i, pending_h_i--)
  {
#ifdef CGB
    PUSH_BANK(image_attr_bank);
    VBK_REG = 1;
    set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y), 1, 1, pending_h_cmap);
    VBK_REG = 0;
    POP_BANK;
    set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y++), 1, 1, pending_h_map);
    // UPDATE_TILE(pending_h_x, pending_h_y ++, pending_h_map, pending_h_cmap);
    pending_h_map += image_tile_width;
    pending_h_cmap += image_tile_width;
#else
    // UPDATE_TILE(pending_h_x, pending_h_y ++, pending_h_map, 0);
    set_bkg_tiles(MOD_32(pending_h_x), MOD_32(pending_h_y++), 1, 1, pending_h_map);
    pending_h_map += image_tile_width;
#endif
  }

}

void ScrollUpdateColumnWithDelay(INT16 x, INT16 y)
{
  while (pending_h_i)
  {
    ScrollUpdateColumnR();
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

	if(scroll_target) {
		// if(U_LESS_THAN(scroll_bottom_movement_limit, scroll_target->y - scroll_y)) {
		// 	ny = scroll_target->y - scroll_bottom_movement_limit;
		// } else if(U_LESS_THAN(scroll_target->y - scroll_y, scroll_top_movement_limit)) {
		// 	ny = scroll_target->y - scroll_top_movement_limit;
		// }

		MoveScroll(scroll_target->x - (SCREENWIDTH >> 1), scroll_target->y - (SCREENHEIGHT >> 1));
	}
}

#ifndef SCROLL_H
#define SCROLL_H

#include <gb/gb.h>

#include "compat.h"
#include "parallax.h"

#define SCROLL_BANK 1
#define SCREEN_TILES_W 20  // 160 >> 3 = 20
#define SCREEN_TILES_H 18  // 144 >> 3 = 18
#define SCREEN_PAD_LEFT 1
#define SCREEN_PAD_RIGHT 2
#define SCREEN_PAD_TOP 1
#define SCREEN_PAD_BOTTOM 2
#define SCREEN_TILE_REFRES_W (SCREEN_TILES_W + SCREEN_PAD_LEFT + SCREEN_PAD_RIGHT)
#define SCREEN_TILE_REFRES_H (SCREEN_TILES_H + SCREEN_PAD_TOP + SCREEN_PAD_BOTTOM)
#define PENDING_BATCH_SIZE 7

extern INT16 scroll_x;
extern INT16 scroll_y;
extern INT16 draw_scroll_x;
extern INT16 draw_scroll_y;
extern UINT16 scroll_x_max;
extern UINT16 scroll_y_max;
extern BYTE scroll_offset_x;
extern BYTE scroll_offset_y;
extern UINT8 pending_w_i;
extern UINT8 pending_h_i;

/**
 * Resets scroll settings on engine start
 */
void scroll_reset() BANKED;

/**
 * Initialise scroll variables, call on scene load
 */
void scroll_init() BANKED;

/**
 * Update scroll position and load in any newly visible background tiles and actors
 */
void scroll_update() BANKED;

/**
 * Resets scroll and update the whole screen 
 */
void scroll_repaint() BANKED;

/**
 * Set vram tile at memory location to a value
 * 
 * @param r address of tile to write to
 * @param t new tile value
 */
void SetTile(UBYTE * r, UINT8 t) OLDCALL PRESERVES_REGS(b, c);

/**
 * Get base address of window map
 */
UINT8 * GetWinAddr() OLDCALL PRESERVES_REGS(b, c, h, l);

/**
 * Get base address of background map
 */
UINT8 * GetBkgAddr() OLDCALL PRESERVES_REGS(b, c, h, l);

/**
 * Set single tile t on window layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 */ 
UBYTE * set_win_tile_xy(UBYTE x, UBYTE y, UBYTE t) OLDCALL PRESERVES_REGS(b, c);

/**
 * Set single tile t on background layer at x,y
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param t tile index
 */ 
UBYTE * set_bkg_tile_xy(UBYTE x, UBYTE y, UBYTE t) OLDCALL PRESERVES_REGS(b, c);

/**
 * Scrolls rectangle area of VRAM filemap by base address 1 row up
 * @param base_addr address of top-left corner
 * @param w width of the area
 * @param h height of the area
 * @param fill tile id to fill the bottom row 
 */
void scroll_rect(UBYTE * base_addr, UBYTE w, UBYTE h, UBYTE fill) OLDCALL BANKED PRESERVES_REGS(b, c);

/**
 * copies scroll position variables into double buffered copies
 * which are used for actual scrolling next frame
 */
inline void scroll_shadow_update() {
    parallax_rows[0].scx = parallax_rows[0].shadow_scx;
    parallax_rows[1].scx = parallax_rows[1].shadow_scx;
    parallax_rows[2].scx = parallax_rows[2].shadow_scx;
}

#endif

#ifndef SCROLL_H
#define SCROLL_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "Math.h"

#define SCROLL_BANK 1
#define SCREEN_TILES_W 20  // 160 >> 3 = 20
#define SCREEN_TILES_H 18  // 144 >> 3 = 18
#define SCREEN_PAD_LEFT 1
#define SCREEN_PAD_RIGHT 2
#define SCREEN_PAD_TOP 1
#define SCREEN_PAD_BOTTOM 2
#define SCREEN_TILE_REFRES_W (SCREEN_TILES_W + SCREEN_PAD_LEFT + SCREEN_PAD_RIGHT)
#define SCREEN_TILE_REFRES_H (SCREEN_TILES_H + SCREEN_PAD_TOP + SCREEN_PAD_BOTTOM)

extern Pos* scroll_target;
extern UINT16 scroll_tiles_w;
extern INT16 scroll_x;
extern INT16 scroll_y;
extern INT16 scroll_offset_x;
extern UINT16 scroll_w;
extern UINT16 scroll_h;
extern UBYTE player_x;
extern UINT8 pending_w_i;
extern UINT8 pending_h_i;

void MoveScroll(INT16 x, INT16 y);
void ScrollUpdateRowWithDelay(INT16 x, INT16 y);
void ScrollUpdateColumnWithDelay(INT16 x, INT16 y);

void ScrollUpdateRowR();
void ScrollUpdateColumnR();

void RefreshScroll();
void InitScroll();
void RenderScreen();

#endif

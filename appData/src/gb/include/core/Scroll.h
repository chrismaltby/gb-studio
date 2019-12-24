#ifndef SCROLL_H
#define SCROLL_H

#include <gb/gb.h>
#include "Data.h"

extern Pos* scroll_target;
extern UINT16 scroll_tiles_w;
extern INT16 scroll_x;
extern INT16 scroll_y;
extern UINT16 scroll_w;
extern UINT16 scroll_h;
extern UBYTE player_x;

void MoveScroll(INT16 x, INT16 y);
void ClampScrollLimits(UINT16* x, UINT16* y);
void ScrollUpdateRow(INT16 x, INT16 y);
void ScrollUpdateColumn(INT16 x, INT16 y);
void ScrollUpdateRowWithDelay(INT16 x, INT16 y);
void ScrollUpdateColumnWithDelay(INT16 x, INT16 y);
void ScrollUpdateRowR();
void ScrollUpdateColumnR();
void RefreshScroll();

#endif

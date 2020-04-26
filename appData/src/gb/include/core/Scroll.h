#ifndef SCROLL_H
#define SCROLL_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "Math.h"

extern Pos *scroll_target;
extern UINT16 scroll_tiles_w;
extern INT16 scroll_x;
extern INT16 scroll_y;
extern INT16 scroll_offset_x;
extern UINT16 scroll_w;
extern UINT16 scroll_h;
extern UBYTE player_x;

void MoveScroll(INT16 x, INT16 y);
void ScrollUpdateRowWithDelay(INT16 x, INT16 y);
void ScrollUpdateColumnWithDelay(INT16 x, INT16 y);

void ScrollUpdateRowR();
void ScrollUpdateColumnR();

void RefreshScroll();
void InitScroll();

#endif

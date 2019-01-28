#ifndef MAP_H
#define MAP_H

#include <gb/gb.h>
#include "game.h"

extern UINT8 map_bank;

// Map Loading
extern UBYTE map_next_index;
extern POS map_next_pos;
extern VEC2D map_next_dir;

void LoadMap();
void MapUpdate();
void MapSetEmotion(UBYTE type, UBYTE actor);
UBYTE IsEmoting();

#endif

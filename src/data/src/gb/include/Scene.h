#ifndef SCENE_H
#define SCENE_H

#include <gb/gb.h>
#include "game.h"

extern UINT8 scene_bank;

extern UWORD map_next_index;
extern POS map_next_pos;
extern VEC2D map_next_dir;
extern ACTOR actors[MAX_ACTORS];
extern TRIGGER triggers[MAX_TRIGGERS];
extern UBYTE scene_col_tiles[128];

#define ACTOR_HEIGHT 16
#define ACTOR_WIDTH 16
#define ACTOR_HALF_WIDTH 8
#define BUBBLE_SPRITE_LEFT 38
#define BUBBLE_SPRITE_RIGHT 39
#define BUBBLE_ANIMATION_FRAMES 15
#define BUBBLE_TOTAL_FRAMES 60

void SceneInit();
void SceneUpdate();

#endif

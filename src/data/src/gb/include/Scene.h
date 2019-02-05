#ifndef SCENE_H
#define SCENE_H

#include <gb/gb.h>
#include "game.h"

extern UINT8 scene_bank;

extern UWORD map_next_index;
extern POS map_next_pos;
extern VEC2D map_next_dir;

void SceneInit();
void SceneUpdate();

#endif

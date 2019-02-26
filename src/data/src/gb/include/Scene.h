#ifndef SCENE_H
#define SCENE_H

#include <gb/gb.h>
#include "game.h"

#define MAX_ACTORS 9
#define MAX_TRIGGERS 8
#define ACTOR_HEIGHT 16
#define ACTOR_WIDTH 16
#define ACTOR_HALF_WIDTH 8
#define ACTOR_MOVE_ENABLED 0x80

#define BUBBLE_SPRITE_LEFT 38
#define BUBBLE_SPRITE_RIGHT 39
#define BUBBLE_ANIMATION_FRAMES 15
#define BUBBLE_TOTAL_FRAMES 60

#define CAMERA_SPEED_MASK 0xF
#define CAMERA_SPEED_1 0x0F
#define CAMERA_SPEED_2 0x07
#define CAMERA_SPEED_3 0x03
#define CAMERA_SPEED_4 0x01
#define CAMERA_SPEED_5 0x00
#define CAMERA_LOCK_FLAG 0x10
#define CAMERA_TRANSITION_FLAG 0x20

extern UINT8 scene_bank;
extern UWORD map_next_index;
extern POS map_next_pos;
extern VEC2D map_next_dir;
extern ACTOR actors[MAX_ACTORS];
extern TRIGGER triggers[MAX_TRIGGERS];
extern UWORD scene_index;
extern UWORD scene_next_index;

void SceneInit();
void SceneUpdate();
void SceneSetEmotion(UBYTE actor, UBYTE type);
UBYTE SceneIsEmoting();

#endif

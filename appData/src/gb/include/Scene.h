#ifndef SCENE_H
#define SCENE_H

#include <gb/gb.h>
#include "game.h"

#define MAX_ACTORS 11
#define MAX_TRIGGERS 10
#define ACTOR_HEIGHT 16
#define ACTOR_WIDTH 16
#define ACTOR_HALF_WIDTH 8
#define ACTOR_MOVE_ENABLED 0x80
#define ACTOR_NOCLIP 0x40

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
extern POS map_next_pos;
extern VEC2D map_next_dir;
extern UBYTE map_next_sprite;
extern ACTOR actors[MAX_ACTORS];
extern TRIGGER triggers[MAX_TRIGGERS];
extern UWORD scene_index;
extern UWORD scene_next_index;
extern UBYTE await_input;
extern POS camera_dest;
extern UBYTE camera_settings;
extern UBYTE camera_speed;
extern UBYTE wait_time;
extern UBYTE shake_time;
extern UBYTE scene_width;
extern UBYTE scene_height;
extern UBYTE actor_move_settings;
extern POS actor_move_dest;

void SceneInit();
void SceneUpdate();
void SceneSetEmote(UBYTE actor, UBYTE type);
UBYTE SceneIsEmoting();
UBYTE SceneCameraAtDest();

#endif

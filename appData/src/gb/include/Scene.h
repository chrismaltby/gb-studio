#ifndef SCENE_H
#define SCENE_H

#include <gb/gb.h>
#include "game.h"

#define MAX_ACTORS 11
#define MAX_TRIGGERS 10
#define NUM_INPUTS 8
#define ACTOR_HEIGHT 16
#define ACTOR_WIDTH 16
#define ACTOR_HALF_WIDTH 8
#define ACTOR_MOVE_ENABLED 0x80
#define ACTOR_NOCLIP 0x40
#define ACTOR_SPRITE_OFFSET 2

#define BUBBLE_SPRITE_LEFT 0
#define BUBBLE_SPRITE_RIGHT 1
#define BUBBLE_ANIMATION_FRAMES 15
#define BUBBLE_TOTAL_FRAMES 60

// bits 1111xxxx for masking cam speed data
#define CAMERA_SPEED_MASK 0xF
/* Only calculated in scriptBuilder.js
#define CAMERA_SPEED_1 0x0F // 1111, only true every 16 frames
#define CAMERA_SPEED_2 0x07 // 1110, move every 8 frames
#define CAMERA_SPEED_3 0x03 // 1100, move every 4 frames
#define CAMERA_SPEED_4 0x01 // 1000, move every 'even' time
#define CAMERA_SPEED_5 0x00 // 0000, always true */

#define CAMERA_LOCK_FLAG 0x10
// bit xxxx0100 for transition, low bits are speed
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
extern BANK_PTR input_script_ptrs[NUM_INPUTS];
extern UBYTE timer_script_duration;
extern UBYTE timer_script_time;
extern BANK_PTR timer_script_ptr;
extern UBYTE scene_loaded;

void SceneInit();
void SceneUpdate();
void SceneSetEmote(UBYTE actor, UBYTE type);
UBYTE SceneIsEmoting();
UBYTE SceneCameraAtDest();
UBYTE SceneAwaitInputPressed();
void SceneRenderActor(UBYTE i);

#endif

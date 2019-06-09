#ifndef GAME_H
#define GAME_H

#define CUSTOM_COLORS

#include <gb/gb.h>

#ifdef CUSTOM_COLORS
	#include <gb/cgb.h>
#endif

#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <rand.h>
#include "GameTypes.h"

#define SCREEN_WIDTH 160
#define SCREEN_HEIGHT 144
#define SCREEN_WIDTH_HALF 80
#define SCREEN_HEIGHT_HALF 72

#ifdef CUSTOM_COLORS
	#define BG_PALETTE_0_R 28
	#define BG_PALETTE_0_G 31
	#define BG_PALETTE_0_B 26
	#define BG_PALETTE_1_R 17
	#define BG_PALETTE_1_G 24
	#define BG_PALETTE_1_B 14
	#define BG_PALETTE_2_R 6
	#define BG_PALETTE_2_G 13
	#define BG_PALETTE_2_B 10
	#define BG_PALETTE_3_R 1
	#define BG_PALETTE_3_G 3
	#define BG_PALETTE_3_B 4

	#define SPRITE1_PALETTE_0_R 28
	#define SPRITE1_PALETTE_0_G 31
	#define SPRITE1_PALETTE_0_B 26
	#define SPRITE1_PALETTE_1_R 17
	#define SPRITE1_PALETTE_1_G 24
	#define SPRITE1_PALETTE_1_B 14
	#define SPRITE1_PALETTE_2_R 1
	#define SPRITE1_PALETTE_2_G 3
	#define SPRITE1_PALETTE_2_B 4
#ifdef CUSTOM_COLORS

extern STAGE_TYPE stage_type;
extern STAGE_TYPE stage_next_type;
extern UBYTE joy;
extern UBYTE prev_joy;
extern UBYTE time;
extern UBYTE text_drawn;

#define MAX_SCENE_STATES 8

extern UBYTE scene_stack_ptr;
extern SCENE_STATE scene_stack[MAX_SCENE_STATES];

#endif

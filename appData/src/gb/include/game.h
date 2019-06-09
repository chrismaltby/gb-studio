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
	#define DMG_WHITE 		RGB(28,  31,  26)
	#define DMG_LIGHTGREEN 	RGB(17,  24,  14)
	#define DMG_DARKGREEN 	RGB(6,  13,  10)
	#define DMG_BLACK 		RGB(1,  3,  4)
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

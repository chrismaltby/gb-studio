#ifndef GAME_H
#define GAME_H

#define CUSTOM_COLORS
#define FAST_CPU

#include <gb/gb.h>

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
#define DMG_WHITE RGB(28, 31, 26)
#define DMG_LIGHTGREEN RGB(17, 24, 14)
#define DMG_DARKGREEN RGB(6, 13, 10)
#define DMG_BLACK RGB(1, 3, 4)

static const UINT16 custom_bg_pal[] = { 			DMG_WHITE, DMG_LIGHTGREEN, 	DMG_DARKGREEN, 	DMG_BLACK };
static const UINT16 custom_bg_pal_fade_step1[] = { 	DMG_WHITE, DMG_LIGHTGREEN, 	DMG_DARKGREEN, 	DMG_DARKGREEN };
static const UINT16 custom_bg_pal_fade_step2[] = { 	DMG_WHITE, DMG_WHITE, 		DMG_LIGHTGREEN, DMG_DARKGREEN };
static const UINT16 custom_bg_pal_fade_step3[] = { 	DMG_WHITE, DMG_WHITE, 		DMG_WHITE, 		DMG_LIGHTGREEN };
static const UINT16 custom_bg_pal_fade_step4[] = { 	DMG_WHITE, DMG_WHITE, 		DMG_WHITE, 		DMG_WHITE };

static const UINT16 custom_spr1_pal[] = { 			DMG_BLACK, 		DMG_WHITE, DMG_LIGHTGREEN, 	DMG_BLACK}; 
static const UINT16 custom_spr1_pal_fade_step1[] = { DMG_DARKGREEN, 	DMG_WHITE, DMG_LIGHTGREEN, 	DMG_DARKGREEN };
static const UINT16 custom_spr1_pal_fade_step2[] = { DMG_LIGHTGREEN,	DMG_WHITE, DMG_LIGHTGREEN, 	DMG_DARKGREEN };
static const UINT16 custom_spr1_pal_fade_step3[] = { DMG_WHITE, 		DMG_WHITE, DMG_WHITE, 		DMG_LIGHTGREEN };
static const UINT16 custom_spr1_pal_fade_step4[] = { DMG_WHITE, 		DMG_WHITE, DMG_WHITE, 		DMG_WHITE };
#endif

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

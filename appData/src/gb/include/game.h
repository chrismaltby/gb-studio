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
#define CUSTOM_PALETTE_0_R 28
#define CUSTOM_PALETTE_0_G 31
#define CUSTOM_PALETTE_0_B 26
#define CUSTOM_PALETTE_1_R 17
#define CUSTOM_PALETTE_1_G 24
#define CUSTOM_PALETTE_1_B 14
#define CUSTOM_PALETTE_2_R 6
#define CUSTOM_PALETTE_2_G 13
#define CUSTOM_PALETTE_2_B 10
#define CUSTOM_PALETTE_3_R 1
#define CUSTOM_PALETTE_3_G 3
#define CUSTOM_PALETTE_3_B 4

UINT16 custom_palette[] = { RGB(CUSTOM_PALETTE_0_R, CUSTOM_PALETTE_0_G, CUSTOM_PALETTE_0_B), 
                            RGB(CUSTOM_PALETTE_1_R, CUSTOM_PALETTE_1_G, CUSTOM_PALETTE_1_B), 
                            RGB(CUSTOM_PALETTE_2_R, CUSTOM_PALETTE_2_G, CUSTOM_PALETTE_2_B), 
                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B)};
UINT16 custom_palette_fade_step1[] = { 	RGB(CUSTOM_PALETTE_1_R, CUSTOM_PALETTE_1_G, CUSTOM_PALETTE_1_B), 
			                            RGB(CUSTOM_PALETTE_2_R, CUSTOM_PALETTE_2_G, CUSTOM_PALETTE_2_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B)};
UINT16 custom_palette_fade_step2[] = { 	RGB(CUSTOM_PALETTE_2_R, CUSTOM_PALETTE_2_G, CUSTOM_PALETTE_2_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B)};
UINT16 custom_palette_fade_step3[] = { 	RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B), 
			                            RGB(CUSTOM_PALETTE_3_R, CUSTOM_PALETTE_3_G, CUSTOM_PALETTE_3_B)};
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

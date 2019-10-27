#ifndef GAME_H
#define GAME_H

#define CUSTOM_COLORS
#define FAST_CPU
#define SWITCH_ROM SWITCH_ROM_MBC5
#define ENABLE_RAM ENABLE_RAM_MBC5
#define DISABLE_RAM DISABLE_RAM_MBC5

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
#include "CustomColors.h"
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

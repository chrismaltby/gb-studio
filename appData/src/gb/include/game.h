#ifndef GAME_H
#define GAME_H

#include <gb/gb.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>

#define DATA_PTRS_BANK 5
#define START_SCENE_INDEX 0x0002
#define START_SCENE_X 0x07
#define START_SCENE_Y 0x07
#define START_SCENE_DIR_X 1
#define START_SCENE_DIR_Y 0
#define START_PLAYER_SPRITE 9
#define START_PLAYER_MOVE_SPEED 1
#define START_PLAYER_ANIM_SPEED 3
#define FONT_BANK 7
#define FONT_BANK_OFFSET 0
#define FRAME_BANK 7
#define FRAME_BANK_OFFSET 3584
#define CURSOR_BANK 7
#define CURSOR_BANK_OFFSET 3728
#define EMOTES_SPRITE_BANK 7
#define EMOTES_SPRITE_BANK_OFFSET 3744
#define NUM_VARIABLES 15

#endif

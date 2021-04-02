#ifndef SCENE_H
#define SCENE_H

#include <gb/gb.h>
#include "gbs_types.h"

extern far_ptr_t current_scene;
extern UBYTE image_bank;
extern UBYTE image_attr_bank;
extern UBYTE collision_bank;
extern unsigned char *image_ptr;
extern unsigned char *image_attr_ptr;
extern unsigned char *collision_ptr;
extern UBYTE image_tile_width;
extern UBYTE image_tile_height;
extern UINT16 image_width;
extern UINT16 image_height;
extern scene_type_e scene_type;
extern UBYTE actors_len;
extern UBYTE sprites_len;
extern UBYTE actors_len;
extern LCD_isr_e scene_LCD_type;

#define SCENE_STACK_SIZE 8

extern scene_stack_item_t scene_stack[SCENE_STACK_SIZE];
extern scene_stack_item_t * scene_stack_ptr;

void load_init() __banked;
UBYTE load_scene(const scene_t * scene, UBYTE bank, UBYTE init_data) __banked;

UBYTE load_sprite(UBYTE sprite_offset, const spritesheet_t * sprite, UBYTE bank) __banked;
void load_player() __banked;
void load_emote(const spritesheet_t * sprite, UBYTE bank) __banked;
void load_animations(const spritesheet_t * sprite, UBYTE bank, animation_t res_animations[4]) __banked;

#endif

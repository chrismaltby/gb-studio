
#ifndef DATA_MANAGER_H
#define DATA_MANAGER_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "BankData.h"

#define DATA_MANAGER_BANK 1

void LoadTiles(UINT16 index);
void LoadUI();
void LoadImage(UINT16 index);
void LoadImageAttr(UINT16 index);
void LoadPalette(UINT16 index);
void LoadScene(UINT16 index);
UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset);

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
extern UBYTE scene_type;
extern UBYTE actors_len;
extern UBYTE sprites_len;
extern UBYTE collisions_len;
extern UBYTE palettes_len;
extern BankPtr scene_events_start_ptr;
extern UBYTE actors_len;

#endif


#ifndef DATA_MANAGER_H
#define DATA_MANAGER_H

#include <gb/gb.h>

void LoadTiles(UINT16 index);
void LoadImage(UINT16 index);
void LoadScene(UINT16 index);
UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset);

extern UBYTE image_bank;
extern unsigned char *image_ptr;
extern unsigned char *image_attr_ptr;
extern UBYTE image_tile_width;
extern UBYTE image_tile_height;
extern UINT16 image_width;
extern UINT16 image_height;

#endif

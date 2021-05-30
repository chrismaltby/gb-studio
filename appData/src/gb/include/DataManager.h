
#ifndef DATA_MANAGER_H
#define DATA_MANAGER_H

#include <gb/gb.h>

#include "BankData.h"

#define DATA_MANAGER_BANK 1

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
extern BankPtr scene_events_start_ptr;
extern UBYTE actors_len;

/**
 * Load tileset into VRAM
 * 
 * @param index tileset index in data_ptrs.h
 */
void LoadTiles(UINT16 index);

/**
 * Load image tiles into background
 * 
 * @param index image index in data_ptrs.h
 */
void LoadImage(UINT16 index);

/**
 * Load image palette color data into background
 * 
 * @param index image attr index in data_ptrs.h
 */
void LoadImageAttr(UINT16 index);

/**
 * Load scene palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadPalette(UINT16 index);

/**
 * Load UI palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadUIPalette(UINT16 index);

/**
 * Load sprite palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadSpritePalette(UINT16 index);

/**
 * Load player sprite palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadPlayerSpritePalette(UINT16 index);

/**
 * Load sprite data at specified location in vram
 * 
 * @param index sprite index in data_ptrs.h
 * @param sprite_offset offset into sprite vram
 * @return size of sprite data in vram
 */
UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset);

/**
 * Load new scene including background image and all actors and triggers
 * 
 * @param index scene index in data_ptrs.h
 */
void LoadScene(UINT16 index);

#endif

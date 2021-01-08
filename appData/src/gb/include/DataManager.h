
#ifndef DATA_MANAGER_H
#define DATA_MANAGER_H

#include <gb/gb.h>

#include "BankData.h"
#include "gbs_types.h"

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
void LoadTiles(const tileset_t *tiles, UBYTE bank);

/**
 * Load image tiles into background
 * 
 * @param index image index in data_ptrs.h
 */
void LoadImage(const background_t *background, UBYTE bank);

/**
 * Load scene palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadPalette(const UBYTE *palette, UBYTE bank);

/**
 * Load UI palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadUIPalette(const UBYTE *data_ptr, UBYTE bank);

/**
 * Load sprite palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadSpritePalette(const UBYTE *data_ptr, UBYTE bank);

/**
 * Load player sprite palette
 * 
 * @param index palette index in data_ptrs.h
 */
void LoadPlayerSpritePalette(const UBYTE *data_ptr, UBYTE bank);

/**
 * Load sprite data at specified location in vram
 * 
 * @param index sprite index in data_ptrs.h
 * @param sprite_offset offset into sprite vram
 * @return size of sprite data in vram
 */
UBYTE LoadSprite(UBYTE sprite_offset, const spritesheet_t *sprite, UBYTE bank);

/**
 * Load new scene including background image and all actors and triggers
 * 
 * @param index scene index in data_ptrs.h
 */
void LoadScene(const scene_t *scene, UBYTE bank);

#endif

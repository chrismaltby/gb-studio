#ifndef SPRITE_H
#define SPRITE_H

#include <gb/gb.h>

#include "Math.h"

#define SPRITE_BANK 1
#define MAX_SPRITES 19
#define MAX_FRAMES 25

typedef enum { SPRITE_STATIC = 0, SPRITE_ACTOR, SPRITE_ACTOR_ANIMATED } SPRITE_TYPE;

typedef struct _SPRITEINFO {
  UBYTE sprite_offset;
  UBYTE frames_len;
  SPRITE_TYPE sprite_type;
} SpriteInfo;

extern SpriteInfo sprites_info[MAX_FRAMES];
extern UINT8 sprite_pool[];
extern UBYTE hide_sprites;

/**
 * Reposition active sprites and rerender any that have changed frame or flipped
 */
void UpdateSprites();

/**
 *  Reset sprite pool and reposition all in use sprites off screen
 */
void SpritePoolReset();

/**
 * Return sprite i to the pool
 *
 * @param i the index to return
 */
void SpritePoolReturn(UINT8 i);

/**
 * Allocate a new available sprite and return the index
 */
UINT8 SpritePoolNext();

#endif

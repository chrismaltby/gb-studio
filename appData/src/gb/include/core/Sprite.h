#ifndef SPRITE_H
#define SPRITE_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "Math.h"

#define MAX_SPRITES 20

typedef struct _SPRITE {
  Pos pos;
  UBYTE sprite;
  UBYTE frame;
  UBYTE frame_offset;
  UBYTE frames_len;
  UBYTE flip;
  UBYTE rerender;
} Sprite;

extern Sprite sprites[MAX_SPRITES];
extern UINT8 sprite_pool[];

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

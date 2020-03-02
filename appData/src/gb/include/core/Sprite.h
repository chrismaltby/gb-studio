#ifndef SPRITE_H
#define SPRITE_H

#include <gbdkjs.h>
#include <gb/gb.h>
#include "Math.h"

#define MAX_SPRITES 20

typedef struct _SPRITE
{
    Pos pos;
    UBYTE sprite;
    UBYTE frame;
    UBYTE frame_offset;
    UBYTE frames_len;
    UBYTE flip;
    UBYTE rerender;
} Sprite;

extern UINT8 sprite_pool[];
extern Sprite sprites[MAX_SPRITES];

void UpdateSprites();
void SpritePoolReset();
void SpritePoolReturn(UINT8 i);
UINT8 SpritePoolNext();

#endif

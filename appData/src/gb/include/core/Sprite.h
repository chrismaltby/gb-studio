#ifndef SPRITE_H
#define SPRITE_H

#include "Data.h"

#define MAX_SPRITES 11
#define MAX_ACTORS 11
#define MAX_TRIGGERS 10

void UpdateSprites();

typedef struct _SPRITE
{
    UBYTE sprite;
    Pos pos;
    UBYTE frame;
    UBYTE frame_offset;
    UBYTE frames_len;
} Sprite; 

extern Sprite sprites[MAX_SPRITES];

#endif

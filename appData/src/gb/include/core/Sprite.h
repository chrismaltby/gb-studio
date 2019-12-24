#ifndef SPRITE_H
#define SPRITE_H

#include "Data.h"

#define MAX_SPRITES 5

void UpdateSprites();

typedef struct _SPRITE 
{
    UBYTE sprite;
    Pos pos;
    UBYTE frame;
    UBYTE frames_len;
} Sprite; 

extern Sprite sprites[MAX_SPRITES];

// typedef struct _ACTORSPRITE
// {
//     UBYTE sprite;
//     POS pos;
//     VEC2D dir;
//     UBYTE redraw;
//     UBYTE frame;
//     UBYTE frames_len;
//     UBYTE animate;
//     UBYTE enabled;
//     UBYTE flip;
//     UBYTE frame_offset;
//     UBYTE moving;
//     UBYTE move_speed;
//     UBYTE anim_speed;
//     UBYTE collisionsEnabled;
//     SPRITE_TYPE sprite_type;
//     UWORD script_ptr;
//     BANK_PTR events_ptr;
//     MOVEMENT_TYPE movement_type;
// } ACTOR;

#endif

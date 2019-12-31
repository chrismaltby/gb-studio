#ifndef ACTOR_H
#define ACTOR_H

#include <gb/gb.h>
#include "Math.h"
#include "Data.h"

#define MAX_ACTORS 11

typedef enum
{
    NONE = 1,
    PLAYER_INPUT,
    AI_RANDOM_FACE,
    AI_INTERACT_FACE,
    AI_RANDOM_WALK,
    AI_ROTATE_TRB
} MOVEMENT_TYPE;

typedef enum
{
    SPRITE_STATIC = 0,
    SPRITE_ACTOR,
    SPRITE_ACTOR_ANIMATED
} SPRITE_TYPE;

typedef struct _ACTORSPRITE
{
    UBYTE sprite;
    Pos pos;
    Vector2D dir;
    UBYTE redraw;
    UBYTE frame;
    UBYTE frames_len;
    UBYTE animate;
    UBYTE enabled;
    UBYTE flip;
    UBYTE frame_offset;
    UBYTE moving;
    UBYTE move_speed;
    UBYTE anim_speed;
    UBYTE collisionsEnabled;
    SPRITE_TYPE sprite_type;
    UWORD script_ptr;
    BankPtr events_ptr;
    MOVEMENT_TYPE movement_type;
} Actor;

extern Actor actors[MAX_ACTORS];

#endif

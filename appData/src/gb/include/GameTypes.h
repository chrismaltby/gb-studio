#ifndef TYPES_H
#define TYPES_H

#include <gb/gb.h>
#include "data_ptrs.h"

typedef enum
{
    SCENE = 1
} STAGE_TYPE;

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

typedef enum
{
    OPERATOR_EQ = 1,
    OPERATOR_NE,
    OPERATOR_LT,
    OPERATOR_GT,
    OPERATOR_LTE,
    OPERATOR_GTE
} OPERATOR_TYPE;

typedef struct _POS
{
    UBYTE x;
    UBYTE y;
} POS;

typedef struct _SIZE
{
    UBYTE w;
    UBYTE h;
} SIZE;

typedef struct _VEC2D
{
    BYTE x;
    BYTE y;
} VEC2D;

typedef struct _ACTORSPRITE
{
    UBYTE sprite;
    POS pos;
    VEC2D dir;
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
    BANK_PTR events_ptr;
    MOVEMENT_TYPE movement_type;
} ACTOR;

typedef struct _TRIGGER
{
    POS pos;
    UBYTE w;
    UBYTE h;
    UWORD script_ptr;
    BANK_PTR events_ptr;
} TRIGGER;

typedef struct _SCENE_STATE
{
    UWORD scene_index;
    POS player_pos;
    VEC2D player_dir;
} SCENE_STATE;

typedef void (*SCRIPT_CMD_FN)();

typedef struct _SCRIPT_CMD
{
    SCRIPT_CMD_FN fn;
    UBYTE args_len;
} SCRIPT_CMD;

#endif

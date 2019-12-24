#ifndef DATA_H
#define DATA_H

#include <gb/gb.h>

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

typedef struct _BankPtr {
  unsigned char bank;
  unsigned int offset;
} BankPtr;

struct BackgroundInfo {
	unsigned char tileIndex;
	unsigned char width;
	unsigned char height;
	unsigned char* data;
};

struct BackgroundInfo {
	unsigned char tileIndex;
	unsigned char width;
	unsigned char height;
	unsigned char* data;
};

struct SpriteInfo {
	unsigned char size;
	unsigned char* data;
};

struct SceneInfo {
	UWORD backgroundIndex;
	UBYTE spritesLength;
	UBYTE actorsLength;
	UBYTE triggersLength;
	UBYTE collisionsLength;
	UBYTE palettesLength;
	BankPtr startScript;
	unsigned char* data;
};

struct TilesInfo {
	unsigned char size;
	unsigned char* data;
};

struct TilesInfo {
	unsigned char size;
	unsigned char* data;
};

struct TilePaletteInfo {
	UWORD p7[4];
	UWORD p6[4];
	UWORD p5[4];
	UWORD p4[4];
	UWORD p3[4];
	UWORD p2[4];
	UWORD p1[4];
	UWORD p0[4];
};

typedef struct _Pos {
	UINT16 x;
	UINT16 y;
} Pos;

typedef struct _Vector2D
{
    BYTE x;
    BYTE y;
} Vector2D;


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
} ACTOR;

typedef struct _TRIGGER
{
    Pos pos;
    UBYTE w;
    UBYTE h;
    UWORD script_ptr;
    BankPtr events_ptr;
} TRIGGER;

#endif

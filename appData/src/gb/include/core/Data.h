#ifndef DATA_H
#define DATA_H

#include <gb/gb.h>
#include "Math.h"
#include "BankData.h"

typedef enum
{
    SCENE = 1
} STAGE_TYPE;


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

struct ActorInfo {
	unsigned char spriteOffset;
	unsigned char spriteType;
	unsigned char dirFrames;
	unsigned char initialFrame;
	unsigned char x;
	unsigned char y;
	unsigned char dir;
	unsigned char movementType;
	unsigned char moveSpeed;
	unsigned char animSpeed;
	BankPtr interactScript;
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


typedef struct _TRIGGER
{
    Pos pos;
    UBYTE w;
    UBYTE h;
    UWORD script_ptr;
    BankPtr events_ptr;
} TRIGGER;

#endif

#ifndef WORLD_HEADER
#define WORLD_HEADER

#include <stdint.h>
#include <gbdk/platform.h>

extern uint16_t currentLevelWidth;
extern uint16_t currentLevelWidthInTiles;
extern uint16_t currentLevelHeight;
extern uint16_t currentLevelHeightInTiles;
extern uint8_t *currentLevelMap;
extern uint8_t currentLevelNonSolidTileCount;

extern uint8_t currentLevel;
extern uint8_t currentAreaBank;
extern uint8_t nextLevel;

uint8_t IsTileSolid(uint16_t worldX,uint16_t worldY);
void SetupCurrentLevel(void);
#endif
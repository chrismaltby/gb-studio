#ifndef COMMON_HEADER
#define COMMON_HEADER

#include <gbdk/platform.h>
#include <gbdk/metasprites.h>

extern uint8_t joypadCurrent, joypadPrevious;

void WaitForStartOrA(void);
void setBKGPalettes(uint8_t count, const palette_color_t *palettes) NONBANKED;
void ShowCentered(uint8_t widthInTiles,uint8_t heightInTiles,uint8_t bank, uint8_t* tileData, uint8_t tileCount, uint8_t* mapData, const palette_color_t* palettes) NONBANKED;
#endif
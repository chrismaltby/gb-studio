#ifndef CAMERA_HEADER
#define CAMERA_HEADER

#include <stdint.h>
#include <gbdk/platform.h>

extern uint16_t camera_x, camera_y;


void UpdateCamera(void) BANKED;
void SetCurrentLevelSubmap(uint8_t x, uint8_t y, uint8_t w, uint8_t h) NONBANKED;

#endif
#ifndef _OAM_UTILS_H_INCLUDE
#define _OAM_UTILS_H_INCLUDE

#include "compat.h"

/**
 * Hides all hardware sprites in range from <= X < to
 * @param from start OAM index
 * @param to finish OAM index
 */ 
void hide_hardware_sprites(UINT8 from, UINT8 to) OLDCALL PRESERVES_REGS(b, c);

#endif
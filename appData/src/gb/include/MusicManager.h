#ifndef MUSIC_MANAGER_H
#define MUSIC_MANAGER_H

#include <gb/gb.h>

void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank);
void MusicStop(UBYTE return_bank);

#endif

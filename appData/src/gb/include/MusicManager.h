#ifndef MUSIC_MANAGER_H
#define MUSIC_MANAGER_H

#include <gb/gb.h>

void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank);
void MusicStop(UBYTE return_bank);
void MusicUpdate();

void SoundPlayTone(UWORD tone, UBYTE frames);
void SoundStopTone();
void SoundPlayBeep(UBYTE pitch);
void SoundPlayCrash();

#endif

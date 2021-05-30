#ifndef MUSIC_MANAGER_H
#define MUSIC_MANAGER_H

#include <gb/gb.h>

/**
 * Play music
 * 
 * @param index index of music in data_ptrs.h
 * @param loop if TRUE will infinitely loop the music
 * @param return_bank The memory bank to be enabled after music has started
 */
void MusicPlay(UBYTE index, UBYTE loop, UBYTE return_bank);

/**
 * Stop currently playing music
 * 
 * @param return_bank The memory bank to be enabled after music has stopped
 */
void MusicStop(UBYTE return_bank);

/**
 * Update music player
 */
void MusicUpdate();

/**
 * Play tone sound effect
 * 
 * @param tone tone of sound
 * @param frames number of frames to play for
 */
void SoundPlayTone(UWORD tone, UBYTE frames);

/**
 * Stop currently playing tone sound effect
 */
void SoundStopTone();

/**
 * Play beep sound effect
 * 
 * @param pitch pitch of sound
 */
void SoundPlayBeep(UBYTE pitch);

/**
 * Play crash sound effect
 */
void SoundPlayCrash();

#endif

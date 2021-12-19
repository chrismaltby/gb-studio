#ifndef MUSIC_MANAGER_H
#define MUSIC_MANAGER_H

#include <gb/gb.h>

#include "events.h"

#ifdef GBT_PLAYER
    #undef HUGE_TRACKER 
    #define TRACK_T UBYTE
    #include "gbt_player.h"
#endif
#ifdef HUGE_TRACKER
    #undef GBT_PLAYER
    #define TRACK_T hUGESong_t
    #include "hUGEDriver.h"
#endif
//#define SAME_TUNE_RESTARTS

extern UBYTE channel_mask;
extern script_event_t music_events[4];

/**
 * Initializes sound and music subsystem
 */
void sound_init() BANKED;

/**
 * Initializes music events subsystem
 * 
 */
void music_init(UBYTE preserve) BANKED;

/**
 * Play music
 * 
 * @param track pointer to track
 * @param bank bank location of track
 * @param loop if TRUE will infinitely loop the music
 */
void music_play(const TRACK_T *track, UBYTE bank, UBYTE loop) NONBANKED;

/**
 * Stop currently playing music
 */
void music_stop() BANKED;

/**
 * Sets music playback position
 * 
 * @param pattern pattern number
 * @param row wor number within pattern (not used)
 */
inline void music_setpos(UBYTE pattern, UBYTE row) {
#ifdef HUGE_TRACKER
    row;
    hUGE_set_position(pattern);
#else 
    pattern; row;
#endif
}

/** 
 * Mutes channels by mask
 * 
 * @param channels channel mask
 */
void music_mute(UBYTE channels) OLDCALL NONBANKED;

/**
 * Update music player
 */
void music_update() OLDCALL NONBANKED;

/**
 * Update music events
 */ 
void music_events_update() NONBANKED;

/**
 * Poll music events
 */ 
UBYTE music_events_poll() BANKED;

/**
 * Plays FX sound on given channel
 * 
 * @param frames sound length in frames
 * @param channel sound channel
 * @param data data to be written to sound registers
 */
void sound_play(UBYTE frames, UBYTE channel,  UBYTE bank, const UBYTE * data) BANKED;

/**
 * Plays waveform on channel 3
 * 
 * @param frames sound length in frames
 * @param bank bank of wave data
 * @param sample offset of wave data
 * @param size waveform size
 */
void wave_play(UBYTE frames, UBYTE bank, UBYTE * sample, UWORD size) BANKED;

/**
 * Stops FX sound on given channel
 * 
 * @param channel sound channel
 */
void sound_stop(UBYTE channel) NONBANKED;

#endif

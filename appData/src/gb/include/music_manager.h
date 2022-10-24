#ifndef __MUSIC_MANAGER_H_INCLUDE__
#define __MUSIC_MANAGER_H_INCLUDE__

#include "events.h"
#include "sfx_player.h"

#ifdef GBT_PLAYER
#undef HUGE_TRACKER 
#define TRACK_T uint8_t
#include "gbt_player.h"

#define driver_reset_wave gbt_reset_ch3_instrument
#define driver_update gbt_update

inline void driver_init(uint8_t bank, const TRACK_T * track, uint8_t loop) {
    gbt_play(track, bank, 7);
    gbt_loop(loop);
}

inline void driver_set_mute_mask(uint8_t mute_mask) {
    gbt_enable_channels(~mute_mask & 0x0f);
}

inline void music_setpos(UBYTE pattern, UBYTE row) {
    pattern, row;
}
#endif

#ifdef HUGE_TRACKER
#undef GBT_PLAYER
#define TRACK_T hUGESong_t
#include "hUGEDriver.h"

#define driver_reset_wave hUGE_reset_wave
#define driver_update hUGE_dosound

inline void driver_init(uint8_t bank, const TRACK_T * track, uint8_t loop) {
    bank; loop;
    hUGE_init(track);
}

inline void driver_set_mute_mask(uint8_t mute_mask) {
    hUGE_mute_mask = mute_mask;
}

inline void music_setpos(UBYTE pattern, UBYTE row) {
    row;
    hUGE_set_position(pattern);
}
#endif

extern script_event_t music_events[4];

#define MUSIC_SFX_PRIORITY_MINIMAL  0
#define MUSIC_SFX_PRIORITY_NORMAL   4
#define MUSIC_SFX_PRIORITY_HIGH     8

#define MUSIC_STOP_BANK SFX_STOP_BANK
//#define FORCE_CUT_SFX                                   // don't cut by default 

extern volatile uint8_t music_current_track_bank;
extern uint8_t music_mute_mask;
extern const TRACK_T * music_next_track;
extern const TRACK_T * music_current_track;
extern uint8_t music_global_mute_mask;
extern uint8_t music_sfx_priority;

void music_init_driver() BANKED;

void music_init_events(uint8_t preserve) BANKED;
void music_events_update() NONBANKED;
uint8_t music_events_poll() BANKED;

inline void music_sound_cut() {
    sfx_sound_cut();
}

#define MUSIC_CH_1 SFX_CH_1
#define MUSIC_CH_2 SFX_CH_2
#define MUSIC_CH_3 SFX_CH_3
#define MUSIC_CH_4 SFX_CH_4

inline void music_sound_cut_mask(uint8_t mask) {
    sfx_sound_cut_mask(mask);
}

void music_play_isr();

inline void music_load(uint8_t bank, const TRACK_T * data, uint8_t loop) {
    loop;
    if ((bank == music_current_track_bank) && (data == music_current_track)) return;
    music_current_track_bank = MUSIC_STOP_BANK, music_current_track = data, music_next_track = data; music_current_track_bank = bank;
}

void music_pause(uint8_t pause);

inline void music_stop() {
    music_current_track_bank = MUSIC_STOP_BANK, music_sound_cut();
}

inline void music_setup_timer() {
    TMA_REG = ((_cpu == CGB_TYPE) && (*(uint8_t *)0x0143 & 0x80)) ? 0x80u : 0xC0u;
    TAC_REG = 0x07u;
}

inline void music_init() {
    music_current_track_bank = MUSIC_STOP_BANK;
    sfx_reset_sample();
    sfx_sound_init();
    music_sound_cut();
}

#define MUTE_MASK_NONE 0
#define MUTE_MASK_WAVE MUSIC_CH_3

inline void music_play_sfx(uint8_t bank, const uint8_t * sample, uint8_t mute_mask, uint8_t priority) {
    if (priority < music_sfx_priority) return;
    sfx_play_bank = SFX_STOP_BANK;
    music_sfx_priority = priority;
    music_sound_cut_mask(music_mute_mask);
    music_mute_mask = mute_mask;
    sfx_set_sample(bank, sample);
}

#endif
#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>
#include <string.h>

#include "events.h"
#include "music_manager.h"
#include "sfx_player.h"

// queue length must be power of 2 
#define MAX_ROUTINE_QUEUE_LEN 4 
// music events queue 
uint8_t routine_queue[MAX_ROUTINE_QUEUE_LEN];
uint8_t routine_queue_head, routine_queue_tail;
// music events struct
script_event_t music_events[4];

volatile uint8_t music_current_track_bank;
uint8_t music_mute_flag, music_mute_mask;
const TRACK_T * music_next_track;
const TRACK_T * music_current_track;
uint8_t music_play_isr_counter;
uint8_t music_play_isr_pause;
uint8_t music_global_mute_mask;
uint8_t music_sfx_priority;

#ifdef HUGE_TRACKER
void hUGETrackerRoutine(unsigned char param, unsigned char ch, unsigned char tick) NONBANKED OLDCALL {
    ch;
    if (tick) return; // return if not zero tick
    routine_queue_head++, routine_queue_head &= (MAX_ROUTINE_QUEUE_LEN - 1);
    if (routine_queue_head == routine_queue_tail) routine_queue_tail++, routine_queue_tail &= (MAX_ROUTINE_QUEUE_LEN - 1);  
    routine_queue[routine_queue_head] = param;    
}
#endif

void music_init_driver() BANKED {
    music_init();
    music_mute_flag = FALSE, music_mute_mask = MUTE_MASK_NONE;
    music_play_isr_counter = 0;
    music_play_isr_pause = FALSE;
    music_global_mute_mask = MUTE_MASK_NONE;
    music_sfx_priority = MUSIC_SFX_PRIORITY_MINIMAL;
}

void music_init_events(uint8_t preserve) BANKED {
    if (preserve) {
        for (uint8_t i = 0; i < 4; i++) 
            music_events[i].handle = 0;
    } else {
        memset(music_events, 0, sizeof(music_events));
    }
    CRITICAL {
        routine_queue_head = routine_queue_tail = 0;
    }
}

void music_events_update() NONBANKED {
    while (routine_queue_head != routine_queue_tail) {
        uint8_t data;
        CRITICAL {
            routine_queue_tail++, routine_queue_tail &= (MAX_ROUTINE_QUEUE_LEN - 1);
            data = routine_queue[routine_queue_tail];
        }
        script_event_t * event = &music_events[data & 0x03];
        if (!event->script_addr) return;
        if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0))
            script_execute(event->script_bank, event->script_addr, &event->handle, 1, (uint16_t)(data >> 4));
    }
}

uint8_t music_events_poll() BANKED {
    if (routine_queue_head != routine_queue_tail) {
        uint8_t data;
        CRITICAL {
            routine_queue_tail++, routine_queue_tail &= (MAX_ROUTINE_QUEUE_LEN - 1);
            data = routine_queue[routine_queue_tail];
        }
        return (data & 0x03 + 1) | (data & 0xf0);
    }
    return 0;
}

void music_play_isr() NONBANKED {
    if (sfx_play_bank != SFX_STOP_BANK) {
        if (!music_mute_flag) driver_set_mute_mask(music_global_mute_mask | music_mute_mask), music_mute_flag = TRUE; 
        if (!sfx_play_isr()) {
            driver_set_mute_mask(music_global_mute_mask), driver_reset_wave(), music_mute_flag = FALSE;
            #ifdef FORCE_CUT_SFX
            music_sound_cut_mask(music_mute_mask);
            #endif
            music_mute_mask = music_global_mute_mask;
            music_sfx_priority = MUSIC_SFX_PRIORITY_MINIMAL; 
            sfx_play_bank = SFX_STOP_BANK;
        }
    }
    if (music_play_isr_pause) return;
    if (music_current_track_bank == MUSIC_STOP_BANK) return;
    if (++music_play_isr_counter & 3) return;
    uint8_t save_bank = _current_bank;
    SWITCH_ROM(music_current_track_bank);
    if (music_next_track) {
        music_sound_cut();
        driver_init(music_current_track_bank, music_next_track, TRUE);
        music_next_track = NULL;
    } else driver_update();
    SWITCH_ROM(save_bank);
}

void music_pause(uint8_t pause) {
    if (music_play_isr_pause = pause) music_sound_cut();
}

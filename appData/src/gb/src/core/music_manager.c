#pragma bank 4

#include <string.h>

#include "compat.h"
#include "music_manager.h"
#include "sample_player.h"
#include "bankdata.h"
#include "vm.h"

#define MAX_MUSIC 255
#define MASK_ALL_CHANNELS 0x0f

const TRACK_T *current_track;
// -- don't change order, accessed from asm ---
UBYTE tone_frames;
UBYTE channel_mask;
UBYTE sound_channel;
UBYTE current_track_bank;
// --------------------------------------------
#ifdef HUGE_TRACKER
    UBYTE music_stopped;
    UBYTE huge_initialized;
#endif

// queue length must be power of 2 
#define MAX_ROUTINE_QUEUE_LEN 4 
// music events queue 
UBYTE routine_queue[MAX_ROUTINE_QUEUE_LEN];
UBYTE routine_queue_head, routine_queue_tail;
// music events struct
script_event_t music_events[4];

void sound_init() BANKED {
    NR52_REG = 0x80; 
    NR51_REG = 0xFF;
    NR50_REG = 0x77;

    current_track       = NULL;
    tone_frames         = 0;
    channel_mask        = MASK_ALL_CHANNELS;
    sound_channel       = 0;

#ifdef HUGE_TRACKER
    current_track_bank  = 0;
    music_stopped       = TRUE;
    huge_initialized    = FALSE;
#endif
}

void music_init(UBYTE preserve) BANKED {
    if (preserve) {
        for (UBYTE i = 0; i < 4; i++) 
            music_events[i].handle = 0;
    } else {
        memset(music_events, 0, sizeof(music_events));
    }
    CRITICAL {
        routine_queue_head = routine_queue_tail = 0;
    }
}

#ifdef HUGE_TRACKER
void hUGETrackerRoutine(unsigned char param, unsigned char ch, unsigned char tick) NONBANKED {
    ch;
    if (tick) return; // return if not zero tick
    routine_queue_head++, routine_queue_head &= (MAX_ROUTINE_QUEUE_LEN - 1);
    if (routine_queue_head == routine_queue_tail) routine_queue_tail++, routine_queue_tail &= (MAX_ROUTINE_QUEUE_LEN - 1);  
    routine_queue[routine_queue_head] = param;    
}
#endif

void music_events_update() NONBANKED {
    while (routine_queue_head != routine_queue_tail) {
        UBYTE data;
        CRITICAL {
            routine_queue_tail++, routine_queue_tail &= (MAX_ROUTINE_QUEUE_LEN - 1);
            data = routine_queue[routine_queue_tail];
        }
        script_event_t * event = &music_events[data & 0x03];
        if (!event->script_addr) return;
        if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0))
            script_execute(event->script_bank, event->script_addr, &event->handle, 1, (UWORD)(data >> 4));
    }
}

UBYTE music_events_poll() BANKED {
    if (routine_queue_head != routine_queue_tail) {
        UBYTE data;
        CRITICAL {
            routine_queue_tail++, routine_queue_tail &= (MAX_ROUTINE_QUEUE_LEN - 1);
            data = routine_queue[routine_queue_tail];
        }
        return (data & 0x03 + 1) | (data & 0xf0);
    }
    return 0;
}

void music_play(const TRACK_T *track, UBYTE bank, UBYTE loop) NONBANKED {
    if (track == NULL) {
        music_stop();
    } else if (track != current_track || bank != current_track_bank) {
        channel_mask = MASK_ALL_CHANNELS;
#ifdef GBT_PLAYER
        UBYTE _save = _current_bank;
        current_track_bank = bank;
        CRITICAL {
            gbt_play(track, bank, 7);
            gbt_loop(loop);
            SWITCH_ROM(_save);
            music_mute(channel_mask);
        }
#endif
#ifdef HUGE_TRACKER
        loop;
        UBYTE _save = _current_bank;
        current_track_bank = bank;
        CRITICAL {
            music_stop();
            SWITCH_ROM(current_track_bank);
            hUGE_init(track);
            SWITCH_ROM(_save);
            huge_initialized = TRUE;
            music_mute(channel_mask);
            music_stopped = FALSE;        
        }
#endif
        current_track = track;
    } else {
#ifdef SAME_TUNE_RESTARTS
        // restart current song from beginning
        music_stop();
        music_play(index, loop);
#endif
    }
}

void music_stop() BANKED {
#ifdef GBT_PLAYER
    UBYTE _save = _current_bank;
    gbt_stop();
    SWITCH_ROM(_save);
#endif
#ifdef HUGE_TRACKER
    music_stopped = TRUE;
    music_mute(0);
#endif
    current_track = NULL;
}

void music_mute(UBYTE channels) OLDCALL NONBANKED NAKED {
    channels;
__asm
#ifdef GBT_PLAYER
        ldh a, (__current_bank)
        push af

        ldhl sp, #4
        ld e, (hl)
        push de
        call _gbt_enable_channels
        pop de

        pop af
        ldh (__current_bank), a
        ld (0x2000), a
#endif
#ifdef HUGE_TRACKER
        ld a, (_huge_initialized)
        or a
        ret z

        xor a
        ld e, a
        ld l, a
        ldhl sp, #2
        ld a, (hl)      ; channels
        cpl

        ld h, #4
1$:
        rrca
        ld d, l
        rl d
        push de
        inc e
        dec h
        jr nz, 1$

        .rept 4
            call _hUGE_mute_channel
            pop de
        .endm 
#endif
        ret
__endasm;
}

UINT8 ISR_counter = 0;
void music_update() OLDCALL NONBANKED NAKED {
__asm
        call _sample_play_isr
        ld hl, #_ISR_counter
        ld a, (hl)
        inc a
        and #0x03
        ld (hl), a
        ret nz
        
        ld hl, #_tone_frames
        ld a, (hl)
        or a
        jr z, 1$
        dec a
        ld (hl+), a
        jr nz, 1$

        ld a, (hl+)         ; channel_mask
        ld d, a
        ld e, (hl)          ; sound_channel
        push de
        call _sound_stop
        inc sp
        call _music_mute
        inc sp
1$:
#ifdef GBT_PLAYER
        ldh a, (__current_bank)
        push af
        call _gbt_update
        pop af
        ldh (__current_bank), a
        ld (0x2000), a
#endif
#ifdef HUGE_TRACKER
        ld a, (_music_stopped)
        or a
        ret nz
        ld a, (_current_track_bank)
        ld e, a
        or a
        ret z
        ldh a, (__current_bank)
        push af
        ld a, e
        ldh (__current_bank), a
        ld (0x2000), a
        call _hUGE_dosound
        pop af
        ldh (__current_bank), a
        ld (0x2000), a
#endif
        ret
__endasm;
}

const UINT8 FX_REG_SIZES[]  = {0, 5, 4, 5, 4};
const UINT8 FX_ADDR_LO[]    = {0, 0x10, 0x16, 0x1a, 0x20};
const UINT8 channel_masks[] = {0, 0x0e, 0x0d, 0x0b, 0x07};

void wave_play(UBYTE frames, UBYTE bank, UBYTE * sample, UWORD size) BANKED {
    if (tone_frames) return;                        // exit if sound is already playing.
    if (frames == 0) return;                        // exit if length in frames is zero
    music_mute(channel_mask & channel_masks[3]);
    set_sample(bank, sample, size);
    sound_channel = 3;
    tone_frames = frames;
}

static void sound_load_regs(UBYTE reg, UBYTE len, UBYTE bank, const UBYTE * data) OLDCALL NONBANKED NAKED {
    reg; len; bank; data;
__asm
        ldhl sp, #2
        ld a, (hl+)
        ld c, a
        ld a, (hl+)
        ld b, a

        ldh a, (__current_bank)
        ld e, a
        ld a, (hl+)
        ldh (__current_bank), a
        ld (0x2000), a

        ld a, (hl+)
        ld h, (hl)
        ld l, a
1$:
        ld a, (hl+)
        ldh (c), a
        inc c
        dec b
        jr nz, 1$

        ld a, e
        ldh (__current_bank), a
        ld (0x2000), a

        ret
__endasm;
}

void sound_play(UBYTE frames, UBYTE channel, UBYTE bank, const UBYTE * data) BANKED {
    if (tone_frames) return;                        // exit if sound is already playing.
    if (frames == 0) return;                        // exit if length in frames is zero
    if ((channel == 0) || (channel > 4)) return;    // exit if channel is out of bounds
    
    // mute music on SFX channel
    music_mute(channel_mask & channel_masks[channel]);
    
    // load waveform
    if (channel == 3) sound_load_regs(0x30, 0x10, bank, data + 5);
    // set sound registers
    sound_load_regs(FX_ADDR_LO[channel], FX_REG_SIZES[channel], bank, data);

    sound_channel = channel;
    tone_frames = frames;
}

void sound_stop(UBYTE channel) NONBANKED {
    switch (channel) {
        case 1: NR12_REG = 0x00; break; 
        case 2: NR22_REG = 0x00; break; 
        case 3: {
            NR32_REG = 0x00;                    // set volume 0
#ifdef GBT_PLAYER      
            gbt_reset_ch3_instrument();
#endif         
#ifdef HUGE_TRACKER
            hUGE_reset_wave();    
#endif         
            break;
        } 
        case 4: NR42_REG = 0x00; break;         // would that work?
    }
}

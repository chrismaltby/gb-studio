#pragma bank 2

#include <stdarg.h>

#include "vm_music.h"
#include "music_manager.h"

void vm_music_play(SCRIPT_CTX * THIS, UBYTE track_bank, const TRACK_T *track, UBYTE loop) OLDCALL __banked {
    THIS;
    music_play(track, track_bank, loop);
}

void vm_music_stop() __banked {
    music_stop();
}

void vm_music_mute(SCRIPT_CTX * THIS, UBYTE channels) OLDCALL __banked {
    THIS;
    music_mute(channels);
    channel_mask = channels;
}

void vm_music_routine(SCRIPT_CTX * THIS, UBYTE routine, UBYTE bank, UBYTE * pc) OLDCALL __banked {
    THIS;
    script_event_t * event = &music_events[routine & 0x03];
    event->script_bank = bank; 
    event->script_addr = pc;
}

void vm_music_setpos(SCRIPT_CTX * THIS, UBYTE pattern, UBYTE row) OLDCALL __banked {
    THIS;
    music_setpos(pattern, row);
}

void vm_sound_mastervol(SCRIPT_CTX * THIS, UBYTE volume) OLDCALL __banked {
    THIS;
    NR50_REG = volume;
}

void vm_sound_play(SCRIPT_CTX * THIS, UBYTE frames, UBYTE channel) OLDCALL __banked {
    sound_play(frames, channel, THIS->bank, THIS->PC);
    THIS->PC += ((channel == 3) ? 0x15 : 5); // skip regs and waveform, if playing on ch3
}

void vm_wave_play(SCRIPT_CTX * THIS, UBYTE frames, UBYTE bank, UBYTE * sample, UWORD size) OLDCALL __banked {
    THIS;
    wave_play(frames, bank, sample, size);
}
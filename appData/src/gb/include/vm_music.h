#ifndef _VM_MUSIC_H_INCLUDE
#define _VM_MUSIC_H_INCLUDE

#include "vm.h"
#include "music_manager.h"

void vm_music_play(SCRIPT_CTX * THIS, UBYTE track_bank, const TRACK_T *track, UBYTE loop) OLDCALL __banked;
void vm_music_stop() OLDCALL __banked;
void vm_music_mute(SCRIPT_CTX * THIS, UBYTE channels) OLDCALL __banked;
void vm_music_routine(SCRIPT_CTX * THIS, UBYTE routine, UBYTE bank, UBYTE * pc) OLDCALL __banked;
void vm_music_setpos(SCRIPT_CTX * THIS, UBYTE pattern, UBYTE row) OLDCALL __banked;

void vm_sound_mastervol(SCRIPT_CTX * THIS, UBYTE volume) OLDCALL __banked;
void vm_sound_play(SCRIPT_CTX * THIS, UBYTE frames, UBYTE channel, ...) OLDCALL __banked;

void vm_wave_play(SCRIPT_CTX * THIS, UBYTE frames, UBYTE bank, UBYTE * sample, UWORD size) OLDCALL __banked;

#endif
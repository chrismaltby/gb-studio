#ifndef _VM_gameboy_H_INCLUDE
#define _VM_gameboy_H_INCLUDE

#include "vm.h"
#include "gbs_types.h"

void vm_show_sprites() __banked;
void vm_hide_sprites() __banked;
void vm_input_wait(SCRIPT_CTX * THIS, UBYTE mask) __banked;
void vm_context_prepare(SCRIPT_CTX * THIS, UBYTE slot, UBYTE bank, UBYTE * pc) __banked;
void vm_input_attach(SCRIPT_CTX * THIS, UBYTE mask, UBYTE slot) __banked;
void vm_input_detach(SCRIPT_CTX * THIS, UBYTE mask) __banked;
void vm_input_get(SCRIPT_CTX * THIS, INT16 idx) __banked;
void vm_fade_in(SCRIPT_CTX * THIS, UBYTE is_modal) __banked; 
void vm_fade_out(SCRIPT_CTX * THIS, UBYTE is_modal) __banked; 
void vm_timer_prepare(SCRIPT_CTX * THIS, UBYTE timer, UBYTE bank, UBYTE * pc) __banked;
void vm_timer_set(SCRIPT_CTX * THIS, UBYTE timer, UBYTE value) __banked;
void vm_data_is_saved(SCRIPT_CTX * THIS, INT16 idx, UBYTE slot) __banked;
void vm_replace_tile(SCRIPT_CTX * THIS, UBYTE target_tile, UBYTE tileset_bank, const tileset_t * tileset, INT16 idx_start_tile, INT16 idx_length) __banked;

#define POLL_EVENT_INPUT 0x01
#define POLL_EVENT_MUSIC 0x02

void vm_poll(SCRIPT_CTX * THIS, INT16 idx, INT16 res, UBYTE event_mask) __banked;
void vm_set_sprite_mode(SCRIPT_CTX * THIS, UBYTE mode) __banked;
void vm_replace_tile_xy(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE tileset_bank, const tileset_t * tileset, INT16 idx_start_tile) __banked;

#endif
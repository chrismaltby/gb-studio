#ifndef _VM_UI_H_INCLUDE
#define _VM_UI_H_INCLUDE

#include <gb/gb.h>
#include "vm.h"

#include "gbs_types.h"

BANKREF_EXTERN(VM_UI)

void vm_load_text(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, UBYTE nargs) OLDCALL NONBANKED;
void vm_display_text(SCRIPT_CTX * THIS, UBYTE options, UBYTE start_tile) OLDCALL BANKED;
void vm_switch_text_layer(SCRIPT_CTX * THIS, UBYTE target) OLDCALL BANKED;

void vm_overlay_setpos(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y) OLDCALL BANKED;
void vm_overlay_wait(SCRIPT_CTX * THIS, UBYTE is_modal, UBYTE wait_flags) OLDCALL BANKED;
void vm_overlay_move_to(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y, BYTE speed) OLDCALL BANKED;
void vm_overlay_show(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y, UBYTE color, UBYTE options) OLDCALL BANKED;
void vm_overlay_clear(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color, UBYTE options) OLDCALL BANKED;
void vm_overlay_scroll(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color) OLDCALL BANKED;
void vm_overlay_set_scroll(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color) OLDCALL BANKED;
void vm_overlay_set_submap(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE scene_x, UBYTE scene_y) OLDCALL BANKED;
void vm_overlay_set_submap_ex(SCRIPT_CTX * THIS, INT16 params_idx) OLDCALL BANKED;
void vm_overlay_set_map(SCRIPT_CTX * THIS, INT16 idx, INT16 x_idx, INT16 y_idx, UBYTE bank, const background_t * background) OLDCALL BANKED;
void vm_choice(SCRIPT_CTX * THIS, INT16 idx, UBYTE options, UBYTE count) OLDCALL BANKED;

void vm_set_font(SCRIPT_CTX * THIS, UBYTE font_index) OLDCALL BANKED;

void vm_set_text_sound(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * offset, UBYTE channel_mask) OLDCALL BANKED;

#endif
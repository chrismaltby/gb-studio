#ifndef _VM_UI_H_INCLUDE
#define _VM_UI_H_INCLUDE

#include "vm.h"

void vm_load_text(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, UBYTE nargs) OLDCALL NONBANKED;
void vm_display_text(SCRIPT_CTX * THIS, UBYTE avatar_index, UBYTE options) OLDCALL BANKED;
void vm_switch_text_layer(SCRIPT_CTX * THIS, UBYTE target) OLDCALL BANKED;

void vm_overlay_setpos(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y) OLDCALL BANKED;
void vm_overlay_hide() OLDCALL BANKED;
void vm_overlay_wait(SCRIPT_CTX * THIS, UBYTE is_modal, UBYTE wait_flags) OLDCALL BANKED;
void vm_overlay_move_to(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y, UBYTE speed) OLDCALL BANKED;
void vm_overlay_show(SCRIPT_CTX * THIS, UBYTE pos_x, UBYTE pos_y, UBYTE color) OLDCALL BANKED;
void vm_overlay_clear(SCRIPT_CTX * THIS, UBYTE color) OLDCALL BANKED;
void vm_overlay_scroll(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color) OLDCALL BANKED;
void vm_overlay_set_scroll(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE color) OLDCALL BANKED;
void vm_overlay_set_submap(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE scene_x, UBYTE scene_y) OLDCALL BANKED;
void vm_choice(SCRIPT_CTX * THIS, INT16 idx, UBYTE options) OLDCALL BANKED;

void vm_load_frame(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * offset) OLDCALL BANKED;
void vm_load_cursor(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * offset) OLDCALL BANKED;
void vm_set_font(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * offset) OLDCALL BANKED;
void vm_set_print_dir(SCRIPT_CTX * THIS, UBYTE print_dir) OLDCALL BANKED;

#endif
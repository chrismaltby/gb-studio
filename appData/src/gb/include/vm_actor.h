#ifndef _VM_ACTOR_H_INCLUDE
#define _VM_ACTOR_H_INCLUDE

#include "vm.h"
#include "gbs_types.h"

void vm_actor_move_to(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_activate(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_set_dir(SCRIPT_CTX * THIS, INT16 idx, direction_e dir) OLDCALL BANKED;
void vm_actor_deactivate(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_set_anim(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_anim) OLDCALL BANKED;
void vm_actor_set_pos(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_emote(SCRIPT_CTX * THIS, INT16 idx, UBYTE emote_tiles_bank, const unsigned char *emote_tiles) OLDCALL BANKED;
void vm_actor_set_bounds(SCRIPT_CTX * THIS, INT16 idx, BYTE left, BYTE right, BYTE top, BYTE bottom) OLDCALL BANKED;
void vm_actor_set_spritesheet(SCRIPT_CTX * THIS, INT16 idx, UBYTE spritesheet_bank, const spritesheet_t *spritesheet) OLDCALL BANKED;
void vm_actor_replace_tile(SCRIPT_CTX * THIS, INT16 idx, UBYTE target_tile, UBYTE tileset_bank, const tileset_t * tileset, UBYTE start_tile, UBYTE length) OLDCALL BANKED;
void vm_actor_get_pos(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_set_hidden(SCRIPT_CTX * THIS, INT16 idx, UBYTE hidden) OLDCALL BANKED;
void vm_actor_get_dir(SCRIPT_CTX * THIS, INT16 idx, INT16 dest) OLDCALL BANKED;
void vm_actor_get_angle(SCRIPT_CTX * THIS, INT16 idx, INT16 dest) OLDCALL BANKED;
void vm_actor_set_anim_tick(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed) OLDCALL BANKED;
void vm_actor_set_move_speed(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed) OLDCALL BANKED;
void vm_actor_set_coll_enabled(SCRIPT_CTX * THIS, INT16 idx, UBYTE enabled) OLDCALL BANKED;
void vm_actor_terminate_update(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_set_anim_frame(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_get_anim_frame(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED;
void vm_actor_set_anim_set(SCRIPT_CTX * THIS, INT16 idx, UWORD offset) OLDCALL BANKED;
void vm_actor_set_spritesheet_by_ref(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB) OLDCALL BANKED;

#endif
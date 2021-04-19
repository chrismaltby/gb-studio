#pragma bank 2

#include "vm_gameboy.h"

#include "system.h"
#include "vm.h"

#include "metasprite.h"
#include "input.h"
#include "events.h"
#include "fade_manager.h"
#include "music_manager.h"
#include "load_save.h"
#include "bankdata.h"
#include "data_manager.h"

void vm_show_sprites() __banked {
    hide_sprites = FALSE;
    SHOW_SPRITES;
}

void vm_hide_sprites() __banked {
    hide_sprites = TRUE;
    HIDE_SPRITES;
}

void vm_input_wait(SCRIPT_CTX * THIS, UBYTE mask) __banked { 
    if ((joy != last_joy) && (joy & mask)) return;
    THIS->waitable = 1;
    THIS->PC -= INSTRUCTION_SIZE + sizeof(mask);
}

void vm_context_prepare(SCRIPT_CTX * THIS, UBYTE slot, UBYTE bank, UBYTE * pc) __banked {
    THIS;
    script_event_t * event = &input_events[(slot - 1) & 7];
    event->script_bank = bank; 
    event->script_addr = pc;
}

void vm_input_attach(SCRIPT_CTX * THIS, UBYTE mask, UBYTE slot) __banked {
    THIS;
    UBYTE * current_slot = input_slots;
    for (UBYTE tmp = mask; (tmp); tmp = tmp >> 1, current_slot++) {
        if (tmp & 1) *current_slot = slot;
    }
}

void vm_input_detach(SCRIPT_CTX * THIS, UBYTE mask) __banked {
    THIS;
    UBYTE * current_slot = input_slots;
    for (UBYTE tmp = mask; (tmp); tmp = tmp >> 1, current_slot++) {
        if (tmp & 1) *current_slot = 0;
    }
}

void vm_input_get(SCRIPT_CTX * THIS, INT16 idx, UBYTE joyid) __banked { 
    INT16 * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    *A = joypads.joypads[joyid];
}

void vm_fade_in(SCRIPT_CTX * THIS, UBYTE is_modal) __banked {
    THIS; 
    if (is_modal) fade_in_modal(); else fade_in();
}

void vm_fade_out(SCRIPT_CTX * THIS, UBYTE is_modal) __banked { 
    THIS;
    if (is_modal) fade_out_modal(); else fade_out();
}

void vm_timer_prepare(SCRIPT_CTX * THIS, UBYTE timer, UBYTE bank, UBYTE * pc) __banked {
    THIS;
    script_event_t * event = &timer_events[(timer - 1) & 3];
    event->script_bank = bank; 
    event->script_addr = pc;
}

void vm_timer_set(SCRIPT_CTX * THIS, UBYTE timer, UBYTE value) __banked {
    THIS;
    timer_time_t * timer_value = &timer_values[(timer - 1) & 3];
    timer_value->value = value;
    timer_value->remains = value;
}

void vm_get_tile_xy(SCRIPT_CTX * THIS, INT16 idx_tile, INT16 idx_x, INT16 idx_y) __banked {
    THIS;

    INT16 * res;
    if (idx_tile < 0) res = THIS->stack_ptr + idx_tile; else res = script_memory + idx_tile;
    
    INT16 *X, *Y;
    if (idx_x < 0) X = THIS->stack_ptr + idx_x; else X = script_memory + idx_x;
    if (idx_y < 0) Y = THIS->stack_ptr + idx_y; else Y = script_memory + idx_y;

    UWORD ofs = (image_tile_width * ((UBYTE)*Y)) + ((UBYTE)*X);
    UBYTE target_tile = ReadBankedUBYTE(image_ptr + ofs, image_bank);
#ifdef CGB
    if (_is_CGB) {
        UBYTE tartet_attr = ReadBankedUBYTE(image_attr_ptr + ofs, image_attr_bank);
        *res = (((UWORD)tartet_attr) << 8) | target_tile;
        return;
    }
#endif
    *res = target_tile;
}


void vm_replace_tile(SCRIPT_CTX * THIS, INT16 idx_target_tile, UBYTE tileset_bank, const tileset_t * tileset, INT16 idx_start_tile, UBYTE length) __banked {
    INT16 * A, * B;
    if (idx_start_tile < 0) A = THIS->stack_ptr + idx_start_tile; else A = script_memory + idx_start_tile;
    if (idx_target_tile < 0) B = THIS->stack_ptr + idx_target_tile; else B = script_memory + idx_target_tile;
#ifdef CGB
    if (_is_CGB) {
        if (*B & 0x0800) VBK_REG = 1;
    }
#endif
    SetBankedBkgData((UBYTE)(*B), length, tileset->tiles + (*A << 4), tileset_bank);
#ifdef CGB
    VBK_REG = 0;
#endif
}

void vm_poll(SCRIPT_CTX * THIS, INT16 idx, INT16 res, UBYTE event_mask) __banked {
    INT16 * result_mask, * result;
    if (idx < 0) result_mask = THIS->stack_ptr + idx; else result_mask = script_memory + idx;
    if (res < 0) result = THIS->stack_ptr + res; else result = script_memory + res;
    if (event_mask & POLL_EVENT_INPUT) { 
        if (joy != last_joy) {
            *result_mask = POLL_EVENT_INPUT;
            *result = joy;
            return;
        }
    }
    if (event_mask & POLL_EVENT_MUSIC) {
        UBYTE poll_res = music_events_poll();
        if (poll_res) { 
            *result_mask = POLL_EVENT_MUSIC;
            *result = poll_res;
            return;
        }
    }
    THIS->waitable = 1;
    THIS->PC -= INSTRUCTION_SIZE + sizeof(idx) + sizeof(res) + sizeof(event_mask);
}

void vm_set_sprite_mode(SCRIPT_CTX * THIS, UBYTE mode) __banked {
    THIS;
    if (mode) SPRITES_8x16; else SPRITES_8x8;
}

void vm_replace_tile_xy(SCRIPT_CTX * THIS, UBYTE x, UBYTE y, UBYTE tileset_bank, const tileset_t * tileset, INT16 idx_start_tile) __banked {
    THIS;

    INT16 * A;
    if (idx_start_tile < 0) A = THIS->stack_ptr + idx_start_tile; else A = script_memory + idx_start_tile;
    UBYTE start_tile = (UBYTE)*A;

    UWORD ofs = (image_tile_width * y) + x;
    UBYTE target_tile = ReadBankedUBYTE(image_ptr + ofs, image_bank);

    if ((scene_type == SCENE_TYPE_LOGO) && (y > 9u)) {
        SetBankedSpriteData(target_tile, 1, tileset->tiles + (start_tile << 4), tileset_bank);
        return;
    }  

#ifdef CGB
    if (_is_CGB) {
        UBYTE tartet_attr = ReadBankedUBYTE(image_attr_ptr + ofs, image_attr_bank);
        if (tartet_attr & 0x08) VBK_REG = 1;
    }
#endif
    SetBankedBkgData(target_tile, 1, tileset->tiles + (start_tile << 4), tileset_bank);
#ifdef CGB
    VBK_REG = 0;
#endif
}

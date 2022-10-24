#pragma bank 255

#include <string.h>

#include "load_save.h"

#include "system.h"
#include "actor.h"
#include "vm.h"
#include "events.h"
#include "music_manager.h"
#include "data_manager.h"
#ifdef BATTERYLESS
    #include "bankdata.h"
    #include "flasher.h"
#endif

#define SIGN_BY_PTR(ptr) *((UINT32 *)(ptr))
extern const UINT32 save_signature;

typedef struct save_point_t {
    void * target;
    size_t size;
} save_point_t;

#define SAVEPOINT(A) {&(A), sizeof(A)}
#define SAVEPOINTS_END {0, 0}

extern uint16_t __rand_seed;

const save_point_t save_points[] = {
    // variables (must be first, need for peeking)
    SAVEPOINT(script_memory),
    // VM contexts
    SAVEPOINT(CTXS),
    SAVEPOINT(first_ctx), SAVEPOINT(free_ctxs), SAVEPOINT(old_executing_ctx), SAVEPOINT(executing_ctx), SAVEPOINT(vm_lock_state),
    // intupt events
    SAVEPOINT(input_events), SAVEPOINT(input_slots), 
    // timers
    SAVEPOINT(timer_events), SAVEPOINT(timer_values),
    // music
    SAVEPOINT(music_current_track_bank),
    SAVEPOINT(music_current_track),
    SAVEPOINT(music_events),
    // scene
    SAVEPOINT(current_scene),
    // actors
    SAVEPOINT(actors),
    SAVEPOINT(actors_active_head), SAVEPOINT(actors_inactive_head), SAVEPOINT(player_moving), SAVEPOINT(player_collision_actor),
    // system
    SAVEPOINT(__rand_seed),
    // terminator
    SAVEPOINTS_END
};

#ifdef BATTERYLESS
    extern void _start_save; 
#endif

size_t save_blob_size;

void data_init() BANKED {
    ENABLE_RAM_MBC5;
    SWITCH_RAM_BANK(0, RAM_BANKS_ONLY);
    // calculate save blob size
    save_blob_size = sizeof(save_signature);
    for(const save_point_t * point = save_points; (point->target); point++) {
        save_blob_size += point->size;  
    }
#ifdef BATTERYLESS
    // load from FLASH ROM
    for (UBYTE i = 0; i < SRAM_BANKS_TO_SAVE; i++) restore_sram_bank(i);
#endif
}

UBYTE * data_slot_address(UBYTE slot, UBYTE *bank) {
    UWORD res = 0, res_bank = 0;
    for (UBYTE i = 0; i < slot; i++) {
        res += save_blob_size;
        if ((res + save_blob_size) > SRAM_BANK_SIZE) {
            if (++res_bank >= SRAM_BANKS_TO_SAVE) return NULL;
            res = 0;
        }
    }
    *bank = res_bank;
    return (UBYTE *)0xA000u + res;
}

void data_save(UBYTE slot) BANKED {
    UBYTE data_bank, *save_data = data_slot_address(slot, &data_bank);
    if (save_data == NULL) return;
    SWITCH_RAM_BANK(data_bank, RAM_BANKS_ONLY);

    SIGN_BY_PTR(save_data) = save_signature; 
    save_data += sizeof(save_signature);    
    for(const save_point_t * point = save_points; (point->target); point++) {
        memcpy(save_data, point->target, point->size);
        save_data += point->size;  
    }
#ifdef BATTERYLESS
    // save to FLASH ROM
    save_sram(SRAM_BANKS_TO_SAVE);
#endif
}

UBYTE data_load(UBYTE slot) BANKED {
    UBYTE data_bank, *save_data = data_slot_address(slot, &data_bank);
    if (save_data == NULL) return FALSE;
    SWITCH_RAM_BANK(data_bank, RAM_BANKS_ONLY);
    if (SIGN_BY_PTR(save_data) != save_signature) return FALSE;
    save_data += sizeof(save_signature);

    for(const save_point_t * point = save_points; (point->target); point++) {
        memcpy(point->target, save_data, point->size);    
        save_data += point->size;  
    }
    // Restart music
    if (music_current_track_bank != MUSIC_STOP_BANK) {
        music_next_track = music_current_track;
    } else {
        music_sound_cut();
    }
    return TRUE;
}

void data_clear(UBYTE slot) BANKED {
    UBYTE data_bank, *save_data = data_slot_address(slot, &data_bank);
    if (save_data == NULL) return;
    SWITCH_RAM_BANK(data_bank, RAM_BANKS_ONLY);
    SIGN_BY_PTR(save_data) = 0;    
#ifdef BATTERYLESS
    // save to FLASH ROM
    save_sram(SRAM_BANKS_TO_SAVE);
#endif
}

UBYTE data_peek(UBYTE slot, UINT16 idx, UWORD count, UINT16 * dest) BANKED {
    UBYTE data_bank, *save_data = data_slot_address(slot, &data_bank);
    if (save_data == NULL) return FALSE;
    SWITCH_RAM_BANK(data_bank, RAM_BANKS_ONLY);
    if (SIGN_BY_PTR(save_data) != save_signature) return FALSE;

    if (count) memcpy(dest, save_data + sizeof(save_signature) + (idx << 1), count << 1);
    return TRUE;
}

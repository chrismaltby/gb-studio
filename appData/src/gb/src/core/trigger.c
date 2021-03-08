#pragma bank 1

#include "trigger.h"
#include "vm.h"

trigger_t triggers[MAX_TRIGGERS];
UBYTE triggers_len = 0;
UBYTE last_trigger_tx = 0;
UBYTE last_trigger_ty = 0;
UBYTE last_trigger = NO_TRIGGER_COLLISON;

UBYTE trigger_at_intersection(bounding_box_t *bb, upoint16_t *offset); 

void trigger_interact(UBYTE i) __banked {
    script_execute(triggers[i].script.bank, triggers[i].script.ptr, 0, 0);
}

UBYTE trigger_activate_at(UBYTE tx, UBYTE ty, UBYTE force) __banked {
    UBYTE hit_trigger;

    // Don't reactivate trigger if not changed tile
    if (!force && ((tx == last_trigger_tx) && (ty == last_trigger_ty))) {
        return FALSE;
    }

    hit_trigger = trigger_at_tile(tx, ty);
    last_trigger_tx = tx;
    last_trigger_ty = ty;

    if (hit_trigger != NO_TRIGGER_COLLISON) {
        trigger_interact(hit_trigger);
        return TRUE;
    }

    return FALSE;
}

UBYTE trigger_activate_at_intersection(bounding_box_t *bb, upoint16_t *offset, UBYTE force) __banked {
    UBYTE hit_trigger = trigger_at_intersection(bb, offset);

    // Don't reactivate trigger if not changed tile
    if (!force && (last_trigger == hit_trigger)) {
        return FALSE;
    }
    last_trigger = hit_trigger;

    if (hit_trigger != NO_TRIGGER_COLLISON) {
        script_execute(triggers[hit_trigger].script.bank, triggers[hit_trigger].script.ptr, 0, 0);
        return TRUE;
    }

    return FALSE;
}

UBYTE trigger_at_intersection(bounding_box_t *bb, upoint16_t *offset) __banked {
    UBYTE tile_left   = ((offset->x >> 4) + bb->left)   >> 3;
    UBYTE tile_right  = ((offset->x >> 4) + bb->right)  >> 3;
    UBYTE tile_top    = ((offset->y >> 4) + bb->top)    >> 3;
    UBYTE tile_bottom = ((offset->y >> 4) + bb->bottom) >> 3;
    UBYTE i;

    for (i = 0; i != triggers_len; i++) {
        UBYTE trigger_left   = triggers[i].x;
        UBYTE trigger_top    = triggers[i].y;
        UBYTE trigger_right  = triggers[i].x + triggers[i].width  - 1;
        UBYTE trigger_bottom = triggers[i].y + triggers[i].height - 1;

        if ((tile_left <= trigger_right)
            && (tile_right >= trigger_left)
            && (tile_top <= trigger_bottom)
            && (tile_bottom >= trigger_top)) {
                return i;
        }
    }

    return NO_TRIGGER_COLLISON;
}

UBYTE trigger_at_tile(UBYTE tx_a, UBYTE ty_a) __banked {
    UBYTE i, tx_b, ty_b, tx_c, ty_c;

    for (i = 0; i != triggers_len; i++) {
        tx_b = triggers[i].x;
        ty_b = triggers[i].y;
        tx_c = tx_b + triggers[i].width - 1;
        ty_c = ty_b + triggers[i].height - 1;

        if ((tx_a + 1) >= tx_b && tx_a <= tx_c && ty_a >= ty_b && ty_a <= ty_c) {
            return i;
        }
    }

    return NO_TRIGGER_COLLISON;
}

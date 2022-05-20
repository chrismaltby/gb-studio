#ifndef TRIGGER_H
#define TRIGGER_H

#include <gb/gb.h>
#include "gbs_types.h"
#include "math.h"

#define MAX_TRIGGERS 31
#define MAX_ACTIVE_TRIGGERS 11
#define NO_TRIGGER_COLLISON 0xFF

extern trigger_t triggers[MAX_TRIGGERS];
extern UBYTE triggers_len;

/**
 * Resets trigger collision flags on scene start
 */
void trigger_reset() BANKED;

/**
 * Find trigger at tile {tx,ty}
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return tile index or NO_TRIGGER_COLLISON if not found
 */
UBYTE trigger_at_tile(UBYTE tx_a, UBYTE ty_a) BANKED;

/**
 * Run script for trigger specified trigger
 *
 * @param i Trigger index
 */
void trigger_interact(UBYTE i) BANKED;

/**
 * Run script for trigger at tile {tx,ty} if this tile was the
 * most recently activated trigger tile don't reactivate
 * (i.e. player must move to another tile first)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @param force Force trigger to activate without changing tile
 */
UBYTE trigger_activate_at(UBYTE tx, UBYTE ty, UBYTE force) BANKED;

UBYTE trigger_activate_at_intersection(bounding_box_t *bb, upoint16_t *offset, UBYTE force) BANKED;
UBYTE trigger_at_intersection(bounding_box_t *bb, upoint16_t *offset) BANKED;

#endif

#ifndef TRIGGER_H
#define TRIGGER_H

#include <gb/gb.h>

#include "BankData.h"
#include "Math.h"

#define TRIGGER_BANK 1
#define MAX_TRIGGERS 31
#define MAX_ACTIVE_TRIGGERS 11
#define NO_TRIGGER_COLLISON 0xFF

typedef struct _TRIGGER {
  UBYTE x;
  UBYTE y;
  UBYTE w;
  UBYTE h;
  BankPtr events_ptr;
} Trigger;

extern Trigger triggers[MAX_TRIGGERS];
extern UBYTE triggers_active[MAX_ACTIVE_TRIGGERS];
extern UBYTE triggers_active_size;
extern UBYTE triggers_len;
extern UBYTE last_trigger_tx;
extern UBYTE last_trigger_ty;

/**
 * Find trigger at tile {tx,ty}
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return tile index or NO_TRIGGER_COLLISON if not found
 */
UBYTE TriggerAtTile(UBYTE tx_a, UBYTE ty_a);

/**
 * Run script for trigger specified trigger
 *
 * @param i Trigger index
 */
void TriggerRunScript(UBYTE i);

/**
 * Run script for trigger at tile {tx,ty} if this tile was the
 * most recently activated trigger tile don't reactivate
 * (i.e. player must move to another tile first)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @param force Force trigger to activate without changing tile
 */
UBYTE ActivateTriggerAt(UBYTE tx, UBYTE ty, UBYTE force);

#endif

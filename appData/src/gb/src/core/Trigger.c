#include "Trigger.h"

#include "BankManager.h"
#include "ScriptRunner.h"
#include "Input.h"

Trigger triggers[MAX_TRIGGERS];
UBYTE triggers_active[MAX_ACTIVE_TRIGGERS];
UBYTE triggers_active_size;
UBYTE triggers_len;
UBYTE last_trigger_tx;
UBYTE last_trigger_ty;

UBYTE TriggerAtTile_b(UBYTE tx_a, UBYTE ty_a) __banked;

UBYTE TriggerAtTile(UBYTE tx_a, UBYTE ty_a) {
  return TriggerAtTile_b(tx_a, ty_a);
 }

void TriggerRunScript(UBYTE i) {
  ScriptStart(&triggers[i].events_ptr);
}

UBYTE ActivateTriggerAt(UBYTE tx, UBYTE ty, UBYTE force) {
  UBYTE hit_trigger;

  // Don't reactivate trigger if not changed tile
  if (!force && ((tx == last_trigger_tx) && (ty == last_trigger_ty))) {
    return FALSE;
  }

  hit_trigger = TriggerAtTile(tx, ty);
  last_trigger_tx = tx;
  last_trigger_ty = ty;

  if (hit_trigger != NO_TRIGGER_COLLISON) {
    TriggerRunScript(hit_trigger);
    return TRUE;
  }

  return FALSE;
}

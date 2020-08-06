#include "Trigger.h"

#include "BankManager.h"
#include "ScriptRunner.h"

Trigger triggers[MAX_TRIGGERS];
UBYTE triggers_active[MAX_ACTIVE_TRIGGERS];
UBYTE triggers_active_size;
UBYTE triggers_len;
UBYTE last_trigger_tx;
UBYTE last_trigger_ty;

UBYTE TriggerAtTile_b(UBYTE tx_a, UBYTE ty_a);

UBYTE TriggerAtTile(UBYTE tx_a, UBYTE ty_a) {
  UBYTE val;
  PUSH_BANK(TRIGGER_BANK);
  val = TriggerAtTile_b(tx_a, ty_a);
  POP_BANK;
  return val;
}

void TriggerRunScript(UBYTE i) {
  ScriptStart(&triggers[i].events_ptr);
}

UBYTE ActivateTriggerAt(UBYTE tx, UBYTE ty) {
  UBYTE hit_trigger;

  // Don't reactivate trigger if not changed tile
  if ((tx == last_trigger_tx) && (ty == last_trigger_ty)) {
    return FALSE;
  }

  hit_trigger = TriggerAtTile(tx, ty);
  last_trigger_tx = tx;
  last_trigger_ty = ty;

  if (hit_trigger != MAX_TRIGGERS) {
    TriggerRunScript(hit_trigger);
    return TRUE;
  }

  return FALSE;
}

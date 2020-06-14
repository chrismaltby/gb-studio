#include "Trigger.h"

#include "BankManager.h"
#include "ScriptRunner.h"

Trigger triggers[MAX_TRIGGERS];
UBYTE triggers_active[MAX_ACTIVE_TRIGGERS];
UBYTE triggers_active_size;
UBYTE triggers_len;

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

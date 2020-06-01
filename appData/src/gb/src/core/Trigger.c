#include "Trigger.h"

#include "ScriptRunner.h"

Trigger triggers[MAX_TRIGGERS];
UBYTE triggers_active[MAX_ACTIVE_TRIGGERS];
UBYTE triggers_active_size;
UBYTE triggers_len;

UBYTE TriggerAtTile(UBYTE tx_a, UBYTE ty_a) {
  UBYTE i, tx_b, ty_b, tx_c, ty_c;

  for (i = 0; i != triggers_len; i++) {
    tx_b = triggers[i].x;
    ty_b = triggers[i].y;
    tx_c = tx_b + triggers[i].w - 1;
    ty_c = ty_b + triggers[i].h - 1;

    LOG("CHECK [%u,%u] tx_b=%u ty_b=%u tx_c=%u ty_c=%u\n", tx_a, ty_a, tx_b, ty_b, tx_c, ty_c);

#ifdef COLS_16
    if ((tx_a + 1) >= tx_b && tx_a <= tx_c && ty_a >= ty_b && (ty_a - 1) <= ty_c) {
#else
    if ((tx_a + 1) >= tx_b && tx_a <= tx_c && ty_a >= ty_b && ty_a <= ty_c) {
#endif
      return i;
    }
  }

  return MAX_TRIGGERS;
}

void TriggerRunScript(UBYTE i) {
  ScriptStart(&triggers[i].events_ptr);
}

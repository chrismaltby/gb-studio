#pragma bank 1

#include "Trigger.h"

UBYTE TriggerAtTile_b(UBYTE tx_a, UBYTE ty_a) __banked {
  UBYTE i, tx_b, ty_b, tx_c, ty_c;

  for (i = 0; i != triggers_len; i++) {
    tx_b = triggers[i].x;
    ty_b = triggers[i].y;
    tx_c = tx_b + triggers[i].w - 1;
    ty_c = ty_b + triggers[i].h - 1;

    if ((tx_a + 1) >= tx_b && tx_a <= tx_c && ty_a >= ty_b && ty_a <= ty_c) {
      return i;
    }
  }

  return NO_TRIGGER_COLLISON;
}

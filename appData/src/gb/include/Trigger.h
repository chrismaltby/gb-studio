#ifndef TRIGGER_H
#define TRIGGER_H

#include <gb/gb.h>

#include "BankData.h"
#include "Math.h"

#define TRIGGER_BANK 1
#define MAX_TRIGGERS 31
#define MAX_ACTIVE_TRIGGERS 11

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

UBYTE TriggerAtTile(UBYTE tx_a, UBYTE ty_a);
void TriggerRunScript(UBYTE i);

#endif

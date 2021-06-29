#ifndef BANK_MANAGER_H
#define BANK_MANAGER_H

#include "Stack.h"

#define SWITCH_ROM SWITCH_ROM_MBC1

#ifdef ENABLE_RAM
#undef ENABLE_RAM
#endif
#define ENABLE_RAM ENABLE_RAM_MBC5

#ifdef DISABLE_RAM
#undef DISABLE_RAM
#endif
#define DISABLE_RAM DISABLE_RAM_MBC5

#define N_PUSH_BANKS 10

extern UINT8 bank_stack[];

void PushBank(UINT8 b);
void PopBank();

#define PUSH_BANK(N) PushBank(N);
#define POP_BANK PopBank();

#define REFRESH_BANK SWITCH_ROM(StackPeek(bank_stack))

#endif

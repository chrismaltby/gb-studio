#ifndef MAIN_H
#define MAIN_H

#include <gb/gb.h>

typedef void (*Void_Func_Void)();

extern Void_Func_Void startFuncs[];
extern Void_Func_Void updateFuncs[];
extern UBYTE stateBanks[];

extern UINT8 current_state;
void SetState(UINT8 state);
extern UINT8 delta_time;

#endif

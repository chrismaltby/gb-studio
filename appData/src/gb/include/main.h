#ifndef MAIN_H
#define MAIN_H

#include <gb/gb.h>

typedef void (*Void_Func_Void)();

extern const Void_Func_Void startFuncs[];
extern const Void_Func_Void updateFuncs[];
extern const UBYTE stateBanks[];

#endif

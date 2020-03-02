#ifndef MAIN_H
#define MAIN_H

#include <gb/gb.h>
#include <gbdkjs.h>

typedef void (*Void_Func_Void)();

extern Void_Func_Void startFuncs[];
extern Void_Func_Void updateFuncs[];
extern UBYTE stateBanks[];

#endif

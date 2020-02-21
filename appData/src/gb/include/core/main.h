#ifndef MAIN_H
#define MAIN_H

#include <gbdkjs.h>
#include <gb/gb.h>

typedef void (*Void_Func_Void)();

extern Void_Func_Void startFuncs[];
extern Void_Func_Void updateFuncs[];
extern UBYTE stateBanks[];

#endif

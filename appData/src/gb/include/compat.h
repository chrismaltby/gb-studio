#ifndef _COMPAT_H_INCLUDE
#define _COMPAT_H_INCLUDE

#include <gb/gb.h>

#ifndef OLDCALL
#if __SDCC_REVISION >= 12608
#define OLDCALL __sdcccall(0)
#else
#define OLDCALL
#endif
#endif

#endif
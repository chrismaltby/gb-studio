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

#ifndef PRESERVES_REGS
#ifdef __SDCC
#define PRESERVES_REGS(...) __preserves_regs(__VA_ARGS__)
#else
#define PRESERVES_REGS(...)
#endif
#endif

#ifndef NAKED
#ifdef __SDCC
#define NAKED   __naked
#else
#define NAKED
#endif
#endif

#ifndef SFR
#ifdef __SDCC
#define SFR     __sfr
#else
#define SFR
#endif
#endif

#ifndef AT
#ifdef __SDCC
#define AT(A)   __at(A)
#else
#define AT(A)
#endif
#endif


#endif
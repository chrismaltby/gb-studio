#ifndef __SDCC_STDATOMIC_H
#define __SDCC_STDATOMIC_H 1

#include <types.h>

typedef struct {unsigned char flag;} atomic_flag;

#if defined(__SDCC_z80) || defined(__SDCC_z180) || defined(__SDCC_ez80_z80) || defined(__SDCC_sm83) || defined(__SDCC_r2k) || defined(__SDCC_r3ka) || defined(__SDCC_stm8) || defined(__SDCC_hc08) || defined(__SDCC_s08) || defined(__SDCC_mos6502)
#define ATOMIC_FLAG_INIT {1}
//#elif defined(__SDCC_mcs51)
//#define ATOMIC_FLAG_INIT {0}
#else
#error Support for atomic_flag not implemented
#endif

_Bool atomic_flag_test_and_set(volatile atomic_flag *object) OLDCALL;

void atomic_flag_clear(volatile atomic_flag *object);

#endif


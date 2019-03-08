#ifndef STDARG_INCLUDE
#define STDARG_INCLUDE

#if SDCC_PORT==gbz80
#include <asm/gbz80/stdarg.h>
#elif SDCC_PORT==z80
#include <asm/z80/stdarg.h>
#else
#error Unrecognised port.
#endif

#endif

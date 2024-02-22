#ifndef STDARG_INCLUDE
#define STDARG_INCLUDE

#if defined(__PORT_sm83)
#include <asm/sm83/stdarg.h>
#elif defined(__PORT_z80)
#include <asm/z80/stdarg.h>
#elif defined(__PORT_mos6502)
#include <asm/mos6502/stdarg.h>
#endif

#endif

/** @file string.h
    Generic string functions.
 */
#ifndef STD_STRING_INCLUDE
#define STD_STRING_INCLUDE

#if defined(__PORT_sm83)
  #include <asm/sm83/string.h>
#elif defined(__PORT_z80)
  #include <asm/z80/string.h>
#elif defined(__PORT_mos6502)
  #include <asm/mos6502/string.h>
#else
  #error Unrecognized port
#endif

#endif
